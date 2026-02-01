import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { projects, tasks, taskLogs } from '@/lib/db/schema'
import { executionBus } from '@/lib/execution/event-bus'
import {
  executeGeminiStreaming,
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
    let task: Task | null = null

    if (taskId) {
      task = await getTaskById(projectId, taskId)
      const updated = await claimPendingTask(task.id)
      if (!updated) {
        const status = await getTaskStatus(task.id)
        const runningTaskId = await getRunningTaskId(projectId)
        projectState.set(projectId, {
          runningTaskId: runningTaskId ?? null,
          sandboxId: null,
          starting: false,
        })
        if (runningTaskId) {
          return {
            taskId: runningTaskId,
            sandboxId: '',
            alreadyRunning: true,
          }
        }
        throw new Error(`Task is not pending (status: ${status ?? 'unknown'})`)
      }
    } else {
      let lastFailedTaskId: string | null = null
      let lastFailedStatus: Task['status'] | null = null

      for (let attempt = 0; attempt < 3; attempt += 1) {
        task = await getNextRunnableTask(projectId)
        if (!task) {
          throw new Error('No runnable task found for this project')
        }
        const updated = await claimPendingTask(task.id)
        if (updated) {
          break
        }
        lastFailedTaskId = task.id
        lastFailedStatus = await getTaskStatus(task.id)
        task = null
      }

      if (!task) {
        const runningTaskId = await getRunningTaskId(projectId)
        projectState.set(projectId, {
          runningTaskId: runningTaskId ?? null,
          sandboxId: null,
          starting: false,
        })
        if (runningTaskId) {
          return {
            taskId: runningTaskId,
            sandboxId: '',
            alreadyRunning: true,
          }
        }
        if (lastFailedTaskId) {
          throw new Error(
            `Unable to claim task ${lastFailedTaskId} (status: ${lastFailedStatus ?? 'unknown'})`,
          )
        }
        throw new Error('Unable to claim a runnable task')
      }
    }

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
      await db
        .update(tasks)
        .set({
          status: 'FAILED',
          attempts: sql`${tasks.attempts} + 1`,
        })
        .where(eq(tasks.id, task.id))
      executionBus.emit({
        type: 'task_failed',
        projectId,
        taskId: task.id,
        error: message,
      })
      projectState.set(projectId, {
        runningTaskId: null,
        sandboxId: null,
        starting: false,
      })
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
        status: 'DONE',
        prUrl: result.prUrl ?? null,
      })
      .where(eq(tasks.id, taskId))

    executionBus.emit({
      type: 'task_completed',
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

  const runnable = allTasks.find((task) => {
    if (task.status !== 'PENDING') {
      return false
    }

    return task.dependencies.every(
      (dependencyId) => statusById.get(dependencyId) === 'DONE',
    )
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
    const prompt = buildTaskPrompt(project, task)
    console.log(`[ORCHESTRATOR] Built prompt, executing Gemini CLI...`)

    let stdoutBuffer = ''
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
            if (!line.trim()) continue
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
              // Fallback for non-JSON lines (startup messages, etc.)
              if (line.trim()) {
                executionBus.emit({
                  type: 'task_log',
                  projectId,
                  taskId: task.id,
                  log: line,
                  stream: 'stdout',
                })
              }
            }
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
          try {
            const parsed = JSON.parse(line)
            const geminiEvent = isGeminiEvent(parsed) ? parsed : undefined

            if (geminiEvent) {
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
        },
      },
    )

    // Persist logs to database
    await persistTaskLogs(task.id, collectedEvents, result.duration)

    const prUrl = extractPrUrl(`${result.stdout}\n${result.stderr}`)
    console.log(
      `[ORCHESTRATOR] Gemini CLI finished - exitCode: ${result.exitCode}, prUrl: ${prUrl ?? 'none'}`,
    )

    if (result.exitCode === 0) {
      console.log(`[ORCHESTRATOR] Task completed successfully`)
      await completeTask(projectId, task.id, { success: true, prUrl })
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

  // Find the last assistant message for summary
  const lastMessage = [...events]
    .reverse()
    .find((e) => e.type === 'message' && e.role === 'assistant')
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
- Follow any guidance in .dev0/RULES.md if present.
- Update TASKLIST.md and LEARNINGS.md if they exist.
- Keep changes scoped to the task and run relevant checks if needed.

Finish by summarizing what you changed and include any PR URL if you created one.`
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
