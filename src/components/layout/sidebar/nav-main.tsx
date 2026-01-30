'use client'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuItem as SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { Link, useMatchRoute } from '@tanstack/react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons'
import type React from 'react'
import { useState } from 'react'

export type Route = {
  id: string
  title: string
  icon?: React.ReactNode
  link: string
  subs?: {
    title: string
    link: string
    icon?: React.ReactNode
  }[]
}

export default function DashboardNavigation({ routes }: { routes: Route[] }) {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const [openCollapsible, setOpenCollapsible] = useState<string | null>(null)
  const matchRoute = useMatchRoute()

  const isActiveLink = (link: string) =>
    link.startsWith('/') && !!matchRoute({ to: link, fuzzy: true })

  return (
    <SidebarMenu>
      {routes.map((route) => {
        const isOpen = !isCollapsed && openCollapsible === route.id
        const hasSubRoutes = !!route.subs?.length
        const isRouteActive = isActiveLink(route.link)
        const isSubRouteActive =
          route.subs?.some((subRoute) => isActiveLink(subRoute.link)) ?? false
        const isActive = isRouteActive || isSubRouteActive

        return (
          <SidebarMenuItem key={route.id}>
            {hasSubRoutes ? (
              <Collapsible
                open={isOpen}
                onOpenChange={(open) =>
                  setOpenCollapsible(open ? route.id : null)
                }
                className="w-full"
              >
                <CollapsibleTrigger
                  render={
                    <SidebarMenuButton
                      isActive={isActive}
                      className={cn(
                        'flex w-full items-center rounded-lg px-2 transition-colors data-active:bg-sidebar-muted data-active:text-foreground',
                        isOpen
                          ? 'bg-sidebar-muted text-foreground'
                          : 'text-muted-foreground hover:bg-sidebar-muted hover:text-foreground',
                        isCollapsed && 'justify-center',
                      )}
                    />
                  }
                >
                  {route.icon}
                  {!isCollapsed && (
                    <span className="ml-2 flex-1 text-sm font-medium">
                      {route.title}
                    </span>
                  )}
                  {!isCollapsed && hasSubRoutes && (
                    <span className="ml-auto">
                      {isOpen ? (
                        <HugeiconsIcon
                          icon={ArrowUp01Icon}
                          className="size-4"
                        />
                      ) : (
                        <HugeiconsIcon
                          icon={ArrowDown01Icon}
                          className="size-4"
                        />
                      )}
                    </span>
                  )}
                </CollapsibleTrigger>

                {!isCollapsed && (
                  <CollapsibleContent>
                    <SidebarMenuSub className="my-1 ml-3.5 ">
                      {route.subs?.map((subRoute) => (
                        <SidebarMenuSubItem
                          key={`${route.id}-${subRoute.title}`}
                          className="h-auto"
                        >
                          <SidebarMenuSubButton
                            isActive={isActiveLink(subRoute.link)}
                            className="px-4 py-1.5 text-muted-foreground hover:bg-sidebar-muted hover:text-foreground data-active:bg-sidebar-muted data-active:text-foreground"
                            render={<Link to={subRoute.link} />}
                          >
                            {subRoute.title}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </Collapsible>
            ) : (
              <SidebarMenuButton
                tooltip={route.title}
                isActive={isActive}
                className={cn(
                  'text-muted-foreground hover:bg-sidebar-muted hover:text-foreground data-active:bg-sidebar-muted data-active:text-foreground',
                  isCollapsed && 'justify-center',
                )}
                render={<Link to={route.link} />}
              >
                {route.icon}
                {!isCollapsed && (
                  <span className="ml-2 text-sm font-medium">
                    {route.title}
                  </span>
                )}
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
