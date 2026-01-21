import type { Task as PrismaTask, TaskStatus } from 'generated/prisma/client'

export type Task = PrismaTask
export type { TaskStatus }

export type CreateTaskData = {
  projectId: string
  title: string
  description?: string
  phase: number
  order?: number
  dependencies?: string[]
}


export type TaskWithProject = Task & {
  project: {
    id: string
    name: string
    repoName: string | null
  }
}
