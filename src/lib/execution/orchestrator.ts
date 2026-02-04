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
  console.log(
    `[ORCHESTRATOR] startTask called - projectId: ${projectId}, taskId: ${taskId ?? 'auto'}`,
  )

  const currentState = projectState.get(projectId)

  if (currentState?.runningTaskId || currentState?.starting) {
    console.log(
      `[ORCHESTRATOR] Task already running for project ${projectId} - taskId: ${currentState?.runningTaskId}`,
    )
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
  console.log(`[ORCHESTRATOR] Set project state to starting`)

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
      console.log(
        `[ORCHESTRATOR] Getting or creating sandbox for project ${projectId}, task ${task.id}`,
      )
      const sandbox = await getOrCreateProjectSandbox(projectId, task.id)
      sandboxId = sandbox.id
      console.log(`[ORCHESTRATOR] Sandbox ready - sandboxId: ${sandboxId}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sandbox error'
      await handleTaskStartFailure(projectId, task.id, message)
      throw error
    }

    projectState.set(projectId, {
      runningTaskId: task.id,
      sandboxId,
      starting: false,
    })

    console.log(
      `[ORCHESTRATOR] Emitting task_started event for task ${task.id}`,
    )
    executionBus.emit({
      type: 'task_started',
      projectId,
      taskId: task.id,
      sandboxId,
    })

    console.log(`[ORCHESTRATOR] Starting async task execution...`)
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
  console.log(
    `[ORCHESTRATOR] completeTask called - taskId: ${taskId}, success: ${result.success}, prUrl: ${result.prUrl ?? 'none'}`,
  )

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
  console.log(`[ORCHESTRATOR] runTaskExecution started - task: ${task.title}`)

  // Collect events for persistence
  const collectedEvents: GeminiStreamEvent[] = []

  try {
    const project = await getProjectById(projectId)
    const runDir = `${WORKSPACE_DIR}/.dev0/runs/${task.id}`
    await executeCommand(sandboxId, `mkdir -p "${runDir}"`, {
      cwd: WORKSPACE_DIR,
    })
    const prompt = buildTaskPrompt(project, task, runDir)
    console.log(`[ORCHESTRATOR] Built prompt, executing Gemini CLI...`)

    let stdoutBuffer = ''
    const handleStdoutLine = (line: string) => {
      if (!line.trim()) return
      try {
        const parsed = JSON.parse(line)
        const geminiEvent = isGeminiEvent(parsed) ? parsed : undefined

        if (geminiEvent) {
          console.log(`[GEMINI] Event: ${geminiEvent.type}`)
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
          console.log(`[GEMINI] stderr: ${chunk.slice(0, 100)}`)
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
    console.log(
      `[ORCHESTRATOR] Gemini CLI finished - exitCode: ${result.exitCode}, prUrl: ${prUrl ?? 'none'}`,
    )

    if (result.exitCode === 0) {
      const finalize = await finalizeTaskChanges(
        sandboxId,
        task,
        project,
        agentResult,
      )

      if (finalize.error) {
        await completeTask(projectId, task.id, {
          success: false,
          error: finalize.error,
          prUrl: finalize.prUrl ?? prUrl,
        })
        return
      }

      console.log(`[ORCHESTRATOR] Task completed successfully`)
      await completeTask(projectId, task.id, {
        success: true,
        prUrl: finalize.prUrl ?? prUrl,
      })
    } else {
      console.log(
        `[ORCHESTRATOR] Task failed - stderr: ${result.stderr?.slice(0, 200)}`,
      )
      await completeTask(projectId, task.id, {
        success: false,
        error: result.stderr || 'Command exited with non-zero status',
        prUrl,
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[ORCHESTRATOR] Task execution error: ${message}`)

    // Persist any collected events even on error
    if (collectedEvents.length > 0) {
      await persistTaskLogs(task.id, collectedEvents, 0).catch(() => {
        // Ignore persistence errors during error handling
      })
    }

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
): Promise<{ prUrl?: string; error?: string }> {
  if (!project.repoUrl && !project.repoName) {
    return { error: 'Missing project repository info' }
  }

  const remoteUrl = withGithubToken(project.repoUrl, project.repoName)
  if (!remoteUrl) {
    console.log('[ORCHESTRATOR] finalizeTaskChanges: missing repository URL')
    return { error: 'Missing repository URL' }
  }

  const remoteResult = await executeCommand(
    sandboxId,
    `git remote set-url origin "${escapeShellDoubleQuotes(remoteUrl)}"`,
    { cwd: WORKSPACE_DIR },
  )
  if (remoteResult.exitCode !== 0) {
    console.log(
      `[ORCHESTRATOR] finalizeTaskChanges: git remote set-url failed (exit ${remoteResult.exitCode})`,
    )
    if (remoteResult.stderr) {
      console.log(
        `[ORCHESTRATOR] finalizeTaskChanges: git remote stderr: ${remoteResult.stderr.slice(0, 400)}`,
      )
    }
    return { error: 'Failed to set authenticated remote' }
  }

  const branchName = `dev0/task-${task.id}`
  const commitMessage =
    agentResult?.commitMessage?.trim() || `feat: complete task ${task.title}`
  const prTitle = agentResult?.prTitle?.trim() || `feat: ${task.title}`
  const prBody = agentResult?.prBody?.trim() || ''

  const gitConfig = await executeCommand(
    sandboxId,
    'git config user.email "dev0-agent@users.noreply.github.com" && git config user.name "dev0-agent"',
    { cwd: WORKSPACE_DIR },
  )
  if (gitConfig.exitCode !== 0) {
    console.log(
      `[ORCHESTRATOR] finalizeTaskChanges: git config failed (exit ${gitConfig.exitCode})`,
    )
    if (gitConfig.stderr) {
      console.log(
        `[ORCHESTRATOR] finalizeTaskChanges: git config stderr: ${gitConfig.stderr.slice(0, 400)}`,
      )
    }
    return { error: 'Failed to configure git user' }
  }

  const prepareBranch = await executeCommand(
    sandboxId,
    `git checkout -B "${branchName}"`,
    { cwd: WORKSPACE_DIR },
  )
  if (prepareBranch.exitCode !== 0) {
    console.log(
      `[ORCHESTRATOR] finalizeTaskChanges: git checkout failed (exit ${prepareBranch.exitCode})`,
    )
    if (prepareBranch.stderr) {
      console.log(
        `[ORCHESTRATOR] finalizeTaskChanges: git checkout stderr: ${prepareBranch.stderr.slice(0, 400)}`,
      )
    }
    return { error: 'Failed to create branch' }
  }

  const addResult = await executeCommand(sandboxId, 'git add -A', {
    cwd: WORKSPACE_DIR,
  })
  if (addResult.exitCode !== 0) {
    console.log(
      `[ORCHESTRATOR] finalizeTaskChanges: git add failed (exit ${addResult.exitCode})`,
    )
    if (addResult.stderr) {
      console.log(
        `[ORCHESTRATOR] finalizeTaskChanges: git add stderr: ${addResult.stderr.slice(0, 400)}`,
      )
    }
    return { error: 'Failed to stage changes' }
  }

  const diffResult = await executeCommand(
    sandboxId,
    'git diff --cached --quiet',
    { cwd: WORKSPACE_DIR },
  )
  if (diffResult.exitCode === 0) {
    console.log('[ORCHESTRATOR] finalizeTaskChanges: no staged changes')
    return { error: 'No changes to commit' }
  }

  const commitResult = await executeCommand(
    sandboxId,
    `git -c core.compression=0 -c http.compression=0 -c http.version=HTTP/1.1 commit -m "${escapeShellDoubleQuotes(
      commitMessage,
    )}"`,
    { cwd: WORKSPACE_DIR },
  )
  if (commitResult.exitCode !== 0) {
    console.log(
      `[ORCHESTRATOR] finalizeTaskChanges: git commit failed (exit ${commitResult.exitCode})`,
    )
    if (commitResult.stderr) {
      console.log(
        `[ORCHESTRATOR] finalizeTaskChanges: git commit stderr: ${commitResult.stderr.slice(0, 400)}`,
      )
    }
    return { error: 'Git commit failed' }
  }

  const pushResult = await executeCommand(
    sandboxId,
    `GIT_HTTP_VERSION=HTTP/1.1 git -c core.compression=0 -c http.compression=0 -c http.version=HTTP/1.1 push -u origin "${branchName}"`,
    { cwd: WORKSPACE_DIR },
  )
  if (pushResult.exitCode !== 0) {
    console.log(
      `[ORCHESTRATOR] finalizeTaskChanges: git push failed (exit ${pushResult.exitCode})`,
    )
    if (pushResult.stderr) {
      console.log(
        `[ORCHESTRATOR] finalizeTaskChanges: git push stderr: ${pushResult.stderr.slice(0, 400)}`,
      )
    }
    return { error: 'Git push failed' }
  }

  const prResult = await executeCommand(
    sandboxId,
    `GODEBUG=http2client=0 GH_PAGER=cat GIT_HTTP_VERSION=HTTP/1.1 gh pr create --title "${escapeShellDoubleQuotes(
      prTitle,
    )}" --body "${escapeShellDoubleQuotes(prBody)}"`,
    { cwd: WORKSPACE_DIR },
  )
  if (prResult.exitCode !== 0) {
    console.log(
      `[ORCHESTRATOR] finalizeTaskChanges: gh pr create failed (exit ${prResult.exitCode})`,
    )
    if (prResult.stdout) {
      console.log(
        `[ORCHESTRATOR] finalizeTaskChanges: gh pr stdout: ${prResult.stdout.slice(0, 400)}`,
      )
    }
    if (prResult.stderr) {
      console.log(
        `[ORCHESTRATOR] finalizeTaskChanges: gh pr stderr: ${prResult.stderr.slice(0, 400)}`,
      )
    }
    return { error: 'gh pr create failed' }
  }

  const prUrl = extractPrUrl(`${prResult.stdout}\n${prResult.stderr}`)
  console.log(
    `[ORCHESTRATOR] finalizeTaskChanges: pr created ${prUrl ?? 'unknown'}`,
  )
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
    console.log(
      `[ORCHESTRATOR] Persisted ${events.length} events for task ${taskId}`,
    )
  } catch (error) {
    console.error(`[ORCHESTRATOR] Failed to persist task logs: ${error}`)
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
- Assume this is a sandboxed environment; environment variables or external services may be unavailable. Avoid making real network connections that require secrets. Ensure logic is correct and would work when env vars are provided.
- Use bun for installs and scripts (bun install, bun run, etc.).
- If you add new environment variables, document them in .env.example.
- Do NOT run long-lived dev servers (bun run dev, npm run dev, etc.). Prefer bun run typecheck/tsc and bun run build when needed.
- If this is a TanStack Start project, do not try to resolve route tree/type errors by running a dev server; note the issue in LEARNINGS.md and proceed.
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
