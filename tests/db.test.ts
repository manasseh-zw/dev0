import { describe, test, expect } from 'vitest'
import { db } from '@/lib/db'
import { projects, tasks } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

describe('Database Workflow (Live)', () => {
  test('inserts and reads a project + task', async () => {
    const projectId = randomUUID()
    const taskId = randomUUID()

    try {
      await db.insert(projects).values({
        id: projectId,
        name: 'DB Insert Test',
        description: 'Ensures Drizzle insert works',
        techStack: 'tanstack-start',
        status: 'PLANNING',
      })

      await db.insert(tasks).values({
        id: taskId,
        projectId,
        title: 'Insert task',
        phase: 1,
        order: 0,
        status: 'PENDING',
        geminiModel: 'gemini-3-pro-preview',
        dependencies: [],
        attempts: 0,
        maxAttempts: 3,
      })

      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1)

      const [task] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1)

      expect(project).toBeDefined()
      expect(project?.id).toBe(projectId)
      expect(task).toBeDefined()
      expect(task?.projectId).toBe(projectId)
    } finally {
      await db.delete(tasks).where(eq(tasks.id, taskId))
      await db.delete(projects).where(eq(projects.id, projectId))
    }
  })
})
