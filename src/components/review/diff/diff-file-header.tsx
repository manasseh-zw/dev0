import type { ReviewPRFile } from '@/lib/types/review'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons'
import { FileIcon } from 'lucide-react'

interface DiffFileHeaderProps {
  file: ReviewPRFile
  isCollapsed: boolean
  onToggle: () => void
}

/**
 * Get status badge styles
 */
function getStatusBadge(status: ReviewPRFile['status']) {
  switch (status) {
    case 'added':
      return {
        label: 'Added',
        className:
          'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
      }
    case 'modified':
      return {
        label: 'Modified',
        className:
          'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
      }
    case 'removed':
      return {
        label: 'Deleted',
        className:
          'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      }
    case 'renamed':
      return {
        label: 'Renamed',
        className:
          'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      }
    case 'copied':
      return {
        label: 'Copied',
        className:
          'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      }
    default:
      return {
        label: 'Changed',
        className: 'bg-muted text-muted-foreground border-border',
      }
  }
}

export function DiffFileHeader({
  file,
  isCollapsed,
  onToggle,
}: DiffFileHeaderProps) {
  const statusBadge = getStatusBadge(file.status)

  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-2 bg-muted/50 border-b border-border backdrop-blur-sm">
      {/* Collapse toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onToggle}
        className="shrink-0"
      >
        <HugeiconsIcon
          icon={isCollapsed ? ArrowDown01Icon : ArrowUp01Icon}
          size={14}
        />
      </Button>

      {/* File icon */}
      <FileIcon className="size-4 text-muted-foreground shrink-0" />

      {/* File path */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-mono truncate block">
          {file.previousFilename && file.status === 'renamed' ? (
            <>
              <span className="text-muted-foreground">
                {file.previousFilename}
              </span>
              <span className="text-muted-foreground mx-2">→</span>
              <span>{file.filename}</span>
            </>
          ) : (
            file.filename
          )}
        </span>
      </div>

      {/* Status badge */}
      <span
        className={cn(
          'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium',
          statusBadge.className,
        )}
      >
        {statusBadge.label}
      </span>

      {/* Line changes */}
      <div className="shrink-0 flex items-center gap-2 text-xs tabular-nums">
        <span className="text-green-600 dark:text-green-400">
          +{file.additions}
        </span>
        <span className="text-red-600 dark:text-red-400">
          -{file.deletions}
        </span>
      </div>
    </div>
  )
}
