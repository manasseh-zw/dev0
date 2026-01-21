import type { TechStack } from '@/lib/templates'
import type { Task } from '@/lib/types'

type ReadmeOptions = {
  name: string
  description: string
  context: string
  techStack: TechStack
}

/**
 * Generate README.md content for a new project
 */
export function generateReadme(options: ReadmeOptions): string {
  const { name, description, context, techStack } = options

  const techStackInfo = getTechStackInfo(techStack)

  return `# ${name}

${description}

## Tech Stack

${techStackInfo}

## Project Context

${context}

## Getting Started

\`\`\`bash
# Install dependencies
bun install

# Run development server
bun run dev

# Run tests
bun test
\`\`\`

---

For more details, see:
- [TASKLIST.md](./TASKLIST.md) - Current progress
- [LEARNINGS.md](./LEARNINGS.md) - Agent insights
- [.dev0/RULES.md](./.dev0/RULES.md) - Project conventions
`
}

/**
 * Generate TASKLIST.md content from tasks
 */
export function generateTasklist(tasks: Task[]): string {
  const tasksByPhase = groupTasksByPhase(tasks)

  let content = `# Task List

This file shows the current progress of all tasks in this project.
It is automatically updated by dev0 as tasks are completed.

---

`

  const phases = Object.keys(tasksByPhase).sort()

  for (const phase of phases) {
    content += `## Phase ${phase}\n\n`

    const phaseTasks = tasksByPhase[phase]

    for (const task of phaseTasks) {
      const checkbox = task.status === 'DONE' ? 'x' : ' '
      const statusEmoji = getTaskStatusEmoji(task.status)

      content += `- [${checkbox}] ${statusEmoji} **${task.title}**\n`

      if (task.description) {
        content += `  ${task.description}\n`
      }

      if (task.status === 'DONE' && task.prUrl) {
        content += `  [View PR](${task.prUrl})\n`
      }

      content += '\n'
    }
  }

  content += `---

_Last updated by dev0 automation_
`

  return content
}

/**
 * Generate initial LEARNINGS.md template
 */
export function getInitialLearningsTemplate(): string {
  return `# Project Learnings

This file tracks insights and learnings from agents working on this project.
Each agent updates this file after completing a task.

## Guidelines for Agents

When updating this file:
- Document edge cases you encountered
- Note errors you fixed and how
- Share tips that would help future agents
- Mention any important architectural decisions
- Keep entries concise but informative

## Format

Use this format when adding learnings:

\`\`\`markdown
### Task: [Task Title]
- **Completed:** [Date]
- **Task ID:** [ID]
- **Learnings:**
  - [Learning 1]
  - [Learning 2]
  - [Learning 3]
\`\`\`

---

## Learnings Log

_(Agents will append their learnings below as tasks are completed)_
`
}

/**
 * Generate .dev0/RULES.md content based on tech stack
 */
export function getTechStackRules(techStack: TechStack): string {
  const commonRules = `# dev0 Project Rules

This file defines the tech stack standards and coding conventions for this project.
**All agents must follow these rules when implementing tasks.**

---

## Tech Stack Standards

### Authentication
- **Library:** Better Auth
- **Strategy:** Email/password by default
- **Session:** JWT tokens
- **Location:** \`src/lib/auth.ts\`

### Database
- **ORM:** Drizzle
- **Database:** PostgreSQL
- **Schema Location:** \`src/db/schema.ts\`
- **Migrations:** \`bun run db:migrate\`
- **Query Patterns:** Use Drizzle query builder, avoid raw SQL

### State Management
- **Server State:** TanStack Query
- **Client State:** Zustand (if needed)
- **Form State:** React Hook Form + Zod validation

### Styling
- **Framework:** Tailwind CSS
- **Components:** shadcn/ui
- **Icons:** Lucide React
- **Custom Styles:** Add to \`src/styles/globals.css\`

### Testing
- **Framework:** Vitest
- **E2E:** Playwright (if needed)
- **Coverage:** Aim for 80%+ on critical paths

---

## Code Style Guidelines

### General
- Use TypeScript for all code
- Prefer \`type\` over \`interface\`
- Use functional components: \`const Component = () => {}\`
- Never use classes; prefer functional/declarative patterns
- Use descriptive variable names with auxiliary verbs (\`isLoading\`, \`hasError\`)

### File Organization
- Directory names: lowercase with dashes (\`user-profile\`)
- Component files: PascalCase (\`UserProfile.tsx\`)
- Use named exports for components
- Structure: exported component, subcomponents, helpers, static content, types

### Path Aliases
- Use \`@/\` alias for imports from \`src/\`
- Example: \`import { Button } from '@/components/ui/button'\`

### Comments
- Use comments sparingly
- Don't excessively comment every code block
- Focus on "why" not "what"
`

  const frameworkSpecificRules = getFrameworkSpecificRules(techStack)

  return commonRules + frameworkSpecificRules + getTaskCompletionRules()
}

/**
 * Get framework-specific rules
 */
function getFrameworkSpecificRules(techStack: TechStack): string {
  const rules: Record<TechStack, string> = {
    'tanstack-start': `
### TanStack Start Specific

- **Never use 'use client' directive** (TanStack Start is SSR by default)
- **Server Functions:** Use \`createServerFn\` for API operations
- **File-based Routing:** Routes go in \`src/routes/\`
- **API Routes:** Server handlers in \`src/routes/api/\`
- **Data Loading:** Use route loaders, not useEffect

`,
    'react-vite': `
### React + Vite Specific

- **Routing:** Use React Router v7
- **Environment Variables:** Prefix with \`VITE_\` for client access
- **Assets:** Import images/files directly
- **Code Splitting:** Use \`React.lazy()\` for route-based splitting

`,
    nextjs: `
### Next.js Specific

- **App Router:** Use App Router (not Pages Router)
- **Server Components:** Default to Server Components
- **Client Components:** Use \`'use client'\` only when needed
- **Data Fetching:** Use \`async\` Server Components
- **API Routes:** Use Route Handlers in \`src/app/api/\`

`,
  }

  return rules[techStack]
}

/**
 * Get task completion rules
 */
function getTaskCompletionRules(): string {
  return `---

## Task Completion Checklist

Before creating a PR, ensure:

1. ✅ **Tests Pass:** Run \`bun test\` and ensure all tests pass
2. ✅ **Type Safety:** Run \`bun run typecheck\` with no errors
3. ✅ **Code Quality:** Follow all style guidelines above
4. ✅ **Update LEARNINGS.md:** Add any insights or gotchas you discovered
5. ✅ **Commit Message:** Write clear, descriptive commit messages

---

## Important Notes

- 🚨 **Always run tests before creating a PR**
- 📝 **Update LEARNINGS.md with any gotchas or important discoveries**
- 🧩 **Keep components small and focused (single responsibility)**
- 🔒 **Never commit secrets or API keys**
- 📚 **Reference LEARNINGS.md for past solutions to common issues**

---

_This file is maintained by dev0 and should not be manually edited by agents._
`
}

/**
 * Get tech stack information for README
 */
function getTechStackInfo(techStack: TechStack): string {
  const baseStack = `- **Database:** Drizzle ORM + PostgreSQL
- **Authentication:** Better Auth
- **UI:** shadcn/ui + Tailwind CSS
- **Testing:** Vitest
- **Package Manager:** Bun`

  const frameworkInfo: Record<TechStack, string> = {
    'tanstack-start': `- **Framework:** TanStack Start
- **Routing:** TanStack Router (file-based)
${baseStack}`,
    'react-vite': `- **Framework:** React 19
- **Build Tool:** Vite
- **Routing:** React Router v7
${baseStack}`,
    nextjs: `- **Framework:** Next.js 16 (App Router)
- **Routing:** Next.js App Router
${baseStack}`,
  }

  return frameworkInfo[techStack]
}

/**
 * Group tasks by phase
 */
function groupTasksByPhase(tasks: Task[]): Record<string, Task[]> {
  return tasks.reduce(
    (acc, task) => {
      const phase = task.phase.toString()
      if (!acc[phase]) {
        acc[phase] = []
      }
      acc[phase].push(task)
      return acc
    },
    {} as Record<string, Task[]>,
  )
}

/**
 * Get emoji for task status
 */
function getTaskStatusEmoji(status: Task['status']): string {
  const emojiMap: Record<Task['status'], string> = {
    PENDING: '⏳',
    RUNNING: '🔄',
    REVIEW: '👀',
    DONE: '✅',
    FAILED: '❌',
    SKIPPED: '⏭️',
  }

  return emojiMap[status]
}
