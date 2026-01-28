import { google } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
import {
  plannerOutputSchema,
  type PlannerOutput,
  type PlannedTask,
} from './schemas'
import type { TechStack } from '@/lib/templates'
import { GEMINI_3_PRO } from './models'

const PLANNER_MODEL = GEMINI_3_PRO

const PLANNER_SYSTEM_PROMPT = `You are a senior technical architect and project planner. Your job is to take a project idea and create a complete, actionable project plan.

You will receive:
- Project name and description
- Chosen tech stack
- The original user's "vibe" input

Your output must include:

## 1. Project Specification
A comprehensive spec with:
- Overview (2-3 paragraphs explaining the project, problem it solves, target users)
- Key features (3-8 specific, implementable features)
- Technical notes (any constraints or architectural decisions)

## 2. Task Breakdown
Create 5-20 atomic tasks that:
- Are completable in a single PR (1-2 hours of work max)
- Have clear acceptance criteria in the description
- Are properly phased (foundation → core → polish)
- Have correct dependencies (a task waits for its dependencies)
- Include a stable task ID for each task (e.g., "task-1", "task-2")
- Use dependency IDs (not numeric indices) in the "dependencies" field
- Provide an order value within each phase (1-based)
- Are assigned appropriate Gemini models:
  - Use "gemini-3-flash-preview" for straightforward tasks (UI components, simple CRUD, styling)
  - Use "gemini-3-pro-preview" for complex tasks (auth setup, complex state, architecture)

### Phase Guidelines:
- **Phase 1: Foundation** - Project setup, database schema, core utilities
- **Phase 2: Core Features** - Main functionality, key user flows
- **Phase 3: Secondary Features** - Additional features, integrations
- **Phase 4: Polish** - Styling, animations, error handling
- **Phase 5: Launch** - Testing, documentation, deployment

### Task Complexity:
- **Low**: < 30 min, straightforward implementation
- **Medium**: 30-60 min, requires some problem-solving
- **High**: > 60 min, complex logic or architecture decisions

## 3. README Content
Generate a complete README.md that includes:
- Project title and tagline
- Overview/description
- Tech stack with bullet points
- Features list
- Getting Started section with commands
- Links to TASKLIST.md, LEARNINGS.md, and .dev0/RULES.md

Be thorough but practical. Each task should be something an AI coding agent can complete independently with clear success criteria.`

type PlannerAgentInput = {
  name: string
  description: string
  vibeInput: string
  techStack: TechStack
}

type PlannerAgentResult =
  | {
      success: true
      data: PlannerOutput
    }
  | {
      success: false
      error: string
    }

export async function generateProjectPlan(
  input: PlannerAgentInput,
): Promise<PlannerAgentResult> {
  try {
    const techStackLabels: Record<TechStack, string> = {
      'tanstack-start': 'TanStack Start (full-stack React with SSR)',
      'react-vite': 'React + Vite (client-side SPA)',
      nextjs: 'Next.js (App Router with SSR/SSG)',
    }

    const prompt = `## Project Details

**Name:** ${input.name}
**Description:** ${input.description}
**Tech Stack:** ${techStackLabels[input.techStack]}

## Original User Input
"${input.vibeInput}"

---

Please generate a complete project plan with:
1. A detailed project specification
2. An atomic task breakdown (5-20 tasks)
3. A complete README.md for the repository`

    const { output } = await generateText({
      model: google(PLANNER_MODEL),
      output: Output.object({ schema: plannerOutputSchema }),
      system: PLANNER_SYSTEM_PROMPT,
      prompt,
      temperature: 0.5,
    })

    // Normalize task IDs, dependencies, and ordering for DB insertion
    const normalizedTasks = normalizePlannedTasks(output.tasks)

    return {
      success: true,
      data: {
        ...output,
        tasks: normalizedTasks,
      },
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('[Planner Agent Error]:', message)

    return {
      success: false,
      error: message,
    }
  }
}

function normalizePlannedTasks(tasks: PlannedTask[]): PlannedTask[] {
  const idMap = new Map<string, string>()
  const usedIds = new Set<string>()

  const withIds = tasks.map((task, index) => {
    const rawId = task.id.trim()
    const fallbackId = `task-${index + 1}`
    const nextId = rawId && !usedIds.has(rawId) ? rawId : fallbackId

    usedIds.add(nextId)
    idMap.set(task.id, nextId)

    return {
      ...task,
      id: nextId,
    }
  })

  const indexById = new Map(withIds.map((task, index) => [task.id, index]))
  const phaseCounters = new Map<number, number>()

  return withIds.map((task, index) => {
    const phaseOrder = (phaseCounters.get(task.phase) ?? 0) + 1
    phaseCounters.set(task.phase, phaseOrder)

    const validDependencies = task.dependencies
      .map((dependencyId) => idMap.get(dependencyId) ?? dependencyId)
      .filter((dependencyId) => {
        const dependencyIndex = indexById.get(dependencyId)
        return dependencyIndex !== undefined && dependencyIndex < index
      })

    return {
      ...task,
      order: phaseOrder,
      dependencies: Array.from(new Set(validDependencies)),
    }
  })
}

export { PLANNER_MODEL, type PlannerAgentInput, type PlannerAgentResult }
