import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { projects, tasks } from '@/lib/db/schema'
import { executionBus } from '@/lib/execution/event-bus'
import {
  executeGeminiStreaming,
  getOrCreateProjectSandbox,
} from '@/lib/sandbox/provider'
import type { Task } from '@/lib/types/task'

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

const WORKSPACE_DIR = '/home/daytona/workspace/project'

export async function startTask(
  projectId: string,
  taskId?: string,
): Promise<StartTaskResult> {
  const currentState = projectState.get(projectId)

  if (currentState?.runningTaskId || currentState?.starting) {
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

  try {
    const task = taskId
      ? await getTaskById(projectId, taskId)
      : await getNextRunnableTask(projectId)

    if (!task) {
      throw new Error('No runnable task found for this project')
    }

    const updated = await db
      .update(tasks)
      .set({ status: 'RUNNING' })
      .where(and(eq(tasks.id, task.id), eq(tasks.status, 'PENDING')))
      .returning()

    if (!updated[0]) {
      const runningTaskId = await getRunningTaskId(projectId)
      projectState.set(projectId, {
        runningTaskId: runningTaskId ?? null,
        sandboxId: null,
        starting: false,
      })
      return {
        taskId: runningTaskId ?? task.id,
        sandboxId: '',
        alreadyRunning: true,
      }
    }

    let sandboxId = ''

    try {
      const sandbox = await getOrCreateProjectSandbox(projectId, task.id)
      sandboxId = sandbox.id
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

    executionBus.emit({
      type: 'task_started',
      projectId,
      taskId: task.id,
      sandboxId,
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
  try {
    const project = await getProjectById(projectId)
    const prompt = buildTaskPrompt(project, task)

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
          executionBus.emit({
            type: 'task_log',
            projectId,
            taskId: task.id,
            log: chunk,
            stream: 'stdout',
          })
        },
        onStderr: (chunk) => {
          executionBus.emit({
            type: 'task_log',
            projectId,
            taskId: task.id,
            log: chunk,
            stream: 'stderr',
          })
        },
      },
    )

    const prUrl = extractPrUrl(`${result.stdout}\n${result.stderr}`)

    if (result.exitCode === 0) {
      await completeTask(projectId, task.id, { success: true, prUrl })
    } else {
      await completeTask(projectId, task.id, {
        success: false,
        error: result.stderr || 'Command exited with non-zero status',
        prUrl,
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    await completeTask(projectId, task.id, {
      success: false,
      error: message,
    })
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
