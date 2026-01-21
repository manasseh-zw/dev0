import type { Task as PrismaTask, TaskStatus } from 'generated/prisma/client'

/**
 * Task type from Prisma
 * Re-exported for convenience
 */
export type Task = PrismaTask

/**
 * Task status type
 */
export type { TaskStatus }

/**
 * Minimal task data for creation
 */
export type CreateTaskData = {
  projectId: string
  title: string
  description?: string
  phase: number
  order?: number
  dependencies?: string[]
}

/**
 * Task with project relation
 */
export type TaskWithProject = Task & {
  project: {
    id: string
    name: string
    repoName: string | null
  }
}
