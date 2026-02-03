'use client'

import * as React from 'react'
import type { ReviewPRFile } from '@/lib/types/review'
import { cn } from '@/lib/utils'
import {
  ChevronRightIcon,
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface DiffFileTreeProps {
  files: ReviewPRFile[]
  selectedFile?: string
  onFileSelect: (filename: string) => void
}

interface TreeNode {
  name: string
  path: string
  isFolder: boolean
  children: TreeNode[]
  file?: ReviewPRFile
}

/**
 * Builds a nested tree structure from a flat list of file paths
 */
function buildFileTree(files: ReviewPRFile[]): TreeNode[] {
  const root: TreeNode[] = []

  for (const file of files) {
    const parts = file.filename.split('/')
    let currentLevel = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLastPart = i === parts.length - 1
      const currentPath = parts.slice(0, i + 1).join('/')

      let existing = currentLevel.find((n) => n.name === part)

      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          isFolder: !isLastPart,
          children: [],
          file: isLastPart ? file : undefined,
        }
        currentLevel.push(existing)
      }

      if (!isLastPart) {
        currentLevel = existing.children
      }
    }
  }

  // Sort: folders first, then files, alphabetically
  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes
      .map((node) => ({
        ...node,
        children: sortNodes(node.children),
      }))
      .sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1
        if (!a.isFolder && b.isFolder) return 1
        return a.name.localeCompare(b.name)
      })
  }

  return sortNodes(root)
}

/**
 * Get status indicator color and symbol
 */
function getFileStatusIndicator(status: ReviewPRFile['status']) {
  switch (status) {
    case 'added':
      return { color: 'text-green-600 dark:text-green-400', symbol: 'A' }
    case 'modified':
      return { color: 'text-yellow-600 dark:text-yellow-400', symbol: 'M' }
    case 'removed':
      return { color: 'text-red-600 dark:text-red-400', symbol: 'D' }
    case 'renamed':
      return { color: 'text-blue-600 dark:text-blue-400', symbol: 'R' }
    case 'copied':
      return { color: 'text-blue-600 dark:text-blue-400', symbol: 'C' }
    default:
      return { color: 'text-muted-foreground', symbol: '~' }
  }
}

interface TreeNodeComponentProps {
  node: TreeNode
  selectedFile?: string
  onFileSelect: (filename: string) => void
  defaultExpanded?: boolean
}

function TreeNodeComponent({
  node,
  selectedFile,
  onFileSelect,
  defaultExpanded = true,
}: TreeNodeComponentProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)

  if (node.isFolder) {
    return (
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm transition-colors hover:bg-muted/50">
          <ChevronRightIcon
            className={cn(
              'size-3.5 shrink-0 text-muted-foreground transition-transform',
              isExpanded && 'rotate-90',
            )}
          />
          {isExpanded ? (
            <FolderOpenIcon className="size-4 text-blue-500 shrink-0" />
          ) : (
            <FolderIcon className="size-4 text-blue-500 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="ml-3 border-l border-border pl-2">
            {node.children.map((child) => (
              <TreeNodeComponent
                key={child.path}
                node={child}
                selectedFile={selectedFile}
                onFileSelect={onFileSelect}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  // File node
  const file = node.file!
  const isSelected = selectedFile === file.filename
  const statusIndicator = getFileStatusIndicator(file.status)

  return (
    <button
      type="button"
      onClick={() => onFileSelect(file.filename)}
      className={cn(
        'flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm transition-colors hover:bg-muted/50',
        isSelected && 'bg-muted',
      )}
    >
      <span className="size-3.5 shrink-0" /> {/* Spacer for alignment */}
      <FileIcon className="size-4 text-muted-foreground shrink-0" />
      <span className="truncate flex-1">{node.name}</span>
      {/* Status indicator */}
      <span
        className={cn(
          'text-[10px] font-medium shrink-0 w-4 text-center',
          statusIndicator.color,
        )}
      >
        {statusIndicator.symbol}
      </span>
      {/* Line changes */}
      <span className="text-[10px] shrink-0 tabular-nums">
        <span className="text-green-600 dark:text-green-400">
          +{file.additions}
        </span>{' '}
        <span className="text-red-600 dark:text-red-400">
          -{file.deletions}
        </span>
      </span>
    </button>
  )
}

export function DiffFileTree({
  files,
  selectedFile,
  onFileSelect,
}: DiffFileTreeProps) {
  const tree = React.useMemo(() => buildFileTree(files), [files])

  if (files.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        No files changed
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-2">
      <div className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">
        Changed files ({files.length})
      </div>
      {tree.map((node) => (
        <TreeNodeComponent
          key={node.path}
          node={node}
          selectedFile={selectedFile}
          onFileSelect={onFileSelect}
        />
      ))}
    </div>
  )
}
