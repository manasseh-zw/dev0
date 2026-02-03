import type { GeminiStreamEvent } from '@/lib/types/gemini-stream'
import { MOCK_TASK_IDS } from './tasks'

export interface MockExecutionLogs {
  id: string
  events: GeminiStreamEvent[]
  summary: string | null
  totalTokens: number | null
  durationMs: number | null
  toolCallsCount: number | null
}

// Mock execution logs for tasks
export const mockExecutionLogs: Record<string, MockExecutionLogs> = {
  [MOCK_TASK_IDS.projectSetup]: {
    id: 'log-001',
    summary: 'Successfully initialized project structure',
    totalTokens: 15420,
    durationMs: 45000,
    toolCallsCount: 12,
    events: [
      {
        type: 'init',
        timestamp: '2026-01-15T10:00:00Z',
        session_id: 'session-001',
        model: 'gemini-2.0-flash',
      },
      {
        type: 'message',
        timestamp: '2026-01-15T10:00:01Z',
        role: 'user',
        content:
          'Initialize the project structure for a TanStack Start application with TypeScript.',
      },
      {
        type: 'message',
        timestamp: '2026-01-15T10:00:05Z',
        role: 'assistant',
        content:
          "I'll set up the TanStack Start project with TypeScript. Let me start by creating the necessary files and configuration.",
      },
      {
        type: 'tool_use',
        timestamp: '2026-01-15T10:00:10Z',
        tool_name: 'run_command',
        tool_id: 'tool-001',
        parameters: {
          command: 'npm create tanstack-start@latest . -- --template minimal',
        },
      },
      {
        type: 'tool_result',
        timestamp: '2026-01-15T10:01:30Z',
        tool_id: 'tool-001',
        status: 'success',
        output:
          'Project created successfully!\n\n  Next steps:\n  1. cd into your project\n  2. npm install\n  3. npm run dev',
      },
      {
        type: 'tool_use',
        timestamp: '2026-01-15T10:01:35Z',
        tool_name: 'run_command',
        tool_id: 'tool-002',
        parameters: {
          command: 'npm install',
        },
      },
      {
        type: 'tool_result',
        timestamp: '2026-01-15T10:03:00Z',
        tool_id: 'tool-002',
        status: 'success',
        output:
          'added 1247 packages in 85s\n\n142 packages are looking for funding\n  run `npm fund` for details',
      },
      {
        type: 'tool_use',
        timestamp: '2026-01-15T10:03:05Z',
        tool_name: 'write_file',
        tool_id: 'tool-003',
        parameters: {
          path: 'tsconfig.json',
          content:
            '{\n  "compilerOptions": {\n    "strict": true,\n    "target": "ES2022"\n  }\n}',
        },
      },
      {
        type: 'tool_result',
        timestamp: '2026-01-15T10:03:06Z',
        tool_id: 'tool-003',
        status: 'success',
        output: 'File written successfully',
      },
      {
        type: 'message',
        timestamp: '2026-01-15T10:03:10Z',
        role: 'assistant',
        content:
          'Project structure has been initialized successfully. The TanStack Start project is ready with TypeScript configuration and all dependencies installed.',
      },
      {
        type: 'result',
        timestamp: '2026-01-15T10:03:15Z',
        status: 'success',
        stats: {
          total_tokens: 15420,
          input_tokens: 5200,
          output_tokens: 10220,
          duration_ms: 45000,
          tool_calls: 12,
        },
      },
    ],
  },

  [MOCK_TASK_IDS.aboutPage]: {
    id: 'log-005',
    summary: 'Created about page with bio, skills, and experience sections',
    totalTokens: 28340,
    durationMs: 120000,
    toolCallsCount: 24,
    events: [
      {
        type: 'init',
        timestamp: '2026-01-18T09:00:00Z',
        session_id: 'session-005',
        model: 'gemini-2.0-flash',
      },
      {
        type: 'message',
        timestamp: '2026-01-18T09:00:01Z',
        role: 'user',
        content:
          'Create the About page with bio section, skills grid with icons, timeline of experience, and downloadable resume button.',
      },
      {
        type: 'message',
        timestamp: '2026-01-18T09:00:10Z',
        role: 'assistant',
        content:
          "I'll create a comprehensive About page with all the requested sections. Let me start by creating the page component and its sub-components.",
      },
      {
        type: 'tool_use',
        timestamp: '2026-01-18T09:00:15Z',
        tool_name: 'read_file',
        tool_id: 'tool-010',
        parameters: {
          path: 'src/components/ui/card.tsx',
        },
      },
      {
        type: 'tool_result',
        timestamp: '2026-01-18T09:00:16Z',
        tool_id: 'tool-010',
        status: 'success',
        output:
          'import * as React from "react"\nimport { cn } from "@/lib/utils"\n...',
      },
      {
        type: 'tool_use',
        timestamp: '2026-01-18T09:00:20Z',
        tool_name: 'write_file',
        tool_id: 'tool-011',
        parameters: {
          path: 'src/app/about/page.tsx',
          content:
            'import { BioSection } from "@/components/about/bio-section"\nimport { SkillsGrid } from "@/components/about/skills-grid"\n...',
        },
      },
      {
        type: 'tool_result',
        timestamp: '2026-01-18T09:00:21Z',
        tool_id: 'tool-011',
        status: 'success',
        output: 'File written successfully',
      },
      {
        type: 'tool_use',
        timestamp: '2026-01-18T09:00:25Z',
        tool_name: 'write_file',
        tool_id: 'tool-012',
        parameters: {
          path: 'src/components/about/bio-section.tsx',
          content:
            'export function BioSection() {\n  return (\n    <section className="py-12">\n      ...\n    </section>\n  )\n}',
        },
      },
      {
        type: 'tool_result',
        timestamp: '2026-01-18T09:00:26Z',
        tool_id: 'tool-012',
        status: 'success',
        output: 'File written successfully',
      },
      {
        type: 'tool_use',
        timestamp: '2026-01-18T09:00:30Z',
        tool_name: 'write_file',
        tool_id: 'tool-013',
        parameters: {
          path: 'src/components/about/skills-grid.tsx',
          content:
            'const skills = [\n  { name: "React", icon: ReactIcon },\n  { name: "TypeScript", icon: TypeScriptIcon },\n  ...\n]',
        },
      },
      {
        type: 'tool_result',
        timestamp: '2026-01-18T09:00:31Z',
        tool_id: 'tool-013',
        status: 'success',
        output: 'File written successfully',
      },
      {
        type: 'tool_use',
        timestamp: '2026-01-18T09:00:35Z',
        tool_name: 'write_file',
        tool_id: 'tool-014',
        parameters: {
          path: 'src/components/about/experience-timeline.tsx',
          content:
            'export function ExperienceTimeline() {\n  const experiences = [\n    { company: "Tech Corp", role: "Senior Developer", period: "2022-Present" },\n    ...\n  ]\n}',
        },
      },
      {
        type: 'tool_result',
        timestamp: '2026-01-18T09:00:36Z',
        tool_id: 'tool-014',
        status: 'success',
        output: 'File written successfully',
      },
      {
        type: 'message',
        timestamp: '2026-01-18T09:01:00Z',
        role: 'assistant',
        content:
          "I've created the About page with all the requested sections:\n\n1. **Bio Section**: Personal introduction with profile image\n2. **Skills Grid**: Visual grid of technical skills with icons\n3. **Experience Timeline**: Career history with companies and roles\n4. **Resume Download**: Button to download PDF resume\n\nThe page is fully responsive and follows the design system.",
      },
      {
        type: 'result',
        timestamp: '2026-01-18T09:02:00Z',
        status: 'success',
        stats: {
          total_tokens: 28340,
          input_tokens: 8540,
          output_tokens: 19800,
          duration_ms: 120000,
          tool_calls: 24,
        },
      },
    ],
  },

  [MOCK_TASK_IDS.contactForm]: {
    id: 'log-008',
    summary: 'Failed to configure Resend API - missing environment variable',
    totalTokens: 12450,
    durationMs: 65000,
    toolCallsCount: 8,
    events: [
      {
        type: 'init',
        timestamp: '2026-01-20T09:00:00Z',
        session_id: 'session-008',
        model: 'gemini-2.0-flash',
      },
      {
        type: 'message',
        timestamp: '2026-01-20T09:00:01Z',
        role: 'user',
        content:
          'Implement a contact form with email validation, reCAPTCHA, and email sending via Resend.',
      },
      {
        type: 'message',
        timestamp: '2026-01-20T09:00:08Z',
        role: 'assistant',
        content:
          "I'll create a contact form with validation, reCAPTCHA integration, and Resend for sending emails. Let me start by setting up the form component.",
      },
      {
        type: 'tool_use',
        timestamp: '2026-01-20T09:00:15Z',
        tool_name: 'run_command',
        tool_id: 'tool-020',
        parameters: {
          command: 'npm install resend react-hook-form @hookform/resolvers zod',
        },
      },
      {
        type: 'tool_result',
        timestamp: '2026-01-20T09:00:45Z',
        tool_id: 'tool-020',
        status: 'success',
        output: 'added 4 packages in 2s',
      },
      {
        type: 'tool_use',
        timestamp: '2026-01-20T09:00:50Z',
        tool_name: 'write_file',
        tool_id: 'tool-021',
        parameters: {
          path: 'src/lib/resend.ts',
          content:
            'import { Resend } from "resend"\n\nexport const resend = new Resend(process.env.RESEND_API_KEY)',
        },
      },
      {
        type: 'tool_result',
        timestamp: '2026-01-20T09:00:51Z',
        tool_id: 'tool-021',
        status: 'success',
        output: 'File written successfully',
      },
      {
        type: 'tool_use',
        timestamp: '2026-01-20T09:01:00Z',
        tool_name: 'run_command',
        tool_id: 'tool-022',
        parameters: {
          command: 'npm run build',
        },
      },
      {
        type: 'tool_result',
        timestamp: '2026-01-20T09:01:30Z',
        tool_id: 'tool-022',
        status: 'error',
        error:
          'Build failed: RESEND_API_KEY is not defined in environment variables',
      },
      {
        type: 'error',
        timestamp: '2026-01-20T09:01:35Z',
        message:
          'Missing RESEND_API_KEY environment variable. Please add it to your .env file.',
        code: 'ENV_VAR_MISSING',
      },
      {
        type: 'result',
        timestamp: '2026-01-20T09:01:40Z',
        status: 'error',
        stats: {
          total_tokens: 12450,
          input_tokens: 4200,
          output_tokens: 8250,
          duration_ms: 65000,
          tool_calls: 8,
        },
      },
    ],
  },
}

/**
 * Get mock execution logs for a task
 */
export function getMockExecutionLogs(taskId: string): MockExecutionLogs | null {
  return mockExecutionLogs[taskId] ?? null
}

/**
 * Check if a task has mock execution logs
 */
export function hasMockExecutionLogs(taskId: string): boolean {
  return taskId in mockExecutionLogs
}
