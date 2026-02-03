import { MOCK_TASK_IDS } from './tasks'

export interface MockPRComment {
  id: string
  author: string
  authorType: 'agent' | 'user'
  body: string
  createdAt: string
}

export interface MockPRDetails {
  taskId: string
  prNumber: number
  title: string
  body: string // Markdown content
  state: 'open' | 'closed' | 'merged'
  createdAt: string
  updatedAt: string
  headBranch: string
  baseBranch: string
  additions: number
  deletions: number
  changedFiles: number
  commits: number
  comments: MockPRComment[]
}

// Mock PR details for tasks that have PRs
export const mockPRDetails: Record<string, MockPRDetails> = {
  [MOCK_TASK_IDS.projectSetup]: {
    taskId: MOCK_TASK_IDS.projectSetup,
    prNumber: 1,
    title: 'feat: Initialize Project Structure',
    body: `## Summary

This PR sets up the initial project structure with TanStack Start and TypeScript.

### Changes

- Initialized TanStack Start project with TypeScript configuration
- Configured ESLint and Prettier for code quality
- Installed core dependencies including shadcn/ui
- Set up the basic folder structure

### Technical Details

- Using TypeScript 5.x with strict mode enabled
- Configured path aliases for clean imports
- Added Tailwind CSS with custom configuration

### Testing

- Verified build passes successfully
- All linting rules pass
`,
    state: 'merged',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:15:00Z',
    headBranch: 'feat/project-setup',
    baseBranch: 'main',
    additions: 1247,
    deletions: 0,
    changedFiles: 23,
    commits: 3,
    comments: [
      {
        id: 'comment-1',
        author: 'Dev0 Agent',
        authorType: 'agent',
        body: 'Project structure has been initialized. Ready for review.',
        createdAt: '2026-01-15T10:08:00Z',
      },
    ],
  },

  [MOCK_TASK_IDS.designSystem]: {
    taskId: MOCK_TASK_IDS.designSystem,
    prNumber: 2,
    title: 'feat: Create Design System',
    body: `## Summary

Implemented a comprehensive design system with custom theming support.

### Changes

- Created custom color palette based on zinc color scheme
- Implemented typography scale with responsive sizing
- Set up spacing system with consistent values
- Configured CSS variables for light/dark theme support

### Color Tokens

\`\`\`css
--background: 0 0% 100%;
--foreground: 240 10% 3.9%;
--primary: 240 5.9% 10%;
--secondary: 240 4.8% 95.9%;
\`\`\`

### Testing

- Verified theme switching works correctly
- All components render properly in both themes
`,
    state: 'merged',
    createdAt: '2026-01-15T10:30:00Z',
    updatedAt: '2026-01-15T11:45:00Z',
    headBranch: 'feat/design-system',
    baseBranch: 'main',
    additions: 456,
    deletions: 12,
    changedFiles: 8,
    commits: 2,
    comments: [
      {
        id: 'comment-2',
        author: 'Dev0 Agent',
        authorType: 'agent',
        body: 'Design system implementation complete. Color palette and typography configured.',
        createdAt: '2026-01-15T11:30:00Z',
      },
    ],
  },

  [MOCK_TASK_IDS.layoutComponents]: {
    taskId: MOCK_TASK_IDS.layoutComponents,
    prNumber: 3,
    title: 'feat: Build Layout Components',
    body: `## Summary

Created reusable layout components for the application.

### Components Added

- **Header**: Responsive header with navigation and theme toggle
- **Footer**: Simple footer with links and copyright
- **Navigation**: Desktop and mobile navigation with responsive sidebar
- **Theme Toggle**: Button to switch between light and dark modes

### Responsive Design

All components are fully responsive:
- Mobile: Collapsible sidebar navigation
- Tablet: Condensed header layout
- Desktop: Full navigation bar

### Accessibility

- Proper ARIA labels on interactive elements
- Keyboard navigation support
- Focus management for mobile menu
`,
    state: 'merged',
    createdAt: '2026-01-16T08:00:00Z',
    updatedAt: '2026-01-16T12:00:00Z',
    headBranch: 'feat/layout-components',
    baseBranch: 'main',
    additions: 892,
    deletions: 34,
    changedFiles: 12,
    commits: 4,
    comments: [],
  },

  [MOCK_TASK_IDS.heroSection]: {
    taskId: MOCK_TASK_IDS.heroSection,
    prNumber: 4,
    title: 'feat: Implement Hero Section',
    body: `## Summary

Created a stunning hero section with animations and call-to-action.

### Features

- Animated typing effect for the tagline
- Professional headshot placeholder with gradient border
- Primary and secondary CTA buttons
- Subtle background animation

### Animation Details

Using Framer Motion for smooth animations:
- Staggered text reveal
- Fade-in for profile image
- Hover effects on buttons

### Performance

- Animations respect \`prefers-reduced-motion\`
- Lazy loading for images
- Optimized for Core Web Vitals
`,
    state: 'merged',
    createdAt: '2026-01-17T08:00:00Z',
    updatedAt: '2026-01-17T12:00:00Z',
    headBranch: 'feat/hero-section',
    baseBranch: 'main',
    additions: 534,
    deletions: 18,
    changedFiles: 6,
    commits: 3,
    comments: [
      {
        id: 'comment-3',
        author: 'Dev0 Agent',
        authorType: 'agent',
        body: 'Hero section complete with all animations. Please review the typing effect timing.',
        createdAt: '2026-01-17T11:00:00Z',
      },
    ],
  },

  [MOCK_TASK_IDS.aboutPage]: {
    taskId: MOCK_TASK_IDS.aboutPage,
    prNumber: 5,
    title: 'feat: Create About Page',
    body: `## Summary

Built the About page with bio, skills, and experience sections.

### Sections

1. **Bio Section**: Personal introduction with profile image
2. **Skills Grid**: Visual representation of technical skills with icons
3. **Experience Timeline**: Career history with company logos and dates
4. **Resume Download**: Button to download PDF resume

### Skills Featured

- React, TypeScript, Node.js
- PostgreSQL, MongoDB
- AWS, Docker, Kubernetes
- And more...

### Responsive Design

- Mobile: Single column layout
- Desktop: Two-column layout with sidebar

### TODO

- [ ] Add actual resume PDF
- [ ] Finalize skill icons
- [ ] Review timeline dates
`,
    state: 'open',
    createdAt: '2026-01-18T08:00:00Z',
    updatedAt: '2026-01-18T12:30:00Z',
    headBranch: 'feat/about-page',
    baseBranch: 'main',
    additions: 678,
    deletions: 45,
    changedFiles: 9,
    commits: 5,
    comments: [
      {
        id: 'comment-4',
        author: 'Dev0 Agent',
        authorType: 'agent',
        body: 'About page implementation complete. Skills grid and timeline are ready for review.',
        createdAt: '2026-01-18T10:30:00Z',
      },
      {
        id: 'comment-5',
        author: 'Dev0 Agent',
        authorType: 'agent',
        body: 'Added experience timeline with animation effects. Resume download button is functional but needs the actual PDF file.',
        createdAt: '2026-01-18T12:00:00Z',
      },
    ],
  },
}

/**
 * Get mock PR details for a task
 */
export function getMockPRDetails(taskId: string): MockPRDetails | null {
  return mockPRDetails[taskId] ?? null
}

/**
 * Check if a task has mock PR details
 */
export function hasMockPRDetails(taskId: string): boolean {
  return taskId in mockPRDetails
}
