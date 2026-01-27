import type { Task } from '@/lib/types/task'

export const MOCK_TASK_IDS = {
  // Phase 1: Foundation
  projectSetup: 'task-001-project-setup',
  designSystem: 'task-002-design-system',
  layoutComponents: 'task-003-layout-components',

  // Phase 2: Core Pages
  heroSection: 'task-004-hero-section',
  aboutPage: 'task-005-about-page',
  projectsPage: 'task-006-projects-page',

  // Phase 3: Features
  blogSetup: 'task-007-blog-setup',
  contactForm: 'task-008-contact-form',
  githubIntegration: 'task-009-github-integration',

  // Phase 4: Polish
  animations: 'task-010-animations',
  seoOptimization: 'task-011-seo-optimization',
  performanceAudit: 'task-012-performance-audit',
} as const

const PROJECT_ID = 'mock'

const defaultGeminiModel = 'gemini-3-flash-preview' as const

const rawTasks = [
  {
    id: MOCK_TASK_IDS.projectSetup,
    projectId: PROJECT_ID,
    title: 'Initialize Project Structure',
    description:
      'Set up TanStack Start project with TypeScript, configure ESLint, Prettier, and install core dependencies including shadcn/ui.',
    phase: 1,
    order: 0,
    status: 'DONE',
    dependencies: [],
    prUrl: 'https://github.com/dev0-agent/devportfolio-mock/pull/1',
    prNumber: 1,
    logs: JSON.stringify([
      {
        timestamp: '2026-01-15T10:05:00Z',
        level: 'info',
        message: 'Starting project initialization...',
      },
      {
        timestamp: '2026-01-15T10:06:30Z',
        level: 'info',
        message: 'Dependencies installed successfully',
      },
      {
        timestamp: '2026-01-15T10:08:00Z',
        level: 'success',
        message: 'Project structure created',
      },
    ]),
    attempts: 1,
    maxAttempts: 3,
    createdAt: new Date('2026-01-15T10:00:00Z'),
    updatedAt: new Date('2026-01-15T10:15:00Z'),
  },
  {
    id: MOCK_TASK_IDS.designSystem,
    projectId: PROJECT_ID,
    title: 'Create Design System',
    description:
      'Implement custom color palette, typography scale, and spacing system. Configure CSS variables for theming with zinc color scheme.',
    phase: 1,
    order: 1,
    status: 'DONE',
    dependencies: [MOCK_TASK_IDS.projectSetup],
    prUrl: 'https://github.com/dev0-agent/devportfolio-mock/pull/2',
    prNumber: 2,
    logs: JSON.stringify([
      {
        timestamp: '2026-01-15T11:00:00Z',
        level: 'info',
        message: 'Analyzing design requirements...',
      },
      {
        timestamp: '2026-01-15T11:15:00Z',
        level: 'info',
        message: 'Color palette configured',
      },
      {
        timestamp: '2026-01-15T11:30:00Z',
        level: 'success',
        message: 'Design system complete',
      },
    ]),
    attempts: 1,
    maxAttempts: 3,
    createdAt: new Date('2026-01-15T10:30:00Z'),
    updatedAt: new Date('2026-01-15T11:45:00Z'),
  },
  {
    id: MOCK_TASK_IDS.layoutComponents,
    projectId: PROJECT_ID,
    title: 'Build Layout Components',
    description:
      'Create reusable Header, Footer, and Navigation components. Implement responsive sidebar for mobile. Add theme toggle button.',
    phase: 1,
    order: 2,
    status: 'DONE',
    dependencies: [MOCK_TASK_IDS.designSystem],
    prUrl: 'https://github.com/dev0-agent/devportfolio-mock/pull/3',
    prNumber: 3,
    logs: JSON.stringify([
      {
        timestamp: '2026-01-16T09:00:00Z',
        level: 'info',
        message: 'Creating layout components...',
      },
      {
        timestamp: '2026-01-16T10:00:00Z',
        level: 'info',
        message: 'Header and Footer complete',
      },
      {
        timestamp: '2026-01-16T11:00:00Z',
        level: 'success',
        message: 'All layout components ready',
      },
    ]),
    attempts: 1,
    maxAttempts: 3,
    createdAt: new Date('2026-01-16T08:00:00Z'),
    updatedAt: new Date('2026-01-16T12:00:00Z'),
  },

  {
    id: MOCK_TASK_IDS.heroSection,
    projectId: PROJECT_ID,
    title: 'Implement Hero Section',
    description:
      'Create stunning hero section with animated typing effect, professional headshot placeholder, and call-to-action buttons.',
    phase: 2,
    order: 0,
    status: 'DONE',
    dependencies: [MOCK_TASK_IDS.layoutComponents],
    prUrl: 'https://github.com/dev0-agent/devportfolio-mock/pull/4',
    prNumber: 4,
    logs: JSON.stringify([
      {
        timestamp: '2026-01-17T09:00:00Z',
        level: 'info',
        message: 'Building hero section...',
      },
      {
        timestamp: '2026-01-17T10:00:00Z',
        level: 'info',
        message: 'Typing animation implemented',
      },
      {
        timestamp: '2026-01-17T11:00:00Z',
        level: 'success',
        message: 'Hero section complete',
      },
    ]),
    attempts: 1,
    maxAttempts: 3,
    createdAt: new Date('2026-01-17T08:00:00Z'),
    updatedAt: new Date('2026-01-17T12:00:00Z'),
  },
  {
    id: MOCK_TASK_IDS.aboutPage,
    projectId: PROJECT_ID,
    title: 'Create About Page',
    description:
      'Build about page with bio section, skills grid with icons, timeline of experience, and downloadable resume button.',
    phase: 2,
    order: 1,
    status: 'REVIEW',
    dependencies: [MOCK_TASK_IDS.layoutComponents],
    prUrl: 'https://github.com/dev0-agent/devportfolio-mock/pull/5',
    prNumber: 5,
    logs: JSON.stringify([
      {
        timestamp: '2026-01-18T09:00:00Z',
        level: 'info',
        message: 'Creating about page layout...',
      },
      {
        timestamp: '2026-01-18T10:30:00Z',
        level: 'info',
        message: 'Skills grid implemented',
      },
      {
        timestamp: '2026-01-18T12:00:00Z',
        level: 'info',
        message: 'PR created, awaiting review',
      },
    ]),
    attempts: 1,
    maxAttempts: 3,
    createdAt: new Date('2026-01-18T08:00:00Z'),
    updatedAt: new Date('2026-01-18T12:30:00Z'),
  },
  {
    id: MOCK_TASK_IDS.projectsPage,
    projectId: PROJECT_ID,
    title: 'Build Projects Showcase',
    description:
      'Create projects page with filterable grid layout. Each project card shows screenshot, title, description, tech stack pills, and GitHub/live links.',
    phase: 2,
    order: 2,
    status: 'RUNNING',
    dependencies: [MOCK_TASK_IDS.layoutComponents],
    prUrl: null,
    prNumber: null,
    logs: JSON.stringify([
      {
        timestamp: '2026-01-21T14:00:00Z',
        level: 'info',
        message: 'Starting projects page implementation...',
      },
      {
        timestamp: '2026-01-21T14:15:00Z',
        level: 'info',
        message: 'Project card component created',
      },
      {
        timestamp: '2026-01-21T14:30:00Z',
        level: 'info',
        message: 'Implementing filter functionality...',
      },
    ]),
    attempts: 1,
    maxAttempts: 3,
    createdAt: new Date('2026-01-19T08:00:00Z'),
    updatedAt: new Date('2026-01-21T14:30:00Z'),
  },

  {
    id: MOCK_TASK_IDS.blogSetup,
    projectId: PROJECT_ID,
    title: 'Set Up Blog with MDX',
    description:
      'Configure MDX for blog posts. Create blog index page with post previews, individual post pages with syntax highlighting, and reading time estimates.',
    phase: 3,
    order: 0,
    status: 'PENDING',
    dependencies: [MOCK_TASK_IDS.heroSection, MOCK_TASK_IDS.aboutPage],
    prUrl: null,
    prNumber: null,
    logs: null,
    attempts: 0,
    maxAttempts: 3,
    createdAt: new Date('2026-01-19T10:00:00Z'),
    updatedAt: new Date('2026-01-19T10:00:00Z'),
  },
  {
    id: MOCK_TASK_IDS.contactForm,
    projectId: PROJECT_ID,
    title: 'Implement Contact Form',
    description:
      'Create contact form with email validation, reCAPTCHA integration, and email sending via Resend. Add success/error toast notifications.',
    phase: 3,
    order: 1,
    status: 'FAILED',
    dependencies: [MOCK_TASK_IDS.layoutComponents],
    prUrl: null,
    prNumber: null,
    logs: JSON.stringify([
      {
        timestamp: '2026-01-20T09:00:00Z',
        level: 'info',
        message: 'Creating contact form...',
      },
      {
        timestamp: '2026-01-20T09:30:00Z',
        level: 'info',
        message: 'Form validation implemented',
      },
      {
        timestamp: '2026-01-20T10:00:00Z',
        level: 'error',
        message: 'Failed to configure Resend API',
      },
      {
        timestamp: '2026-01-20T10:01:00Z',
        level: 'error',
        message: 'Error: Missing RESEND_API_KEY environment variable',
      },
    ]),
    attempts: 2,
    maxAttempts: 3,
    createdAt: new Date('2026-01-20T08:00:00Z'),
    updatedAt: new Date('2026-01-20T10:05:00Z'),
  },
  {
    id: MOCK_TASK_IDS.githubIntegration,
    projectId: PROJECT_ID,
    title: 'GitHub API Integration',
    description:
      'Integrate GitHub API to fetch and display repositories. Show repo stats (stars, forks), languages used, and last updated time. Cache responses.',
    phase: 3,
    order: 2,
    status: 'PENDING',
    dependencies: [MOCK_TASK_IDS.projectsPage],
    prUrl: null,
    prNumber: null,
    logs: null,
    attempts: 0,
    maxAttempts: 3,
    createdAt: new Date('2026-01-20T10:00:00Z'),
    updatedAt: new Date('2026-01-20T10:00:00Z'),
  },

  {
    id: MOCK_TASK_IDS.animations,
    projectId: PROJECT_ID,
    title: 'Add Page Transitions & Animations',
    description:
      'Implement smooth page transitions with Framer Motion. Add scroll-triggered animations for content sections. Create loading skeletons.',
    phase: 4,
    order: 0,
    status: 'PENDING',
    dependencies: [
      MOCK_TASK_IDS.blogSetup,
      MOCK_TASK_IDS.contactForm,
      MOCK_TASK_IDS.githubIntegration,
    ],
    prUrl: null,
    prNumber: null,
    logs: null,
    attempts: 0,
    maxAttempts: 3,
    createdAt: new Date('2026-01-21T08:00:00Z'),
    updatedAt: new Date('2026-01-21T08:00:00Z'),
  },
  {
    id: MOCK_TASK_IDS.seoOptimization,
    projectId: PROJECT_ID,
    title: 'SEO & Meta Tags',
    description:
      'Implement comprehensive SEO strategy with dynamic meta tags, Open Graph images, JSON-LD structured data, and sitemap generation.',
    phase: 4,
    order: 1,
    status: 'PENDING',
    dependencies: [MOCK_TASK_IDS.animations],
    prUrl: null,
    prNumber: null,
    logs: null,
    attempts: 0,
    maxAttempts: 3,
    createdAt: new Date('2026-01-21T09:00:00Z'),
    updatedAt: new Date('2026-01-21T09:00:00Z'),
  },
  {
    id: MOCK_TASK_IDS.performanceAudit,
    projectId: PROJECT_ID,
    title: 'Performance Optimization',
    description:
      'Run Lighthouse audit and optimize Core Web Vitals. Implement image optimization, code splitting, and font loading strategies.',
    phase: 4,
    order: 2,
    status: 'SKIPPED',
    dependencies: [MOCK_TASK_IDS.seoOptimization],
    prUrl: null,
    prNumber: null,
    logs: JSON.stringify([
      {
        timestamp: '2026-01-21T10:00:00Z',
        level: 'info',
        message: 'Task skipped by user - will address post-launch',
      },
    ]),
    attempts: 0,
    maxAttempts: 3,
    createdAt: new Date('2026-01-21T10:00:00Z'),
    updatedAt: new Date('2026-01-21T10:05:00Z'),
  },
] satisfies Omit<Task, 'geminiModel'>[]

export const mockTasks: Task[] = rawTasks.map((task) => ({
  ...task,
  geminiModel: defaultGeminiModel,
}))

/**
 * Get task counts by status for statistics
 */
export function getMockTaskStats() {
  return {
    total: mockTasks.length,
    pending: mockTasks.filter((t) => t.status === 'PENDING').length,
    running: mockTasks.filter((t) => t.status === 'RUNNING').length,
    review: mockTasks.filter((t) => t.status === 'REVIEW').length,
    done: mockTasks.filter((t) => t.status === 'DONE').length,
    failed: mockTasks.filter((t) => t.status === 'FAILED').length,
    skipped: mockTasks.filter((t) => t.status === 'SKIPPED').length,
  }
}

export function getMockTasksByPhase() {
  const phases = new Map<number, Task[]>()

  for (const task of mockTasks) {
    const existing = phases.get(task.phase) || []
    phases.set(task.phase, [...existing, task])
  }

  return phases
}

export function getMockTasksByStatus() {
  return {
    PENDING: mockTasks.filter((t) => t.status === 'PENDING'),
    RUNNING: mockTasks.filter((t) => t.status === 'RUNNING'),
    REVIEW: mockTasks.filter((t) => t.status === 'REVIEW'),
    DONE: mockTasks.filter((t) => t.status === 'DONE'),
    FAILED: mockTasks.filter((t) => t.status === 'FAILED'),
    SKIPPED: mockTasks.filter((t) => t.status === 'SKIPPED'),
  }
}
