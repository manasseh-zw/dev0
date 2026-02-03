import type { TaskStatus } from '@/lib/types/task'

export type ReviewPRComment = {
  id: string
  author: string
  authorType: 'agent' | 'user'
  body: string
  createdAt: string
}

export type ReviewPRSummary = {
  taskId: string
  prNumber: number
  title: string
  body: string | null
  state: 'open' | 'closed' | 'merged'
  createdAt: string
  updatedAt: string
  headBranch: string
  baseBranch: string
  additions: number
  deletions: number
  changedFiles: number
  commits: number
  comments: ReviewPRComment[]
}

export type ReviewPRFile = {
  filename: string
  status: 'added' | 'modified' | 'removed' | 'renamed' | 'copied' | 'changed'
  additions: number
  deletions: number
  changes: number
  sha: string
  patch?: string | null
  previousFilename?: string | null
}

export type ReviewPRDiff = {
  rawDiff?: string | null
  files?: ReviewPRFile[]
}

export type ReviewPRListItem = {
  taskId: string
  taskTitle: string
  taskStatus: TaskStatus
  taskPhase: number
  taskCreatedAt: string
  geminiModel: string
  prNumber: number
  prUrl: string
  prTitle?: string | null
  prState?: 'open' | 'closed' | 'merged'
  prUpdatedAt?: string | null
}
