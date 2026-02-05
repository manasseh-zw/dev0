import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { projects, tasks, taskLogs } from '@/lib/db/schema'
import { executionBus } from '@/lib/execution/event-bus'
import {
  executeGeminiStreaming,
  executeCommand,
  getOrCreateProjectSandbox,
} from '@/lib/sandbox/provider'
import type { Task } from '@/lib/types/task'
import {
  isGeminiEvent,
  type GeminiStreamEvent,
} from '@/lib/types/gemini-stream'
import { createTaskLogger, globalLogger } from '@/lib/logging'

type ProjectRunState = {
  runningTaskId: string | null
  sandboxId: string | null
  starting: boolean
}

const projectState = new Map<string, ProjectRunState>()

type StartTaskResult = {
  taskId: string
  sandboxId: string
  alreadyRunning: boolean
}

type CompletionResult = {
  success: boolean
  prUrl?: string
  error?: string
}

type TaskClaimResult =
  | { task: Task }
  | { alreadyRunning: true; runningTaskId: string }

const WORKSPACE_DIR = '$HOME/project'

export async function startTask(
  projectId: string,
  taskId?: string,
): Promise<StartTaskResult> {
  globalLogger.info('orchestrator', 'startTask called', {
    projectId,
    taskId: taskId ?? 'auto',
  })

  const currentState = projectState.get(projectId)

  if (currentState?.runningTaskId || currentState?.starting) {
    globalLogger.info('orchestrator', 'Task already running', {
      projectId,
      runningTaskId: currentState?.runningTaskId,
    })
    return {
      taskId: currentState?.runningTaskId ?? '',
      sandboxId: currentState?.sandboxId ?? '',
      alreadyRunning: true,
    }
  }

  projectState.set(projectId, {
    runningTaskId: null,
    sandboxId: null,
    starting: true,
  })
  globalLogger.debug('orchestrator', 'Set project state to starting', {
    projectId,
  })

  try {
    const claimResult = await claimTaskForExecution(projectId, taskId)
    if ('alreadyRunning' in claimResult) {
      projectState.set(projectId, {
        runningTaskId: claimResult.runningTaskId,
        sandboxId: null,
        starting: false,
      })
      return {
        taskId: claimResult.runningTaskId,
        sandboxId: '',
        alreadyRunning: true,
      }
    }

    const task = claimResult.task

    let sandboxId = ''

    try {
      globalLogger.info('orchestrator', 'Getting or creating sandbox', {
        projectId,
        taskId: task.id,
      })
      const sandbox = await getOrCreateProjectSandbox(projectId, task.id)
      sandboxId = sandbox.id
      globalLogger.info('orchestrator', 'Sandbox ready', {
        projectId,
        taskId: task.id,
        sandboxId,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sandbox error'
      globalLogger.error('orchestrator', 'Failed to get/create sandbox', error)
      await handleTaskStartFailure(projectId, task.id, message)
      throw error
    }

    projectState.set(projectId, {
      runningTaskId: task.id,
      sandboxId,
      starting: false,
    })

    globalLogger.debug('orchestrator', 'Emitting task_started event', {
      projectId,
      taskId: task.id,
      sandboxId,
    })
    executionBus.emit({
      type: 'task_started',
      projectId,
      taskId: task.id,
      sandboxId,
    })

    globalLogger.info('orchestrator', 'Starting async task execution', {
      projectId,
      taskId: task.id,
    })
    void runTaskExecution(projectId, task, sandboxId)

    return {
      taskId: task.id,
      sandboxId,
      alreadyRunning: false,
    }
  } finally {
    const state = projectState.get(projectId)
    if (state?.starting && !state.runningTaskId) {
      projectState.set(projectId, {
        runningTaskId: null,
        sandboxId: null,
        starting: false,
      })
    }
  }
}

export async function completeTask(
  projectId: string,
  taskId: string,
  result: CompletionResult,
): Promise<void> {
  globalLogger.info('orchestrator', 'completeTask called', {
    projectId,
    taskId,
    success: result.success,
    prUrl: result.prUrl,
    error: result.error,
  })

  if (result.success) {
    await db
      .update(tasks)
      .set({
        status: 'REVIEW',
        prUrl: result.prUrl ?? null,
      })
      .where(eq(tasks.id, taskId))

    executionBus.emit({
      type: 'task_review',
      projectId,
      taskId,
      prUrl: result.prUrl,
    })
  } else {
    await db
      .update(tasks)
      .set({
        status: 'FAILED',
        prUrl: result.prUrl ?? null,
        attempts: sql`${tasks.attempts} + 1`,
      })
      .where(eq(tasks.id, taskId))

    executionBus.emit({
      type: 'task_failed',
      projectId,
      taskId,
      error: result.error ?? 'Task failed',
    })
  }

  const currentState = projectState.get(projectId)
  if (currentState?.runningTaskId === taskId) {
    projectState.set(projectId, {
      runningTaskId: null,
      sandboxId: null,
      starting: false,
    })
  }
}

export async function getNextRunnableTask(
  projectId: string,
): Promise<Task | null> {
  const allTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(asc(tasks.phase), asc(tasks.order))

  const statusById = new Map(allTasks.map((task) => [task.id, task.status]))

  const isComplete = (status: Task['status'] | undefined) =>
    status === 'DONE' || status === 'SKIPPED'

  const runnable = allTasks.find((task, index) => {
    if (task.status !== 'PENDING') {
      return false
    }

    const hasUnmetDependencies = !task.dependencies.every((dependencyId) =>
      isComplete(statusById.get(dependencyId)),
    )

    if (hasUnmetDependencies) {
      return false
    }

    const hasPriorIncomplete = allTasks
      .slice(0, index)
      .some((prior) => !isComplete(prior.status))

    return !hasPriorIncomplete
  })

  return runnable ?? null
}

export function isProjectRunning(projectId: string): boolean {
  const state = projectState.get(projectId)
  return Boolean(state?.runningTaskId || state?.starting)
}

async function runTaskExecution(
  projectId: string,
  task: Task,
  sandboxId: string,
): Promise<void> {
  // Create task logger for this execution
  const logger = createTaskLogger(task.id, projectId)
  logger.logOrchestrator('Task execution started', {
    taskId: task.id,
    taskTitle: task.title,
    projectId,
    sandboxId,
  })

  // Collect events for persistence
  const collectedEvents: GeminiStreamEvent[] = []

  try {
    const project = await getProjectById(projectId)
    await syncRepoToDefaultBranch(sandboxId, logger)
    const runDir = `${WORKSPACE_DIR}/.dev0/runs/${task.id}`
    await executeCommand(sandboxId, `mkdir -p "${runDir}"`, {
      cwd: WORKSPACE_DIR,
    })
    const prompt = buildTaskPrompt(project, task, runDir)
    logger.logOrchestrator('Built prompt, executing Gemini CLI', {
      promptLength: prompt.length,
    })

    let stdoutBuffer = ''
    const handleStdoutLine = (line: string) => {
      if (!line.trim()) return
      try {
        const parsed = JSON.parse(line)
        const geminiEvent = isGeminiEvent(parsed) ? parsed : undefined

        if (geminiEvent) {
          logger.logEvent(geminiEvent)
          collectedEvents.push(geminiEvent)
        }

        executionBus.emit({
          type: 'task_log',
          projectId,
          taskId: task.id,
          log: line,
          stream: 'stdout',
          geminiEvent,
        })
      } catch {
        logger.logStream('stdout', line)
        executionBus.emit({
          type: 'task_log',
          projectId,
          taskId: task.id,
          log: line,
          stream: 'stdout',
        })
      }
    }
    const result = await executeGeminiStreaming(
      sandboxId,
      {
        prompt,
        model: task.geminiModel,
        yolo: true,
        cwd: WORKSPACE_DIR,
      },
      {
        onStdout: (chunk) => {
          // Parse JSONL events from --output-format stream-json
          stdoutBuffer += chunk
          const lines = stdoutBuffer.split('\n')
          stdoutBuffer = lines.pop() ?? ''
          for (const line of lines) {
            handleStdoutLine(line)
          }
        },
        onStderr: (chunk) => {
          logger.logStream('stderr', chunk)
          executionBus.emit({
            type: 'task_log',
            projectId,
            taskId: task.id,
            log: chunk,
            stream: 'stderr',
          })
        },
        onComplete: () => {
          if (!stdoutBuffer.trim()) return
          const line = stdoutBuffer.trim()
          stdoutBuffer = ''
          handleStdoutLine(line)
        },
      },
    )

    // Persist logs to database
    await persistTaskLogs(task.id, collectedEvents, result.duration)

    const agentResultPath = `${runDir}/agent-result.json`
    const agentResult = await readAgentResult(sandboxId, agentResultPath)

    const prUrl = extractPrUrl(`${result.stdout}\n${result.stderr}`)
    logger.logOrchestrator('Gemini CLI finished', {
      exitCode: result.exitCode,
      prUrl,
      durationMs: result.duration,
    })

    if (result.exitCode === 0) {
      const finalize = await finalizeTaskChanges(
        sandboxId,
        task,
        project,
        agentResult,
        logger,
      )

      if (finalize.error) {
        logger.complete(result.duration, false, finalize.error)
        await completeTask(projectId, task.id, {
          success: false,
          error: finalize.error,
          prUrl: finalize.prUrl ?? prUrl,
        })
        return
      }

      logger.complete(result.duration, true)
      await completeTask(projectId, task.id, {
        success: true,
        prUrl: finalize.prUrl ?? prUrl,
      })
    } else {
      const errorMsg = result.stderr || 'Command exited with non-zero status'
      logger.complete(result.duration, false, errorMsg)
      await completeTask(projectId, task.id, {
        success: false,
        error: errorMsg,
        prUrl,
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('orchestrator', 'Task execution error', error)

    // Persist any collected events even on error
    if (collectedEvents.length > 0) {
      await persistTaskLogs(task.id, collectedEvents, 0).catch(() => {
        // Ignore persistence errors during error handling
      })
    }

    logger.complete(logger.getElapsedMs(), false, message)
    await completeTask(projectId, task.id, {
      success: false,
      error: message,
    })
  }
}

async function readAgentResult(
  sandboxId: string,
  resultPath: string,
): Promise<{
  status: 'success' | 'failed'
  commitMessage?: string
  prTitle?: string
  prBody?: string
  notes?: string
} | null> {
  const readResult = await executeCommand(sandboxId, `cat "${resultPath}"`, {
    cwd: WORKSPACE_DIR,
  })

  if (readResult.exitCode !== 0 || !readResult.stdout.trim()) {
    return null
  }

  try {
    return JSON.parse(readResult.stdout)
  } catch {
    return null
  }
}

async function finalizeTaskChanges(
  sandboxId: string,
  task: Task,
  project: { repoUrl: string | null; repoName: string | null },
  agentResult: {
    status: 'success' | 'failed'
    commitMessage?: string
    prTitle?: string
    prBody?: string
  } | null,
  logger: ReturnType<typeof createTaskLogger>,
): Promise<{ prUrl?: string; error?: string }> {
  logger.logOrchestrator('Starting finalizeTaskChanges', {
    taskId: task.id,
    repoUrl: project.repoUrl,
    repoName: project.repoName,
    hasAgentResult: !!agentResult,
  })

  if (!project.repoUrl && !project.repoName) {
    logger.error('finalizeTaskChanges', 'Missing project repository info')
    return { error: 'Missing project repository info' }
  }

  const remoteUrl = withGithubToken(project.repoUrl, project.repoName)
  if (!remoteUrl) {
    logger.error(
      'finalizeTaskChanges',
      'Failed to build authenticated remote URL',
    )
    return { error: 'Missing repository URL' }
  }

  logger.logOrchestrator('Setting git remote with authentication', {
    repoName: project.repoName,
    hasToken: remoteUrl.includes('x-access-token'),
  })

  const remoteCommand = `git remote set-url origin "${escapeShellDoubleQuotes(remoteUrl)}"`
  const remoteResult = await executeCommand(sandboxId, remoteCommand, {
    cwd: WORKSPACE_DIR,
  })
  logger.logGitOperation(
    'remote-set-url',
    remoteCommand,
    remoteResult,
    remoteResult.exitCode === 0,
  )

  if (remoteResult.exitCode !== 0) {
    return { error: 'Failed to set authenticated remote' }
  }

  const branchName = `dev0/task-${task.id}`
  const commitMessage =
    agentResult?.commitMessage?.trim() || `feat: complete task ${task.title}`
  const prTitle = agentResult?.prTitle?.trim() || `feat: ${task.title}`
  const prBody = agentResult?.prBody?.trim() || ''

  logger.logOrchestrator('Git configuration', {
    branchName,
    commitMessageLength: commitMessage.length,
    prTitleLength: prTitle.length,
    prBodyLength: prBody.length,
  })

  const gitConfigCommand =
    'git config user.email "dev0-agent@users.noreply.github.com" && git config user.name "dev0-agent"'
  const gitConfig = await executeCommand(sandboxId, gitConfigCommand, {
    cwd: WORKSPACE_DIR,
  })
  logger.logGitOperation(
    'config',
    gitConfigCommand,
    gitConfig,
    gitConfig.exitCode === 0,
  )

  if (gitConfig.exitCode !== 0) {
    return { error: 'Failed to configure git user' }
  }

  const checkoutCommand = `git checkout -B "${branchName}"`
  const prepareBranch = await executeCommand(sandboxId, checkoutCommand, {
    cwd: WORKSPACE_DIR,
  })
  logger.logGitOperation(
    'checkout',
    checkoutCommand,
    prepareBranch,
    prepareBranch.exitCode === 0,
  )

  if (prepareBranch.exitCode !== 0) {
    return { error: 'Failed to create branch' }
  }

  const fetchCommand = 'git fetch origin --prune'
  const fetchResult = await executeCommand(sandboxId, fetchCommand, {
    cwd: WORKSPACE_DIR,
  })
  logger.logGitOperation(
    'fetch',
    fetchCommand,
    fetchResult,
    fetchResult.exitCode === 0,
  )

  if (fetchResult.exitCode === 0) {
    const defaultBranchCommand =
      'git symbolic-ref refs/remotes/origin/HEAD --short'
    const defaultBranchResult = await executeCommand(
      sandboxId,
      defaultBranchCommand,
      {
        cwd: WORKSPACE_DIR,
      },
    )
    logger.logGitOperation(
      'default-branch',
      defaultBranchCommand,
      defaultBranchResult,
      defaultBranchResult.exitCode === 0,
    )

    if (defaultBranchResult.exitCode === 0) {
      const defaultBranch = defaultBranchResult.stdout
        .trim()
        .replace(/^origin\//, '')
      if (defaultBranch) {
        const rebaseCommand = `git rebase "origin/${defaultBranch}"`
        const rebaseResult = await executeCommand(sandboxId, rebaseCommand, {
          cwd: WORKSPACE_DIR,
        })
        logger.logGitOperation(
          'rebase',
          rebaseCommand,
          rebaseResult,
          rebaseResult.exitCode === 0,
        )

        if (rebaseResult.exitCode !== 0) {
          const abortCommand = 'git rebase --abort'
          const abortResult = await executeCommand(sandboxId, abortCommand, {
            cwd: WORKSPACE_DIR,
          })
          logger.logGitOperation(
            'rebase-abort',
            abortCommand,
            abortResult,
            abortResult.exitCode === 0,
          )
          logger.warn('finalizeTaskChanges', 'Rebase failed, continuing', {
            branchName,
            defaultBranch,
          })
        }
      }
    }
  }

  const addCommand = 'git add -A'
  const addResult = await executeCommand(sandboxId, addCommand, {
    cwd: WORKSPACE_DIR,
  })
  logger.logGitOperation('add', addCommand, addResult, addResult.exitCode === 0)

  if (addResult.exitCode !== 0) {
    return { error: 'Failed to stage changes' }
  }

  const diffCommand = 'git diff --cached --quiet'
  const diffResult = await executeCommand(sandboxId, diffCommand, {
    cwd: WORKSPACE_DIR,
  })
  logger.logGitOperation('diff-cached', diffCommand, diffResult, true)

  if (diffResult.exitCode === 0) {
    logger.warn('finalizeTaskChanges', 'No staged changes to commit')
    return { error: 'No changes to commit' }
  }

  const commitCommand = `git -c core.compression=0 -c http.compression=0 -c http.version=HTTP/1.1 commit -m "${escapeShellDoubleQuotes(
    commitMessage,
  )}"`
  const commitResult = await executeCommand(sandboxId, commitCommand, {
    cwd: WORKSPACE_DIR,
  })
  logger.logGitOperation(
    'commit',
    commitCommand,
    commitResult,
    commitResult.exitCode === 0,
  )

  if (commitResult.exitCode !== 0) {
    return { error: 'Git commit failed' }
  }

  logger.logOrchestrator('Pushing branch to origin', { branchName })

  const pushCommand = `GIT_HTTP_VERSION=HTTP/1.1 git -c core.compression=0 -c http.compression=0 -c http.version=HTTP/1.1 push -u origin "${branchName}"`
  const pushResult = await executeCommand(sandboxId, pushCommand, {
    cwd: WORKSPACE_DIR,
  })
  logger.logGitOperation(
    'push',
    pushCommand,
    pushResult,
    pushResult.exitCode === 0,
  )

  if (pushResult.exitCode !== 0) {
    return { error: 'Git push failed' }
  }

  logger.logOrchestrator('Creating GitHub PR', {
    prTitle,
    prBodyLength: prBody.length,
  })

  const prCommand = `GODEBUG=http2client=0 GH_PAGER=cat GIT_HTTP_VERSION=HTTP/1.1 gh pr create --title "${escapeShellDoubleQuotes(
    prTitle,
  )}" --body "${escapeShellDoubleQuotes(prBody)}"`
  const prResult = await executeCommand(sandboxId, prCommand, {
    cwd: WORKSPACE_DIR,
  })

  // Log PR creation separately since it uses 'gh' not git
  logger.logOrchestrator('gh pr create result', {
    command: prCommand,
    exitCode: prResult.exitCode,
    stdout: prResult.stdout || undefined,
    stderr: prResult.stderr || undefined,
    success: prResult.exitCode === 0,
  })

  if (prResult.exitCode !== 0) {
    return { error: 'gh pr create failed' }
  }

  const prUrl = extractPrUrl(`${prResult.stdout}\n${prResult.stderr}`)
  logger.logOrchestrator('PR created successfully', { prUrl, branchName })

  return { prUrl }
}

function withGithubToken(
  repoUrl: string | null,
  repoName: string | null,
): string {
  const owner = env.GITHUB_BOT_USERNAME
  const url = repoUrl
    ? repoUrl
    : repoName
      ? `https://github.com/${owner}/${repoName}.git`
      : ''

  if (!url) return ''

  try {
    const parsed = new URL(url)
    if (parsed.hostname !== 'github.com') return url
    if (parsed.username || parsed.password) return url
    parsed.username = 'x-access-token'
    parsed.password = env.GITHUB_TOKEN
    return parsed.toString()
  } catch {
    return url
  }
}

function escapeShellDoubleQuotes(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

async function syncRepoToDefaultBranch(
  sandboxId: string,
  logger: ReturnType<typeof createTaskLogger>,
): Promise<void> {
  const fetchCommand = 'git fetch origin --prune'
  const fetchResult = await executeCommand(sandboxId, fetchCommand, {
    cwd: WORKSPACE_DIR,
  })
  logger.logGitOperation(
    'fetch',
    fetchCommand,
    fetchResult,
    fetchResult.exitCode === 0,
  )

  if (fetchResult.exitCode !== 0) return

  const defaultBranchCommand =
    'git symbolic-ref refs/remotes/origin/HEAD --short'
  const defaultBranchResult = await executeCommand(
    sandboxId,
    defaultBranchCommand,
    {
      cwd: WORKSPACE_DIR,
    },
  )
  logger.logGitOperation(
    'default-branch',
    defaultBranchCommand,
    defaultBranchResult,
    defaultBranchResult.exitCode === 0,
  )

  if (defaultBranchResult.exitCode !== 0) return

  const defaultBranch = defaultBranchResult.stdout
    .trim()
    .replace(/^origin\//, '')
  if (!defaultBranch) return

  const checkoutCommand = `git checkout "${defaultBranch}"`
  const checkoutResult = await executeCommand(sandboxId, checkoutCommand, {
    cwd: WORKSPACE_DIR,
  })
  logger.logGitOperation(
    'checkout-base',
    checkoutCommand,
    checkoutResult,
    checkoutResult.exitCode === 0,
  )

  if (checkoutResult.exitCode !== 0) return

  const pullCommand = `git pull --ff-only origin "${defaultBranch}"`
  const pullResult = await executeCommand(sandboxId, pullCommand, {
    cwd: WORKSPACE_DIR,
  })
  logger.logGitOperation(
    'pull',
    pullCommand,
    pullResult,
    pullResult.exitCode === 0,
  )
}

/**
 * Persist Gemini CLI events to the task_logs table
 */
async function persistTaskLogs(
  taskId: string,
  events: GeminiStreamEvent[],
  durationMs: number,
): Promise<void> {
  if (events.length === 0) return

  // Extract stats from the result event if present
  const resultEvent = events.find((e) => e.type === 'result')
  const stats = resultEvent?.type === 'result' ? resultEvent.stats : undefined

  // Find the last assistant message for summary, prefer non-delta content
  const assistantMessages = events.filter(
    (event) => event.type === 'message' && event.role === 'assistant',
  )
  const lastFullMessage = [...assistantMessages]
    .reverse()
    .find((event) => event.type === 'message' && !event.delta)
  const lastMessage = lastFullMessage ?? assistantMessages.at(-1)
  const summary =
    lastMessage?.type === 'message' ? lastMessage.content : undefined

  // Count tool calls
  const toolCallsCount = events.filter((e) => e.type === 'tool_use').length

  try {
    await db
      .insert(taskLogs)
      .values({
        taskId,
        events,
        summary: summary?.slice(0, 2000), // Truncate long summaries
        totalTokens: stats?.total_tokens ?? null,
        durationMs: stats?.duration_ms ?? durationMs,
        toolCallsCount,
      })
      .onConflictDoUpdate({
        target: taskLogs.taskId,
        set: {
          events,
          summary: summary?.slice(0, 2000),
          totalTokens: stats?.total_tokens ?? null,
          durationMs: stats?.duration_ms ?? durationMs,
          toolCallsCount,
          updatedAt: new Date(),
        },
      })
    globalLogger.info(
      'orchestrator',
      `Persisted ${events.length} events for task ${taskId}`,
      { taskId, eventCount: events.length },
    )
  } catch (error) {
    globalLogger.error('orchestrator', 'Failed to persist task logs', error)
  }
}

function buildTaskPrompt(
  project: {
    id: string
    name: string
    description: string | null
    repoUrl: string | null
    repoName: string | null
    techStack: string
    specContent: string | null
  },
  task: Task,
  runDir: string,
): string {
  const projectInfo = [
    `Project: ${project.name}`,
    project.description ? `Description: ${project.description}` : null,
    project.repoName ? `Repo: ${project.repoName}` : null,
    project.repoUrl ? `Repo URL: ${project.repoUrl}` : null,
    `Tech stack: ${project.techStack}`,
  ]
    .filter(Boolean)
    .join('\n')

  const taskInfo = [
    `Task ID: ${task.id}`,
    `Title: ${task.title}`,
    task.description ? `Description: ${task.description}` : null,
    `Phase: ${task.phase}`,
    `Order: ${task.order}`,
  ]
    .filter(Boolean)
    .join('\n')

  const specBlock = project.specContent
    ? `\n\nProject Spec:\n${project.specContent}`
    : ''

  return `You are an autonomous coding agent working inside a sandboxed repo at ${WORKSPACE_DIR}.

${projectInfo}

${taskInfo}${specBlock}

Requirements:
- Implement the task in the repo.
- Only implement the single assigned task. Do not work on other tasks from TASKLIST.md or the broader project plan.
- Follow any guidance in .dev0/RULES.md if present.
- Update TASKLIST.md if it exists.
- Update LEARNINGS.md only when you discover a reusable insight or non-obvious fix.
- Keep changes scoped to the task and run relevant checks if needed.
- Assume this is a sandboxed environment; environment variables or external services are NOT configured. The database does NOT exist. NEVER make real network connections or run commands that require external services.
- Use bun for installs and scripts (bun install, bun run, etc.).
- If you add new environment variables, document them in .env.example.
- Do NOT run build commands (bun run build, npm run build, etc.) or dev servers (bun run dev, npm run dev, etc.) in the sandbox - these will hang indefinitely and cause the task to fail.
- For type checking, ONLY run: bunx tsc --noEmit (do NOT use bun run typecheck or other build scripts)
- Do NOT run eslint or use npx. Only run the allowed type check command above if validation is needed.
- Do NOT run database migrations, drizzle-kit push, prisma migrate, or any database-related commands - the database is not configured in the sandbox.
- Do NOT run any schema/code generation commands for the database (drizzle-kit generate, prisma generate, migrations, or similar) - we only validate code changes, not DB schema generation.
- Do NOT run integration tests or any commands requiring external dependencies (databases, APIs, etc.) - only verify code logic is correct.
- When you MUST run CLI commands that prompt for confirmation, use --force or --yes flags, but prefer not to run such commands at all.
- Shadcn UI components are already present in src/components/ui across all templates. Do NOT run the shadcn CLI; import from the existing components.
- Do NOT delete or modify .gemini temp/state directories (e.g., $HOME/.gemini/tmp). Never run rm -rf on .gemini paths.
- If this is a TanStack Start project, do not try to resolve route tree/type errors by running a dev server or build command; note the issue in LEARNINGS.md and proceed.
- Do NOT run git commit, git push, or gh pr create.
 - Write a JSON file at ${runDir}/agent-result.json with:
   {"status":"success|failed","commitMessage":"...","prTitle":"...","prBody":"...","notes":"..."}

Finish by summarizing what you changed.`
}

function extractPrUrl(text: string): string | undefined {
  const match = text.match(/https?:\/\/github\.com\/[^\s]+\/pull\/\d+/)
  return match?.[0]
}

async function getTaskById(projectId: string, taskId: string): Promise<Task> {
  const record = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1)

  if (!record[0] || record[0].projectId !== projectId) {
    throw new Error('Task not found for this project')
  }

  return record[0]
}

async function getProjectById(projectId: string) {
  const record = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      repoUrl: projects.repoUrl,
      repoName: projects.repoName,
      techStack: projects.techStack,
      specContent: projects.specContent,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1)

  if (!record[0]) {
    throw new Error('Project not found')
  }

  return record[0]
}

async function getRunningTaskId(projectId: string): Promise<string | null> {
  const record = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), eq(tasks.status, 'RUNNING')))
    .orderBy(desc(tasks.updatedAt))
    .limit(1)

  return record[0]?.id ?? null
}

async function getTaskStatus(taskId: string): Promise<Task['status'] | null> {
  const record = await db
    .select({ status: tasks.status })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1)

  return record[0]?.status ?? null
}

async function claimPendingTask(taskId: string): Promise<boolean> {
  const updated = await db
    .update(tasks)
    .set({ status: 'RUNNING' })
    .where(and(eq(tasks.id, taskId), eq(tasks.status, 'PENDING')))
    .returning()

  return Boolean(updated[0])
}

async function handleTaskStartFailure(
  projectId: string,
  taskId: string,
  message: string,
): Promise<void> {
  await db
    .update(tasks)
    .set({
      status: 'FAILED',
      attempts: sql`${tasks.attempts} + 1`,
    })
    .where(eq(tasks.id, taskId))

  executionBus.emit({
    type: 'task_failed',
    projectId,
    taskId,
    error: message,
  })

  projectState.set(projectId, {
    runningTaskId: null,
    sandboxId: null,
    starting: false,
  })
}

async function claimTaskForExecution(
  projectId: string,
  taskId?: string,
): Promise<TaskClaimResult> {
  if (taskId) {
    const task = await getTaskById(projectId, taskId)
    const updated = await claimPendingTask(task.id)
    if (updated) {
      return { task }
    }

    const status = await getTaskStatus(task.id)
    const runningTaskId = await getRunningTaskId(projectId)
    if (runningTaskId) {
      return { alreadyRunning: true, runningTaskId }
    }
    throw new Error(`Task is not pending (status: ${status ?? 'unknown'})`)
  }

  let lastFailedTaskId: string | null = null
  let lastFailedStatus: Task['status'] | null = null

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const task = await getNextRunnableTask(projectId)
    if (!task) {
      throw new Error('No runnable task found for this project')
    }
    const updated = await claimPendingTask(task.id)
    if (updated) {
      return { task }
    }
    lastFailedTaskId = task.id
    lastFailedStatus = await getTaskStatus(task.id)
  }

  const runningTaskId = await getRunningTaskId(projectId)
  if (runningTaskId) {
    return { alreadyRunning: true, runningTaskId }
  }
  if (lastFailedTaskId) {
    throw new Error(
      `Unable to claim task ${lastFailedTaskId} (status: ${lastFailedStatus ?? 'unknown'})`,
    )
  }
  throw new Error('Unable to claim a runnable task')
}
