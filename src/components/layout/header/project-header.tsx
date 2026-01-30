'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { GithubIcon, Link01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { ThemeSwitcher } from '@/components/theme-switcher'

type ProjectHeaderProps = {
  title: string
}

export function ProjectHeader({ title }: ProjectHeaderProps) {
  return (
    <div className="border-b border-border bg-background">
      <div className="flex items-center justify-between px-3 lg:px-6 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-base lg:text-lg font-semibold">{title}</h1>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <ThemeSwitcher />
          <Button variant="outline" className="shadow-none">
            <a
              href="https://github.com/ln-dev7/square-ui/tree/master/templates/task-management"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <HugeiconsIcon icon={GithubIcon} className="size-4" />
              GitHub
            </a>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="gap-2 hidden lg:flex"
          >
            <HugeiconsIcon icon={Link01Icon} className="size-4" />
            Share
          </Button>
        </div>
      </div>
    </div>
  )
}
