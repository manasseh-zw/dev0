export type TechStack = 'tanstack-start' | 'react-vite' | 'nextjs'

export type TemplateConfig = {
  id: TechStack
  name: string
  description: string
  repoUrl: string
  features: string[]
}

/**
 * Available project templates
 */
export const TEMPLATES: Record<TechStack, TemplateConfig> = {
  'tanstack-start': {
    id: 'tanstack-start',
    name: 'TanStack Start',
    description: 'Full-stack React framework with file-based routing and SSR',
    repoUrl: 'https://github.com/dev0-agent/tanstack-template.git',
    features: ['TanStack Start', 'TanStack Router', 'shadcn/ui', 'TypeScript'],
  },
  'react-vite': {
    id: 'react-vite',
    name: 'React + Vite',
    description: 'Fast and modern React SPA with Vite bundler',
    repoUrl: 'https://github.com/dev0-agent/react-vite-template.git',
    features: ['React 19', 'Vite', 'shadcn/ui', 'TypeScript'],
  },
  'nextjs': {
    id: 'nextjs',
    name: 'Next.js',
    description: 'The React framework for production with App Router',
    repoUrl: 'https://github.com/dev0-agent/nextjs-template.git',
    features: ['Next.js 16', 'App Router', 'shadcn/ui', 'TypeScript'],
  },
} as const


export function getTemplate(techStack: TechStack): TemplateConfig {
  return TEMPLATES[techStack]
}

export function getAllTemplates(): TemplateConfig[] {
  return Object.values(TEMPLATES)
}

export const DEFAULT_TEMPLATE: TechStack = 'tanstack-start'
