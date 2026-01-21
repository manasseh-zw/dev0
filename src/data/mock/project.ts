import type { ProjectWithTasks } from '@/lib/actions'

export const mockProject: ProjectWithTasks = {
  id: 'mock',
  name: 'DevPortfolio Pro',
  description: 'A stunning developer portfolio website with blog, project showcase, and contact form. Features dark mode, smooth animations, and GitHub integration.',
  status: 'ACTIVE',
  
  // GitHub Repository
  repoUrl: 'https://github.com/dev0-agent/devportfolio-mock',
  repoName: 'dev0-agent/devportfolio-mock',
  
  // Configuration
  techStack: 'tanstack-start',
  theme: 'zinc',
  
  // Original vibe input
  vibeInput: 'A sleek developer portfolio that showcases my projects, has a blog section, and looks professional. Should have dark mode and smooth animations.',
  
  // AI-generated spec (markdown)
  specContent: `# DevPortfolio Pro

Your professional developer portfolio, reimagined.

## Overview

DevPortfolio Pro is a modern, performant developer portfolio built with TanStack Start. It features a beautiful dark mode, smooth page transitions, and seamless GitHub integration to automatically showcase your repositories.

## Features

- Responsive hero section with animated typing effect
- Project showcase with GitHub API integration
- Blog with MDX support
- Contact form with email integration
- Dark/light theme toggle
- Smooth page transitions and micro-animations

## Technical Notes

Uses TanStack Query for data fetching, Framer Motion for animations, and shadcn/ui for the component library.`,

  tasks: [], // Will be populated separately
  
  createdAt: new Date('2026-01-15T10:00:00Z'),
  updatedAt: new Date('2026-01-21T14:30:00Z'),
}
