import type { TechStack } from '@/lib/templates'

export type CreateProjectRequest = {
  vibeInput: string
  techStack: TechStack
  theme?: string
  name: string
  description: string
}

export type CreateProjectResponse = {
  projectId: string
  redirectUrl: string
}

export type ProjectDetailsResponse = {
  id: string
  name: string
  description: string | null
  status: string
  repoUrl: string | null
  repoName: string | null
  techStack: string
  theme: string
  vibeInput: string | null
  specContent: string | null
  createdAt: string
  updatedAt: string
  taskCount: number
  completedTaskCount: number
}

export type TaskListResponse = {
  tasks: TaskSummary[]
  phases: number[]
}

export type TaskSummary = {
  id: string
  title: string
  description: string | null
  phase: number
  order: number
  status: string
  prUrl: string | null
  attempts: number
  maxAttempts: number
}

export type StartExecutionRequest = {
  projectId: string
  taskId?: string
}

export type StartExecutionResponse =
  | {
      success: true
      taskId: string
      sandboxId: string
    }
  | {
      success: false
      message: string
      runningTaskId?: string
    }

export type TaskStatusUpdateRequest = {
  status: 'running' | 'review' | 'done' | 'failed'
  prUrl?: string
  error?: string
  logs?: Array<{
    level: 'info' | 'warn' | 'error' | 'debug'
    message: string
    timestamp?: string
  }>
  notes?: string
}

export type GitHubPREvent = {
  action: 'opened' | 'closed' | 'merged' | 'synchronize'
  pull_request: {
    number: number
    html_url: string
    merged: boolean
    head: {
      ref: string
    }
  }
  repository: {
    full_name: string
  }
}

export type SSEEvent =
  | { type: 'task_started'; taskId: string; sandboxId: string }
  | { type: 'task_log'; taskId: string; log: string; level: string }
  | { type: 'task_completed'; taskId: string; prUrl?: string }
  | { type: 'task_failed'; taskId: string; error: string }
  | { type: 'project_updated'; projectId: string }

export type ApiError = {
  error: string
  code?: string
  details?: Record<string, unknown>
}

export type PaginationParams = {
  page?: number
  limit?: number
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
