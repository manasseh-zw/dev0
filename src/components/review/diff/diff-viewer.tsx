'use client'

import * as React from 'react'
import type { Task } from '@/lib/types'
import type { ReviewPRFile, ReviewPRSummary } from '@/lib/types/review'
import { DiffSubheader } from './diff-subheader'
import { DiffFileTree } from './diff-file-tree'
import { DiffContent } from './diff-content'
import { MergeConfirmDialog } from './merge-confirm-dialog'
import { cn } from '@/lib/utils'

export type DiffViewMode = 'split' | 'unified'

interface DiffViewerProps {
  task: Task
  prDetails: ReviewPRSummary | null
  files: ReviewPRFile[]
}

export function DiffViewer({ task, prDetails, files }: DiffViewerProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<DiffViewMode>('split')
  const [selectedFile, setSelectedFile] = React.useState<string | undefined>()
  const [collapsedFiles, setCollapsedFiles] = React.useState<Set<string>>(
    new Set(),
  )
  const [showMergeDialog, setShowMergeDialog] = React.useState(false)

  // Create refs for each file for scroll-to functionality
  const fileRefs = React.useRef<Record<string, HTMLDivElement | null>>({})

  const handleFileSelect = (filename: string) => {
    setSelectedFile(filename)
    // Scroll to the file
    const ref = fileRefs.current[filename]
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const toggleFileCollapse = (filename: string) => {
    setCollapsedFiles((prev) => {
      const next = new Set(prev)
      if (next.has(filename)) {
        next.delete(filename)
      } else {
        next.add(filename)
      }
      return next
    })
  }

  const prState = prDetails?.state ?? 'open'
  const canMerge = prState === 'open'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Subheader with controls */}
      <DiffSubheader
        sidebarCollapsed={sidebarCollapsed}
        onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        prNumber={prDetails?.prNumber ?? task.prNumber ?? 0}
        onMerge={() => setShowMergeDialog(true)}
        canMerge={canMerge}
        prState={prState}
        projectId={task.projectId}
        taskId={task.id}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* File tree sidebar */}
        <div
          className={cn(
            'border-r border-border bg-muted/30 transition-all duration-200 ease-in-out overflow-hidden',
            sidebarCollapsed ? 'w-0' : 'w-72',
          )}
        >
          {!sidebarCollapsed && (
            <DiffFileTree
              files={files}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
            />
          )}
        </div>

        {/* Diff content */}
        <div className="flex-1 overflow-auto">
          <DiffContent
            files={files}
            viewMode={viewMode}
            collapsedFiles={collapsedFiles}
            onToggleCollapse={toggleFileCollapse}
            fileRefs={fileRefs}
          />
        </div>
      </div>

      {/* Merge confirmation dialog */}
      <MergeConfirmDialog
        open={showMergeDialog}
        onOpenChange={setShowMergeDialog}
        prNumber={prDetails?.prNumber ?? task.prNumber ?? 0}
        baseBranch={prDetails?.baseBranch ?? 'main'}
        taskId={task.id}
        projectId={task.projectId}
      />
    </div>
  )
}
