'use client'

import * as React from 'react'
import type { ReviewPRFile } from '@/lib/types/review'
import { DiffFileHeader } from './diff-file-header'
import type { DiffViewMode } from './diff-viewer'
import { useTheme } from 'next-themes'
import { PatchDiff } from '@pierre/diffs/react'

function buildFilePatch(file: ReviewPRFile) {
  if (!file.patch) return null
  if (file.patch.includes('diff --git')) return file.patch

  const oldName = file.previousFilename ?? file.filename
  const newName = file.filename

  const oldPath = file.status === 'added' ? '/dev/null' : `a/${oldName}`
  const newPath = file.status === 'removed' ? '/dev/null' : `b/${newName}`

  return `diff --git a/${oldName} b/${newName}\n--- ${oldPath}\n+++ ${newPath}\n${file.patch}`
}

interface DiffContentProps {
  files: ReviewPRFile[]
  viewMode: DiffViewMode
  collapsedFiles: Set<string>
  onToggleCollapse: (filename: string) => void
  fileRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
}

export function DiffContent({
  files,
  viewMode,
  collapsedFiles,
  onToggleCollapse,
  fileRefs,
}: DiffContentProps) {
  const { resolvedTheme } = useTheme()
  const themeType = resolvedTheme === 'dark' ? 'dark' : 'light'
  const themeName = resolvedTheme === 'dark' ? 'github-dark' : 'github-light'

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">No changes</p>
          <p className="text-sm">This pull request has no file changes.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {files.map((file) => {
        const isCollapsed = collapsedFiles.has(file.filename)

        return (
          <div
            key={file.filename}
            ref={(el) => {
              fileRefs.current[file.filename] = el
            }}
            className="bg-background"
          >
            <DiffFileHeader
              file={file}
              isCollapsed={isCollapsed}
              onToggle={() => onToggleCollapse(file.filename)}
            />

            {!isCollapsed && file.patch && (
              <div className="overflow-x-auto">
                <PatchDiff
                  patch={buildFilePatch(file) ?? ''}
                  options={{
                    diffStyle: viewMode === 'split' ? 'split' : 'unified',
                    themeType,
                    theme: themeName,
                  }}
                />
              </div>
            )}

            {!isCollapsed && !file.patch && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground bg-muted/30">
                {file.status === 'removed' ? (
                  <p>File was deleted</p>
                ) : (
                  <p>Binary file or diff not available</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
