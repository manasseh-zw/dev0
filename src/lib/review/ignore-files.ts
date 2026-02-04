export const DEFAULT_DIFF_IGNORE_PREFIXES = ['.dev0/']

export const DEFAULT_DIFF_IGNORE_EXACT = [
  'bun.lockb',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
]

export function shouldIgnoreDiffFile(filename: string): boolean {
  if (!filename) return false

  if (DEFAULT_DIFF_IGNORE_EXACT.includes(filename)) {
    return true
  }

  return DEFAULT_DIFF_IGNORE_PREFIXES.some((prefix) =>
    filename.startsWith(prefix),
  )
}
