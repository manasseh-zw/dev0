import { z } from 'zod'

export const previewOutputSchema = z.object({
  name: z
    .string()
    .describe(
      'A catchy, memorable project name (2-4 words, PascalCase or with spaces)',
    ),
  tagline: z
    .string()
    .describe('A short, punchy tagline summarizing the project (max 10 words)'),
  description: z
    .string()
    .describe(
      'A technical one-liner summarizing what the project does and its key technology',
    ),
  suggestedTechStack: z
    .enum(['tanstack-start', 'react-vite', 'nextjs'])
    .describe(
      'The recommended tech stack based on the project requirements. Use tanstack-start for full-stack apps with SSR, react-vite for simple SPAs, nextjs for complex apps requiring edge/serverless',
    ),
})

export type PreviewOutput = z.infer<typeof previewOutputSchema>


export const taskComplexitySchema = z.enum(['low', 'medium', 'high'])


export const plannedTaskSchema = z.object({
  id: z
    .string()
    .describe(
      'Stable task ID (e.g., "task-1", "task-2"). Must be unique across the plan',
    ),
  title: z
    .string()
    .describe('Clear, action-oriented task title (e.g., "Implement user authentication")'),
  description: z
    .string()
    .describe(
      'Detailed description of what needs to be done, including acceptance criteria',
    ),
  phase: z
    .number()
    .min(1)
    .max(5)
    .describe('Phase number (1-5) - lower phases are foundational, higher phases build on them'),
  order: z
    .number()
    .min(1)
    .describe('Order within the phase (1-based) - determines execution sequence'),
  dependencies: z
    .array(z.string())
    .describe(
      'Array of task IDs that this task depends on. Empty if no dependencies',
    ),
  complexity: taskComplexitySchema.describe(
    'Task complexity: low (< 30 min), medium (30-60 min), high (> 60 min)',
  ),
  geminiModel: z
    .enum(['gemini-3-flash-preview', 'gemini-3-pro-preview'])
    .describe(
      'Recommended Gemini model for this task. Use flash for straightforward tasks, pro for complex reasoning',
    ),
})

export type PlannedTask = z.infer<typeof plannedTaskSchema>


export const projectSpecSchema = z.object({
  name: z.string().describe('The project name'),
  tagline: z.string().describe('Short, punchy tagline'),
  overview: z
    .string()
    .describe(
      'A comprehensive overview of the project (2-3 paragraphs). Include the problem it solves, target users, and key differentiators',
    ),
  features: z
    .array(z.string())
    .min(3)
    .max(8)
    .describe('Key features of the application (3-8 features)'),
  technicalNotes: z
    .string()
    .optional()
    .describe('Any technical considerations, constraints, or architectural decisions'),
})

export type ProjectSpec = z.infer<typeof projectSpecSchema>


export const plannerOutputSchema = z.object({
  spec: projectSpecSchema,
  tasks: z
    .array(plannedTaskSchema)
    .min(5)
    .max(20)
    .describe(
      'Atomic, well-ordered tasks (5-20). Each task should be completable in a single PR. Start with setup/foundation tasks, then core features, then polish',
    ),
  readmeContent: z
    .string()
    .describe(
      'Complete README.md content for the project repository. Include: project overview, tech stack, getting started, features, and links to related docs',
    ),
})

export type PlannerOutput = z.infer<typeof plannerOutputSchema>
