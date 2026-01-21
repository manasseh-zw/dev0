import type { TechStack } from '@/lib/templates'

export type PlannerInput = {
  vibeInput: string
  techStack: TechStack
  theme?: string
}

export type ProjectSpec = {
  name: string
  tagline: string
  overview: string
  features: string[]
  technicalNotes?: string
}

export type PlannedTask = {
  title: string
  description: string
  phase: number
  order: number
  dependsOn: number[]
  complexity: 'low' | 'medium' | 'high'
}

export type ProjectPlan = {
  spec: ProjectSpec
  tasks: PlannedTask[]
  readmeContent: string
}

export type PlannerEvent =
  | { type: 'thinking'; content: string }
  | { type: 'spec_generated'; spec: ProjectSpec }
  | { type: 'task_added'; task: PlannedTask }
  | { type: 'complete'; plan: ProjectPlan }
  | { type: 'error'; error: string }

export type PlannerConfig = {
  model?: string
  temperature?: number
  maxTokens?: number
}
