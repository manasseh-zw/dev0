'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ChatPreviewIcon,
  DashboardSquare01Icon,
  GitPullRequestIcon,
  Settings01Icon,
} from '@hugeicons/core-free-icons'
import { Logo, LogoIcon } from '@/components/logo'
import type { Route } from './nav-main'
import DashboardNavigation from '@/components/layout/sidebar/nav-main'
import { TeamSwitcher } from '@/components/layout/sidebar/team-switcher'
import { useLocation } from '@tanstack/react-router'

const teams = [
  {
    id: '1',
    name: 'Mission Control',
    plan: 'Primary project',
    initials: 'MC',
    gradient: 'from-orange-400 to-rose-500',
  },
  {
    id: '2',
    name: 'Agent Reviews',
    plan: 'Secondary project',
    initials: 'AR',
    gradient: 'from-sky-400 to-indigo-500',
  },
  {
    id: '3',
    name: 'Preview Lab',
    plan: 'Sandbox project',
    initials: 'PL',
    gradient: 'from-emerald-400 to-teal-500',
  },
]

export function DashboardSidebar() {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const { pathname } = useLocation()
  const projectId = pathname.split('/')[2] || 'mock'
  const basePath = `/project/${projectId}`

  const dashboardRoutes: Route[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: <HugeiconsIcon icon={DashboardSquare01Icon} className="size-4" />,
      link: basePath,
    },
    {
      id: 'review',
      title: 'Review',
      icon: <HugeiconsIcon icon={GitPullRequestIcon} className="size-4" />,
      link: `${basePath}/review`,
    },
    {
      id: 'preview',
      title: 'Preview',
      icon: <HugeiconsIcon icon={ChatPreviewIcon} className="size-4" />,
      link: `${basePath}/preview`,
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: <HugeiconsIcon icon={Settings01Icon} className="size-4" />,
      link: '#',
    },
  ]

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader
        className={cn(
          'flex md:pt-3.5',
          isCollapsed
            ? 'flex-row items-center justify-between gap-y-4 md:flex-col md:items-start md:justify-start'
            : 'flex-row items-center justify-between',
        )}
      >
        <a href="#" className="flex items-center gap-2">
          {isCollapsed ? (
            <LogoIcon className="h-5 w-7" />
          ) : (
            <Logo height={20} className="text-foreground" />
          )}
        </a>

        <motion.div
          key={isCollapsed ? 'header-collapsed' : 'header-expanded'}
          className={cn(
            'flex items-center gap-2',
            isCollapsed ? 'flex-row md:flex-col-reverse' : 'flex-row',
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <SidebarTrigger />
        </motion.div>
      </SidebarHeader>
      <SidebarContent className="gap-4 px-2 py-4">
        <DashboardNavigation routes={dashboardRoutes} />
      </SidebarContent>
      <SidebarFooter className="px-2">
        <TeamSwitcher teams={teams} />
      </SidebarFooter>
    </Sidebar>
  )
}
