import type { InferSelectModel } from 'drizzle-orm'
import { taskStatusEnum, tasks } from '@/lib/db/schema'

export type Task = InferSelectModel<typeof tasks>
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number]

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
