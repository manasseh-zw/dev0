import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  generateProjectPlan,
  type PlannerOutput,
  type ProjectSpec,
} from '@/lib/ai'
import { prisma } from '@/lib/db'
import { createProjectRepository } from '@/lib/git'
import type { TechStack } from '@/lib/templates'
import type { CreateProjectResponse } from '@/lib/types/api'
import { randomUUID } from 'crypto'

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  vibeInput: z.string().min(1),
  techStack: z.enum(['tanstack-start', 'react-vite', 'nextjs']),
  theme: z.string().optional(),
})

export const createProject = createServerFn({ method: 'POST' })
  .inputValidator(createProjectSchema)
  .handler(async ({ data }) => {
    const { name, description, vibeInput, techStack, theme } = data

    const project = await prisma.project.create({
      data: {
        name,
        description,
        vibeInput,
        techStack,
        theme,
        status: 'PLANNING',
      },
    })

    const planResult = await generateProjectPlan({
      name,
      description,
      vibeInput,
      techStack: techStack as TechStack,
    })

    if (!planResult.success) {
      throw new Error(planResult.error)
    }

    const specContent = buildSpecContent(planResult.data.spec)

    await prisma.project.update({
      where: { id: project.id },
      data: {
        specContent,
      },
    })

    const taskIdMap = new Map<string, string>()
    const tasksWithIds = planResult.data.tasks.map((task) => {
      const id = randomUUID()
      taskIdMap.set(task.id, id)
      return { ...task, id }
    })

    const taskData = tasksWithIds.map((task) => ({
      id: task.id,
      projectId: project.id,
      title: task.title,
      description: task.description,
      phase: task.phase,
      order: task.order,
      dependencies: task.dependencies
        .map((dependencyId) => taskIdMap.get(dependencyId))
        .filter((dependencyId): dependencyId is string =>
          Boolean(dependencyId),
        ),
    }))

    await prisma.task.createMany({ data: taskData })

    const createdTasks = await prisma.task.findMany({
      where: { projectId: project.id },
      orderBy: [{ phase: 'asc' }, { order: 'asc' }],
    })

    const repo = await createProjectRepository({
      projectName: project.name,
      description: project.description ?? '',
      context: buildRepoContext(planResult.data),
      techStack: techStack as TechStack,
      tasks: createdTasks,
      readmeContent: planResult.data.readmeContent,
    })

    await prisma.project.update({
      where: { id: project.id },
      data: {
        status: 'READY',
        repoUrl: repo.repoUrl,
        repoName: repo.repoName,
      },
    })

    const response: CreateProjectResponse = {
      projectId: project.id,
      redirectUrl: `/project/${project.id}`,
    }

    return response
  })

function buildSpecContent(spec: ProjectSpec) {
  const technicalNotes = spec.technicalNotes
    ? `## Technical Notes\n\n${spec.technicalNotes}\n`
    : ''

  return `# ${spec.name}

${spec.tagline}

## Overview

${spec.overview}

## Features

${spec.features.map((feature) => `- ${feature}`).join('\n')}

${technicalNotes}`.trim()
}

function buildRepoContext(plan: PlannerOutput): string {
  const notes = plan.spec.technicalNotes
    ? `\n\nTechnical notes:\n${plan.spec.technicalNotes}`
    : ''

  return `${plan.spec.overview}\n\nKey features:\n${plan.spec.features
    .map((feature) => `- ${feature}`)
    .join('\n')}${notes}`.trim()
}
