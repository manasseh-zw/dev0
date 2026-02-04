'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { GitMergeIcon, Loading03Icon } from '@hugeicons/core-free-icons'
import { mergePullRequest } from '@/lib/actions'
import { useRouter } from '@tanstack/react-router'

interface MergeConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prNumber: number
  baseBranch: string
  taskId: string
  projectId: string
}

export function MergeConfirmDialog({
  open,
  onOpenChange,
  prNumber,
  baseBranch,
  taskId,
  projectId,
}: MergeConfirmDialogProps) {
  const router = useRouter()
  const [isMerging, setIsMerging] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleMerge = async () => {
    setIsMerging(true)
    setError(null)

    try {
      const result = await mergePullRequest({
        data: { projectId, taskId },
      })

      if (result.success) {
        onOpenChange(false)
        await router.invalidate()
        router.navigate({
          to: '/project/$projectId/review/$taskId',
          params: { projectId, taskId },
        })
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to merge pull request',
      )
    } finally {
      setIsMerging(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HugeiconsIcon
              icon={GitMergeIcon}
              size={20}
              className="text-purple-500"
            />
            Merge Pull Request
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to merge PR #{prNumber}? This will merge the
            changes into{' '}
            <code className="px-1 py-0.5 bg-muted rounded text-foreground">
              {baseBranch}
            </code>
            .
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isMerging}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMerge}
            disabled={isMerging}
            className="gap-1.5"
          >
            {isMerging ? (
              <>
                <HugeiconsIcon
                  icon={Loading03Icon}
                  size={14}
                  className="animate-spin"
                />
                Merging...
              </>
            ) : (
              <>
                <HugeiconsIcon icon={GitMergeIcon} size={14} />
                Confirm Merge
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
