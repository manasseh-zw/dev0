import { HugeiconsIcon } from '@hugeicons/react'
import { GithubIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { ThemeSwitcher } from '@/components/theme-switcher'

type ProjectHeaderProps = {
  title: string
  repoUrl?: string | null
}

export function ProjectHeader({ title, repoUrl }: ProjectHeaderProps) {
  return (
    <div className="border-b border-border bg-background">
      <div className="flex items-center justify-between px-3 lg:px-6 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-base lg:text-lg font-semibold">{title}</h1>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <ThemeSwitcher />
          <Button variant="outline" className="shadow-none" disabled={!repoUrl}>
            {repoUrl ? (
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <HugeiconsIcon icon={GithubIcon} className="size-4" />
                GitHub
              </a>
            ) : (
              <span className="flex items-center gap-2">
                <HugeiconsIcon icon={GithubIcon} className="size-4" />
                GitHub
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
