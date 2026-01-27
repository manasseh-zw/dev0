import { createServerFn } from '@tanstack/react-start'
import { asc, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import {
  generateProjectPlan,
  type PlannerOutput,
  type ProjectSpec,
} from '@/lib/ai'
import { db } from '@/lib/db'
import { projects, tasks } from '@/lib/db/schema'
import { createProjectRepository } from '@/lib/git'
import type { TechStack } from '@/lib/templates'
import { randomUUID } from 'crypto'
import type { InferSelectModel } from 'drizzle-orm'

type Project = InferSelectModel<typeof projects>
type Task = InferSelectModel<typeof tasks>
type GeminiModel = InferSelectModel<typeof tasks>['geminiModel']

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  vibeInput: z.string().min(1),
  techStack: z.enum(['tanstack-start', 'react-vite', 'nextjs']),
  theme: z.string().optional(),
})

/**
 * Create a new project
 */
export const createProject = createServerFn({ method: 'POST' })
  .inputValidator(createProjectSchema)
  .handler(async ({ data }) => {
    try {
      const { name, description, vibeInput, techStack, theme } = data

      // Step 1: Create initial project
      const [project] = await db
        .insert(projects)
        .values({
          name,
          description,
          vibeInput,
          techStack,
          theme,
          status: 'PLANNING',
        })
        .returning()

      if (!project) {
        throw new Error('Failed to create project')
      }

      // Step 2: Generate plan with AI
      const planResult = await generateProjectPlan({
        name,
        description,
        vibeInput,
        techStack: techStack as TechStack,
      })

      if (!planResult.success) {
        throw new Error(planResult.error)
      }

      // Step 3: Update project with spec
      const specContent = buildSpecContent(planResult.data.spec)
      await db
        .update(projects)
        .set({ specContent })
        .where(eq(projects.id, project.id))

      // Step 4: Create tasks
      const taskIdMap = new Map<string, string>()
      const tasksWithIds = planResult.data.tasks.map((task) => {
        const id = randomUUID()
        taskIdMap.set(task.id, id)
        return { ...task, id }
      })

      const taskData = tasksWithIds.map((task) => ({
        id: task.id,
        projectId: project.id,
        title: task.title,
        description: task.description,
        phase: task.phase,
        order: task.order,
        geminiModel: task.geminiModel,
        dependencies: task.dependencies
          .map((dependencyId) => taskIdMap.get(dependencyId))
          .filter((dependencyId): dependencyId is string =>
            Boolean(dependencyId),
          ),
      }))

      await db.insert(tasks).values(taskData)

      const createdTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, project.id))
        .orderBy(asc(tasks.phase), asc(tasks.order))

      // Step 5: Create GitHub repository
      const repo = await createProjectRepository({
        projectName: project.name,
        description: project.description ?? '',
        context: buildRepoContext(planResult.data),
        techStack: techStack as TechStack,
        tasks: createdTasks,
        readmeContent: planResult.data.readmeContent,
      })

      // Step 6: Update project status to READY
      await db
        .update(projects)
        .set({
          status: 'READY',
          repoUrl: repo.repoUrl,
          repoName: repo.repoName,
        })
        .where(eq(projects.id, project.id))

      return {
        projectId: project.id,
        redirectUrl: `/project/${project.id}`,
      }
    } catch (error) {
      console.error('[CREATE PROJECT] Error:', error)
      throw error
    }
  })

function buildSpecContent(spec: ProjectSpec) {
  const technicalNotes = spec.technicalNotes
    ? `## Technical Notes\n\n${spec.technicalNotes}\n`
    : ''

  return `# ${spec.name}

${spec.tagline}

## Overview

${spec.overview}

## Features

${spec.features.map((feature) => `- ${feature}`).join('\n')}

${technicalNotes}`.trim()
}

function buildRepoContext(plan: PlannerOutput): string {
  const notes = plan.spec.technicalNotes
    ? `\n\nTechnical notes:\n${plan.spec.technicalNotes}`
    : ''

  return `${plan.spec.overview}\n\nKey features:\n${plan.spec.features
    .map((feature) => `- ${feature}`)
    .join('\n')}${notes}`.trim()
}

/**
 * Get a project by ID with its tasks
 */
export const getProject = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ projectId: z.string() }))
  .handler(async ({ data }: { data: { projectId: string } }) => {
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, data.projectId))
      .limit(1)

    if (!project[0]) {
      throw new Error('Project not found')
    }

    const projectTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, data.projectId))
      .orderBy(asc(tasks.phase), asc(tasks.order))

    return {
      ...project[0],
      tasks: projectTasks,
    }
  })

export type ProjectWithTasks = Project & { tasks: Task[] }

/**
 * Get all projects (for dashboard/listing)
 */
export const getProjects = createServerFn({ method: 'GET' }).handler(
  async () => {
    const rows = await db
      .select({
        project: projects,
        taskCount: sql<number>`
          (select count(*)
           from ${tasks}
           where ${tasks.projectId} = ${projects.id})
        `.mapWith(Number),
      })
      .from(projects)
      .orderBy(desc(projects.createdAt))

    return rows.map((row) => ({
      ...row.project,
      _count: { tasks: row.taskCount },
    }))
  },
)

export type ProjectWithCount = Project & { _count: { tasks: number } }

/**
 * Get tasks for a project
 */
export const getProjectTasks = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ projectId: z.string() }))
  .handler(async ({ data }: { data: { projectId: string } }) => {
    return db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, data.projectId))
      .orderBy(asc(tasks.phase), asc(tasks.order))
  })

/**
 * Get a single task by ID
 */
export const getTask = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ taskId: z.string() }))
  .handler(async ({ data }: { data: { taskId: string } }) => {
    const rows = await db
      .select({
        task: tasks,
        projectId: projects.id,
        projectName: projects.name,
        projectRepoName: projects.repoName,
        projectRepoUrl: projects.repoUrl,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.id, data.taskId))
      .limit(1)

    const row = rows[0]

    if (!row) {
      throw new Error('Task not found')
    }

    return {
      ...row.task,
      project: {
        id: row.projectId ?? '',
        name: row.projectName ?? '',
        repoName: row.projectRepoName ?? null,
        repoUrl: row.projectRepoUrl ?? null,
      },
    }
  })

type UpdateTaskStatusInput = {
  taskId: string
  status: 'PENDING' | 'RUNNING' | 'REVIEW' | 'DONE' | 'FAILED' | 'SKIPPED'
  prUrl?: string
  prNumber?: number
}

/**
 * Update task status
 */
export const updateTaskStatus = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      taskId: z.string(),
      status: z.enum([
        'PENDING',
        'RUNNING',
        'REVIEW',
        'DONE',
        'FAILED',
        'SKIPPED',
      ]),
      prUrl: z.string().optional(),
      prNumber: z.number().optional(),
    }),
  )
  .handler(async ({ data }: { data: UpdateTaskStatusInput }) => {
    const [task] = await db
      .update(tasks)
      .set({
        status: data.status,
        prUrl: data.prUrl,
        prNumber: data.prNumber,
      })
      .where(eq(tasks.id, data.taskId))
      .returning()

    return task
  })

type UpdateProjectStatusInput = {
  projectId: string
  status: 'PLANNING' | 'READY' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED'
}

/**
 * Update project status
 */
export const updateProjectStatus = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      projectId: z.string(),
      status: z.enum([
        'PLANNING',
        'READY',
        'ACTIVE',
        'PAUSED',
        'COMPLETED',
        'ARCHIVED',
      ]),
    }),
  )
  .handler(async ({ data }: { data: UpdateProjectStatusInput }) => {
    const [project] = await db
      .update(projects)
      .set({ status: data.status })
      .where(eq(projects.id, data.projectId))
      .returning()

    return project
  })

/**
 * Get project statistics (task counts by status)
 */
export const getProjectStats = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ projectId: z.string() }))
  .handler(async ({ data }: { data: { projectId: string } }) => {
    const groupedTasks = await db
      .select({
        status: tasks.status,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(tasks)
      .where(eq(tasks.projectId, data.projectId))
      .groupBy(tasks.status)

    const stats = {
      total: 0,
      pending: 0,
      running: 0,
      review: 0,
      done: 0,
      failed: 0,
      skipped: 0,
    }

    for (const group of groupedTasks) {
      const count = group.count
      stats.total += count

      switch (group.status) {
        case 'PENDING':
          stats.pending = count
          break
        case 'RUNNING':
          stats.running = count
          break
        case 'REVIEW':
          stats.review = count
          break
        case 'DONE':
          stats.done = count
          break
        case 'FAILED':
          stats.failed = count
          break
        case 'SKIPPED':
          stats.skipped = count
          break
      }
    }

    return stats
  })

export type ProjectStats = {
  total: number
  pending: number
  running: number
  review: number
  done: number
  failed: number
  skipped: number
}

type UpdateTaskModelInput = {
  taskId: string
  geminiModel: GeminiModel
}

/**
 * Update task Gemini model
 */
export const updateTaskModel = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      taskId: z.string(),
      geminiModel: z.enum(['gemini-3-flash-preview', 'gemini-3-pro-preview']),
    }),
  )
  .handler(async ({ data }: { data: UpdateTaskModelInput }) => {
    const [task] = await db
      .update(tasks)
      .set({ geminiModel: data.geminiModel })
      .where(eq(tasks.id, data.taskId))
      .returning()

    return task
  })
