import { describe, test, expect } from 'vitest'
import { GitHubProvider } from '@/lib/git/github'
import { generateRepoName } from '@/lib/git/utils'

describe('GitHub Provider (Live)', () => {
  test('generateRepoName produces a safe slug', () => {
    const repoName = generateRepoName('My Awesome Project')
    expect(repoName).toBeTruthy()
    expect(repoName).toMatch(/^[a-z0-9-]+$/)
  })

  test('can access template repositories', async () => {
    const github = new GitHubProvider()
    const templates = [
      'tanstack-template',
      'react-vite-template',
      'nextjs-template',
    ]

    for (const template of templates) {
      const repo = await github.getRepository(template)
      expect(repo.htmlUrl).toContain(`/${template}`)
    }
  }, 60_000)
})
