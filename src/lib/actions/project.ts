import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  generateProjectPlan,
  type PlannerOutput,
  type ProjectSpec,
} from '@/lib/ai'
import { prisma } from '@/lib/db'
import { createProjectRepository } from '@/lib/git'
import type { TechStack } from '@/lib/templates'
import type { Project, Task } from 'generated/prisma/client'
import { randomUUID } from 'crypto'

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
      const project = await prisma.project.create({
        data: {
          name,
          description,
          vibeInput,
          techStack,
          theme,
          status: 'PLANNING',
        },
      })

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
      await prisma.project.update({
        where: { id: project.id },
        data: { specContent },
      })

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

      await prisma.task.createMany({ data: taskData })

      const createdTasks = await prisma.task.findMany({
        where: { projectId: project.id },
        orderBy: [{ phase: 'asc' }, { order: 'asc' }],
      })

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
      await prisma.project.update({
        where: { id: project.id },
        data: {
          status: 'READY',
          repoUrl: repo.repoUrl,
          repoName: repo.repoName,
        },
      })

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
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      include: {
        tasks: {
          orderBy: [{ phase: 'asc' }, { order: 'asc' }],
        },
      },
    })

    if (!project) {
      throw new Error('Project not found')
    }

    return project
  })

export type ProjectWithTasks = Project & { tasks: Task[] }

/**
 * Get all projects (for dashboard/listing)
 */
export const getProjects = createServerFn({ method: 'GET' }).handler(
  async () => {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    })

    return projects
  },
)

export type ProjectWithCount = Project & { _count: { tasks: number } }

/**
 * Get tasks for a project
 */
export const getProjectTasks = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ projectId: z.string() }))
  .handler(async ({ data }: { data: { projectId: string } }) => {
    const tasks = await prisma.task.findMany({
      where: { projectId: data.projectId },
      orderBy: [{ phase: 'asc' }, { order: 'asc' }],
    })

    return tasks
  })

/**
 * Get a single task by ID
 */
export const getTask = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ taskId: z.string() }))
  .handler(async ({ data }: { data: { taskId: string } }) => {
    const task = await prisma.task.findUnique({
      where: { id: data.taskId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            repoName: true,
            repoUrl: true,
          },
        },
      },
    })

    if (!task) {
      throw new Error('Task not found')
    }

    return task
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
    const task = await prisma.task.update({
      where: { id: data.taskId },
      data: {
        status: data.status,
        prUrl: data.prUrl,
        prNumber: data.prNumber,
      },
    })

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
    const project = await prisma.project.update({
      where: { id: data.projectId },
      data: { status: data.status },
    })

    return project
  })

/**
 * Get project statistics (task counts by status)
 */
export const getProjectStats = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ projectId: z.string() }))
  .handler(async ({ data }: { data: { projectId: string } }) => {
    const tasks = await prisma.task.groupBy({
      by: ['status'],
      where: { projectId: data.projectId },
      _count: { status: true },
    })

    const stats = {
      total: 0,
      pending: 0,
      running: 0,
      review: 0,
      done: 0,
      failed: 0,
      skipped: 0,
    }

    for (const group of tasks) {
      const count = group._count.status
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
  geminiModel: 'gemini-3-flash-preview' | 'gemini-3-pro-preview'
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
    const task = await prisma.task.update({
      where: { id: data.taskId },
      data: { geminiModel: data.geminiModel },
    })

    return task
  })
