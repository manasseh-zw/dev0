import type { ProjectWithTasks } from '@/lib/actions'
import { mockProject } from './project'
import {
  mockTasksWithBlocked,
  getMockTaskStats,
  getMockTasksByPhase,
  getMockTasksByStatus,
} from './tasks'

export const MOCK_PROJECT_ID = 'mock'

export function isMockProjectId(projectId: string): boolean {
  return projectId === MOCK_PROJECT_ID
}

/**
 * Get mock project with tasks that have isBlocked pre-computed.
 * Matches the shape returned by getProject server action.
 */
export function getMockProject(): ProjectWithTasks {
  return {
    ...mockProject,
    tasks: mockTasksWithBlocked,
  }
}

/**
 * Get mock tasks with isBlocked pre-computed.
 * Use this for TaskBoard and other components expecting TaskWithBlocked[].
 */
export function getMockTasks() {
  return mockTasksWithBlocked
}

export { getMockTaskStats, getMockTasksByPhase, getMockTasksByStatus }

export { mockProject, mockTasksWithBlocked }
export { MOCK_TASK_IDS } from './tasks'
export { getMockPRDetails, hasMockPRDetails } from './pr-details'
export { getMockPRFiles, hasMockPRFiles } from './pr-files'
export { getMockExecutionLogs, hasMockExecutionLogs } from './execution-logs'
