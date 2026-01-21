/**
 * Generate a short unique ID for repository names
 * Uses base36 encoding for shorter IDs (0-9, a-z)
 */
export function generateShortId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 6)

  return `${timestamp}${randomPart}`.substring(0, 8)
}

/**
 * Generate a repository name from project name and short ID
 * Sanitizes the project name to be GitHub-compatible
 */
export function generateRepoName(projectName: string): string {
  const sanitized = projectName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)

  const shortId = generateShortId()

  return `${sanitized}-${shortId}`
}

/**
 * Validate repository name meets GitHub requirements
 */
export function isValidRepoName(name: string): boolean {
  // GitHub repo name rules:
  // - Can contain alphanumeric characters and hyphens
  // - Cannot start with a hyphen
  // - Maximum 100 characters
  const regex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,99}$/
  return regex.test(name)
}
