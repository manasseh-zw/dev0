import type { ProjectWithTasks } from '@/lib/actions'
import { mockProject } from './project'
import { mockTasks, getMockTaskStats, getMockTasksByPhase, getMockTasksByStatus } from './tasks'


export const MOCK_PROJECT_ID = 'mock'

export function isMockProjectId(projectId: string): boolean {
  return projectId === MOCK_PROJECT_ID
}

export function getMockProject(): ProjectWithTasks {
  return {
    ...mockProject,
    tasks: mockTasks,
  }
}

export function getMockTasks() {
  return mockTasks
}

export { getMockTaskStats, getMockTasksByPhase, getMockTasksByStatus }


export { mockProject, mockTasks }
export { MOCK_TASK_IDS } from './tasks'
