'use client'

import type { Task } from '@/lib/types'
import type { Status } from '@/components/task/mock-data/statuses'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Calendar01Icon,
  GitBranchIcon,
  CpuIcon,
  LinkSquare01Icon,
  Clock01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons'
import { Badge } from '@/components/ui/badge'

interface TaskInfoProps {
  task: Task
  status: Status
}

const modelLabels: Record<string, { label: string; dotClassName: string }> = {
  'gemini-3-pro-preview': {
    label: 'Gemini Pro',
    dotClassName: 'bg-blue-500/80',
  },
  'gemini-3-flash-preview': {
    label: 'Gemini Flash',
    dotClassName: 'bg-amber-400/80',
  },
}

export function TaskInfo({ task, status }: TaskInfoProps) {
  const StatusIcon = status.icon
  const model =
    modelLabels[task.geminiModel ?? 'gemini-3-pro-preview'] ??
    modelLabels['gemini-3-pro-preview']

  return (
    <div className="space-y-7">
      {/* Description */}
      <section className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Description
        </h4>
        <p className="text-sm text-foreground leading-relaxed">
          {task.description ?? 'No description provided.'}
        </p>
      </section>

      {/* Status & Model - side by side */}
      <section className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Status
          </h4>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 py-1 px-2.5 font-medium"
            >
              <StatusIcon />
              {status.name}
            </Badge>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Model
          </h4>
          <div className="flex items-center gap-2 text-sm">
            <HugeiconsIcon
              icon={CpuIcon}
              className="size-4 text-muted-foreground"
            />
            <span className={`size-2 rounded-full ${model.dotClassName}`} />
            <span>{model.label}</span>
          </div>
        </div>
      </section>

      {/* Phase & Attempts - side by side */}
      <section className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Phase
          </h4>
          <div className="flex items-center gap-2 text-sm">
            <HugeiconsIcon
              icon={Calendar01Icon}
              className="size-4 text-muted-foreground"
            />
            <span>Phase {task.phase}</span>
          </div>
        </div>
        {task.status !== 'PENDING' && task.maxAttempts > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Attempts
            </h4>
            <div className="flex items-center gap-2 text-sm">
              <span>
                {task.attempts} / {task.maxAttempts}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Dependencies - full width */}
      {task.dependencies.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Dependencies
          </h4>
          <div className="flex flex-wrap gap-2">
            {task.dependencies.map((depId) => (
              <Badge
                key={depId}
                variant="secondary"
                className="gap-1.5 text-xs font-mono max-w-full"
              >
                <HugeiconsIcon
                  icon={GitBranchIcon}
                  className="size-3 shrink-0"
                />
                <span className="truncate">{depId}</span>
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* PR Link */}
      {task.prUrl && (
        <section className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Pull Request
          </h4>
          <a
            href={task.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <HugeiconsIcon icon={LinkSquare01Icon} className="size-4" />
            {task.prNumber ? `PR #${task.prNumber}` : 'View Pull Request'}
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" />
          </a>
        </section>
      )}

      {/* Timestamps */}
      <section className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Timeline
        </h4>
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Clock01Icon} className="size-4" />
            <span>
              Created: {new Date(task.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Clock01Icon} className="size-4" />
            <span>
              Updated: {new Date(task.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
