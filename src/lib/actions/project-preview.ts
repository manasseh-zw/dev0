import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { isMockProjectId } from '@/data/mock'
import {
  getOrCreateProjectSandbox,
  getPreviewUrl,
  listFiles,
  readFile,
  startDevServer,
} from '@/lib/sandbox/provider'

const previewStartSchema = z.object({
  projectId: z.string(),
})

const previewFileTreeSchema = z.object({
  projectId: z.string(),
  root: z.string().optional(),
  depth: z.number().int().min(1).max(6).optional(),
})

const previewReadFileSchema = z.object({
  projectId: z.string(),
  path: z.string(),
})

const previewReadFilesSchema = z.object({
  projectId: z.string(),
  paths: z.array(z.string()).min(1),
})

type FileTreeNode = {
  name: string
  path: string
  type: 'file' | 'dir'
  size?: number
  children?: FileTreeNode[]
}

const IGNORE_NAMES = new Set([
  '.git',
  'node_modules',
  '.next',
  'dist',
  '.dev0',
  '.turbo',
  '.cache',
  '.gemini',
  'bun.lock',
  'bun.lockb',
])

const PROJECT_ROOT = '/home/user/project'

function buildFileTree(
  entries: {
    name: string
    path: string
    type: 'file' | 'dir'
    size?: number
  }[],
  rootPath: string,
): FileTreeNode[] {
  const root: FileTreeNode = {
    name: '',
    path: rootPath,
    type: 'dir',
    children: [],
  }

  const nodeByPath = new Map<string, FileTreeNode>([[rootPath, root]])

  const sorted = [...entries].sort((a, b) => a.path.localeCompare(b.path))

  for (const entry of sorted) {
    if (!entry.path.startsWith(rootPath)) continue
    const trimmed = entry.path.slice(rootPath.length).replace(/^\//, '')
    if (!trimmed) continue
    const segments = trimmed.split('/').filter(Boolean)
    if (segments.some((segment) => IGNORE_NAMES.has(segment))) {
      continue
    }
    let currentPath = rootPath
    let parent = root

    for (let i = 0; i < segments.length; i += 1) {
      const segment = segments[i]
      if (IGNORE_NAMES.has(segment)) {
        parent = root
        break
      }
      currentPath = `${currentPath}/${segment}`
      let node = nodeByPath.get(currentPath)

      if (!node) {
        const isLeaf = i === segments.length - 1
        const type = isLeaf ? entry.type : 'dir'
        node = {
          name: segment,
          path: currentPath,
          type,
          size: isLeaf ? entry.size : undefined,
          children: type === 'dir' ? [] : undefined,
        }
        nodeByPath.set(currentPath, node)
        parent.children?.push(node)
      }

      if (node.type === 'dir') {
        parent = node
      }
    }
  }

  const sortTree = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    for (const node of nodes) {
      if (node.children) sortTree(node.children)
    }
  }

  if (root.children) {
    sortTree(root.children)
  }

  return root.children ?? []
}

function sanitizePath(path: string): string {
  const cleaned = path.replace(/\0/g, '')
  if (cleaned.startsWith('$HOME/project')) {
    return cleaned.replace('$HOME/project', PROJECT_ROOT)
  }
  return cleaned
}

const TEXT_EXTENSIONS = new Set([
  'ts',
  'tsx',
  'js',
  'jsx',
  'json',
  'md',
  'css',
  'scss',
  'html',
  'svg',
  'yml',
  'yaml',
  'env',
  'txt',
  'sh',
  'toml',
  'lock',
  'config',
  'sql',
])

const MAX_FILE_BYTES = 200_000

function isTextFile(path: string): boolean {
  const name = path.split('/').pop() ?? ''
  const parts = name.split('.')
  if (parts.length <= 1) return true
  const ext = parts.pop() ?? ''
  return TEXT_EXTENSIONS.has(ext.toLowerCase())
}

export const startProjectPreview = createServerFn({ method: 'POST' })
  .inputValidator(previewStartSchema)
  .handler(async ({ data }) => {
    if (isMockProjectId(data.projectId)) {
      return {
        sandboxId: 'mock',
        previewUrl: 'https://ui.shadcn.com/',
      }
    }

    const sandbox = await getOrCreateProjectSandbox(data.projectId)
    await startDevServer(sandbox.id, 'bun run dev')
    const previewUrl = await getPreviewUrl(sandbox.id, 3000)

    return {
      sandboxId: sandbox.id,
      previewUrl,
    }
  })

export const getProjectFileTree = createServerFn({ method: 'GET' })
  .inputValidator(previewFileTreeSchema)
  .handler(async ({ data }) => {
    if (isMockProjectId(data.projectId)) {
      return [] as FileTreeNode[]
    }

    const sandbox = await getOrCreateProjectSandbox(data.projectId)
    const rootPath = data.root ?? PROJECT_ROOT
    const depth = data.depth ?? 4
    const entries = await listFiles(sandbox.id, rootPath, { depth })
    const filtered = entries.filter((entry) => !IGNORE_NAMES.has(entry.name))

    return buildFileTree(filtered, rootPath)
  })

export const getProjectFileContent = createServerFn({ method: 'GET' })
  .inputValidator(previewReadFileSchema)
  .handler(async ({ data }) => {
    if (isMockProjectId(data.projectId)) {
      return { content: '', truncated: false }
    }

    const sandbox = await getOrCreateProjectSandbox(data.projectId)
    const safePath = sanitizePath(data.path)
    if (!safePath.startsWith(PROJECT_ROOT)) {
      throw new Error('Invalid path')
    }

    if (!isTextFile(safePath)) {
      return { content: '[binary file]', truncated: true }
    }

    const content = await readFile(sandbox.id, safePath)
    if (content.length > MAX_FILE_BYTES) {
      return {
        content: `${content.slice(0, MAX_FILE_BYTES)}\n\n[truncated]`,
        truncated: true,
      }
    }

    return { content, truncated: false }
  })

export const getProjectFileContents = createServerFn({ method: 'POST' })
  .inputValidator(previewReadFilesSchema)
  .handler(async ({ data }) => {
    if (isMockProjectId(data.projectId)) {
      return { files: {}, truncated: {} } as {
        files: Record<string, string>
        truncated: Record<string, boolean>
      }
    }

    const sandbox = await getOrCreateProjectSandbox(data.projectId)
    const results = await Promise.all(
      data.paths.map(async (path) => {
        const safePath = sanitizePath(path)
        if (!safePath.startsWith(PROJECT_ROOT)) {
          return { path, content: '', truncated: true }
        }

        if (!isTextFile(safePath)) {
          return { path, content: '[binary file]', truncated: true }
        }

        let content = await readFile(sandbox.id, safePath)
        if (content.length > MAX_FILE_BYTES) {
          return {
            path,
            content: `${content.slice(0, MAX_FILE_BYTES)}\n\n[truncated]`,
            truncated: true,
          }
        }

        if (safePath.endsWith('.svg')) {
          content = content.replace(/\r\n/g, '\n')
        }

        return { path, content, truncated: false }
      }),
    )

    const files: Record<string, string> = {}
    const truncated: Record<string, boolean> = {}
    for (const result of results) {
      files[result.path] = result.content
      truncated[result.path] = result.truncated
    }

    return { files, truncated }
  })

export type { FileTreeNode }
