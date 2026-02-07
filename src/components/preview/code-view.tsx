'use client'

import { useEffect, useMemo, useState } from 'react'
import { FileTree } from '@/components/ui/file-tree'
import {
  CodeBlock,
  CodeBlockBody,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockHeader,
  CodeBlockItem,
} from '@/components/ui/code-block'
import type { BundledLanguage } from 'shiki'
import type { FileTreeNode } from '@/lib/actions'
import { cn } from '@/lib/utils'

type FileContent = {
  content: string
  truncated: boolean
}

type CodeViewProps = {
  fileTree: FileTreeNode[]
  onReadFile: (path: string) => Promise<FileContent>
  onReadFiles?: (paths: string[]) => Promise<
    | {
        files: Record<string, string>
        truncated: Record<string, boolean>
      }
    | undefined
  >
}

const DEFAULT_FILE = 'README.md'

const LANGUAGE_BY_EXT: Record<string, BundledLanguage> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  json: 'json',
  md: 'markdown',
  css: 'css',
  scss: 'scss',
  html: 'html',
  svg: 'xml',
  yml: 'yaml',
  yaml: 'yaml',
  sh: 'bash',
  toml: 'toml',
}

function getLanguage(path: string): BundledLanguage {
  const ext = path.split('.').pop() ?? ''
  return LANGUAGE_BY_EXT[ext] ?? 'text'
}

function normalizePath(path: string) {
  return path
    .replace(/^\$HOME\/project\/?/, '')
    .replace(/^\/home\/user\/project\/?/, '')
    .replace(/^\//, '')
}

function buildPathTypeMap(
  nodes: FileTreeNode[],
  map: Map<string, FileTreeNode['type']>,
) {
  for (const node of nodes) {
    map.set(normalizePath(node.path), node.type)
    if (node.children) buildPathTypeMap(node.children, map)
  }
}

function collectFilePaths(nodes: FileTreeNode[], out: string[]) {
  for (const node of nodes) {
    if (node.type === 'file') {
      out.push(node.path)
    } else if (node.children) {
      collectFilePaths(node.children, out)
    }
  }
}

const DEFAULT_FILE_ORDER = [
  'README.md',
  'package.json',
  'src/main.tsx',
  'src/App.tsx',
  'index.html',
  'vite.config.ts',
]

function chooseDefaultFile(paths: string[]): string | null {
  const normalized = new Map<string, string>()
  for (const path of paths) {
    normalized.set(normalizePath(path).toLowerCase(), path)
  }
  for (const preferred of DEFAULT_FILE_ORDER) {
    const match = normalized.get(preferred.toLowerCase())
    if (match) return match
  }
  return paths[0] ?? null
}

export function CodeView({ fileTree, onReadFile, onReadFiles }: CodeViewProps) {
  const [selectedPath, setSelectedPath] = useState<string>(DEFAULT_FILE)
  const [fileContent, setFileContent] = useState<FileContent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [contentCache, setContentCache] = useState<Record<string, FileContent>>(
    {},
  )

  const pathTypeMap = useMemo(() => {
    const map = new Map<string, FileTreeNode['type']>()
    buildPathTypeMap(fileTree, map)
    return map
  }, [fileTree])

  const resolvedSelectedPath = useMemo(() => {
    if (!fileTree.length) return normalizePath(selectedPath)
    if (selectedPath && selectedPath !== DEFAULT_FILE) {
      return normalizePath(selectedPath)
    }
    const allFiles: string[] = []
    collectFilePaths(fileTree, allFiles)
    const defaultFile = chooseDefaultFile(allFiles)
    return normalizePath(defaultFile ?? selectedPath)
  }, [fileTree, selectedPath])

  const loadFile = async (path: string, normalizedPath?: string) => {
    if (normalizedPath && contentCache[normalizedPath]) {
      setFileContent(contentCache[normalizedPath])
      setSelectedPath(normalizedPath)
      return
    }
    setIsLoading(true)
    try {
      const result = await onReadFile(path)
      if (normalizedPath) {
        setContentCache((prev) => ({ ...prev, [normalizedPath]: result }))
      }
      setFileContent(result)
      if (normalizedPath) {
        setSelectedPath(normalizedPath)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (path: string) => {
    if (pathTypeMap.get(path) === 'dir') return
    const absolutePath = `/home/user/project/${path}`
    void loadFile(absolutePath, path)
  }

  useEffect(() => {
    if (!fileTree.length) return
    if (fileContent) return
    const allFiles: string[] = []
    collectFilePaths(fileTree, allFiles)
    const defaultFile = chooseDefaultFile(allFiles)
    if (defaultFile) {
      const normalized = normalizePath(defaultFile)
      void loadFile(defaultFile, normalized)
    }
  }, [fileTree, fileContent])

  useEffect(() => {
    if (!fileTree.length || !onReadFiles) return
    const allFiles: string[] = []
    collectFilePaths(fileTree, allFiles)
    const normalized = allFiles.map(normalizePath)

    const isUiFile = (path: string) =>
      path.startsWith('src/components/ui/') || path === 'src/components/ui'

    const stage1Set = new Set([
      ...DEFAULT_FILE_ORDER,
      ...normalized.filter(
        (path) => !path.includes('/') || path === 'README.md',
      ),
    ])

    const stage2Set = new Set(
      normalized.filter(
        (path) =>
          path.startsWith('src/') &&
          path.split('/').length <= 3 &&
          !isUiFile(path),
      ),
    )

    const stage3Set = new Set(
      normalized.filter(
        (path) =>
          !isUiFile(path) && !stage1Set.has(path) && !stage2Set.has(path),
      ),
    )

    const toAbs = (path: string) => `/home/user/project/${path}`

    const mergeResults = (result?: {
      files: Record<string, string>
      truncated: Record<string, boolean>
    }) => {
      if (!result) return
      setContentCache((prev) => {
        const next = { ...prev }
        for (const [path, content] of Object.entries(result.files)) {
          const normalizedPath = normalizePath(path)
          if (!normalizedPath) continue
          next[normalizedPath] = {
            content,
            truncated: result.truncated[path] ?? false,
          }
        }
        return next
      })
    }

    void onReadFiles(Array.from(stage1Set).map(toAbs))
      .then((result) => {
        mergeResults(result)
        return onReadFiles(Array.from(stage2Set).map(toAbs))
      })
      .then((result) => {
        mergeResults(result)
        return onReadFiles(Array.from(stage3Set).map(toAbs))
      })
      .then((result) => {
        mergeResults(result)
      })
      .catch(() => undefined)
  }, [fileTree, onReadFiles])

  const filename =
    normalizePath(resolvedSelectedPath).split('/').pop() ||
    normalizePath(resolvedSelectedPath)
  const language = getLanguage(resolvedSelectedPath)

  const fileList = useMemo(() => {
    const allFiles: string[] = []
    collectFilePaths(fileTree, allFiles)
    return allFiles.map(normalizePath)
  }, [fileTree])

  if (!fileList.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No files found
      </div>
    )
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      <FileTree
        files={fileList}
        selectedFile={resolvedSelectedPath}
        onSelectFile={handleSelect}
      />

      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {isLoading && !fileContent ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading file...
          </div>
        ) : fileContent ? (
          <CodeBlock
            key={resolvedSelectedPath}
            data={[
              {
                language,
                filename: resolvedSelectedPath,
                code: fileContent.content,
              },
            ]}
            value={resolvedSelectedPath}
            className={cn(
              'h-full rounded-none border-0 bg-background flex flex-col',
            )}
          >
            <CodeBlockHeader className="px-4 py-2 bg-secondary/50">
              <div className="flex items-center gap-2 flex-1">
                <CodeBlockFilename value={resolvedSelectedPath}>
                  {filename}
                </CodeBlockFilename>
              </div>
              <CodeBlockCopyButton className="size-8" />
            </CodeBlockHeader>

            <div className="flex-1 overflow-auto">
              <CodeBlockBody>
                {() => (
                  <CodeBlockItem
                    value={resolvedSelectedPath}
                    lineNumbers
                    className="relative"
                  >
                    <CodeBlockContent language={language}>
                      {fileContent.content}
                    </CodeBlockContent>
                  </CodeBlockItem>
                )}
              </CodeBlockBody>
            </div>
          </CodeBlock>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a file to view its contents
          </div>
        )}
      </div>
    </div>
  )
}
