import { describe, test, expect } from 'vitest'
import { generateProjectPlan } from '@/lib/ai'
import type { PlannedTask } from '@/lib/ai'

function requireEnv(key: string) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
}

function validateTaskOrdering(tasks: PlannedTask[]) {
  const ordersByPhase = new Map<number, number[]>()
  for (const task of tasks) {
    const list = ordersByPhase.get(task.phase) ?? []
    list.push(task.order)
    ordersByPhase.set(task.phase, list)
  }

  for (const [phase, orders] of ordersByPhase.entries()) {
    const sorted = [...orders].sort((a, b) => a - b)
    for (let i = 0; i < sorted.length; i += 1) {
      expect(sorted[i]).toBe(i + 1)
    }
    expect(phase).toBeGreaterThanOrEqual(1)
    expect(phase).toBeLessThanOrEqual(5)
  }
}

function validateDependencies(tasks: PlannedTask[]) {
  const indexById = new Map(tasks.map((task, index) => [task.id, index]))

  for (const [index, task] of tasks.entries()) {
    for (const dependencyId of task.dependencies) {
      const dependencyIndex = indexById.get(dependencyId)
      expect(dependencyIndex).not.toBeUndefined()
      if (dependencyIndex !== undefined) {
        expect(dependencyIndex).toBeLessThan(index)
      }
    }
  }
}

describe('Planner Agent (Live)', () => {
  test('generates a structured project plan with tasks and README', async () => {
    requireEnv('GOOGLE_GENERATIVE_AI_API_KEY')

    const result = await generateProjectPlan({
      name: 'FlowTrack',
      description:
        'A workflow tracker that helps teams visualize project dependencies.',
      vibeInput:
        'We need a clean app to manage project tasks with dependency graphs and statuses.',
      techStack: 'tanstack-start',
    })

    expect(result.success).toBe(true)
    if (!result.success) return

    const { spec, tasks, readmeContent } = result.data

    expect(spec.name.trim().length).toBeGreaterThan(2)
    expect(spec.tagline.trim().length).toBeGreaterThan(3)
    expect(spec.overview.trim().length).toBeGreaterThan(120)
    expect(spec.features.length).toBeGreaterThanOrEqual(3)
    expect(spec.features.length).toBeLessThanOrEqual(8)

    expect(tasks.length).toBeGreaterThanOrEqual(5)
    expect(tasks.length).toBeLessThanOrEqual(20)

    const ids = tasks.map((task) => task.id)
    expect(new Set(ids).size).toBe(ids.length)

    validateTaskOrdering(tasks)
    validateDependencies(tasks)

    for (const task of tasks) {
      expect(task.title.trim().length).toBeGreaterThan(3)
      expect(task.description.trim().length).toBeGreaterThan(10)
      expect(['low', 'medium', 'high']).toContain(task.complexity)
      expect(['gemini-3-flash-preview', 'gemini-3-pro-preview']).toContain(
        task.geminiModel,
      )
    }

    expect(readmeContent).toContain('TASKLIST.md')
    expect(readmeContent).toContain('LEARNINGS.md')
    expect(readmeContent).toContain('.dev0/RULES.md')
  }, 120_000)
})
