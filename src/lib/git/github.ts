import { Octokit } from 'octokit'
import { env } from '@/lib/env'
import type { TechStack } from '@/lib/templates'

type CreateRepoFromTemplateOptions = {
  templateName: TechStack
  repoName: string
  description?: string
  isPrivate?: boolean
}

type CreateInitialFilesOptions = {
  repoName: string
  files: Array<{
    path: string
    content: string
  }>
  commitMessage?: string
}

type UploadFileOptions = {
  repoName: string
  path: string
  content: string
  message: string
  branch?: string
}

type CreatePullRequestOptions = {
  repoName: string
  title: string
  body: string
  head: string
  base?: string
}

type MergePullRequestOptions = {
  repoName: string
  prNumber: number
  mergeMethod?: 'merge' | 'squash' | 'rebase'
}

type RepoInfo = {
  name: string
  fullName: string
  htmlUrl: string
  cloneUrl: string
  defaultBranch: string
}

type PullRequestInfo = {
  number: number
  htmlUrl: string
  state: string
}


export class GitHubProvider {
  private octokit: Octokit
  private owner: string

  constructor() {
    this.octokit = new Octokit({
      auth: env.GITHUB_TOKEN,
    })
    this.owner = env.GITHUB_BOT_USERNAME
  }


  async createFromTemplate(
    options: CreateRepoFromTemplateOptions,
  ): Promise<RepoInfo> {
    const { templateName, repoName, description, isPrivate = false } = options

    const templateRepoName = this.getTemplateRepoName(templateName)

    try {
      const response = await this.octokit.rest.repos.createUsingTemplate({
        template_owner: this.owner,
        template_repo: templateRepoName,
        owner: this.owner,
        name: repoName,
        description,
        private: isPrivate,
        include_all_branches: false,
      })

      return {
        name: response.data.name,
        fullName: response.data.full_name,
        htmlUrl: response.data.html_url,
        cloneUrl: response.data.clone_url,
        defaultBranch: response.data.default_branch,
      }
    } catch (error) {
      throw new Error(
        `Failed to create repository from template: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

 
  async createInitialFiles(
    options: CreateInitialFilesOptions,
  ): Promise<void> {
    const { repoName, files, commitMessage = 'Initialize project files' } =
      options

    try {
      const { data: repo } = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: repoName,
      })

      const branchesToTry = [
        repo.default_branch,
        'master',
        'main',
      ].filter((b): b is string => Boolean(b))

      let defaultBranch: string | undefined
      let baseSha: string | undefined
      let baseTreeSha: string | undefined

      for (const branch of branchesToTry) {
        try {
          const { data: ref } = await this.octokit.rest.git.getRef({
            owner: this.owner,
            repo: repoName,
            ref: `heads/${branch}`,
          })

          baseSha = ref.object.sha

          const { data: baseCommit } = await this.octokit.rest.git.getCommit({
            owner: this.owner,
            repo: repoName,
            commit_sha: baseSha,
          })

          baseTreeSha = baseCommit.tree.sha
          defaultBranch = branch
          break
        } catch {
          continue
        }
      }

      if (!defaultBranch) {
        defaultBranch = 'master'
      }


      // Create file tree items
      const treeItems = files.map((file) => ({
        path: file.path,
        mode: '100644' as const,
        type: 'blob' as const,
        content: file.content,
      }))

      // Create the new tree (with or without base tree)
      const { data: newTree } = await this.octokit.rest.git.createTree({
        owner: this.owner,
        repo: repoName,
        tree: treeItems,
        ...(baseTreeSha && { base_tree: baseTreeSha }),
      })

      // Create the commit (with or without parent)
      const { data: newCommit } = await this.octokit.rest.git.createCommit({
        owner: this.owner,
        repo: repoName,
        message: commitMessage,
        tree: newTree.sha,
        ...(baseSha && { parents: [baseSha] }),
      })

      // Create or update the reference
      if (baseSha) {
        // Update existing ref
        await this.octokit.rest.git.updateRef({
          owner: this.owner,
          repo: repoName,
          ref: `heads/${defaultBranch}`,
          sha: newCommit.sha,
        })
      } else {
        // Create new ref (first commit)
        await this.octokit.rest.git.createRef({
          owner: this.owner,
          repo: repoName,
          ref: `refs/heads/${defaultBranch}`,
          sha: newCommit.sha,
        })
      }
    } catch (error) {
      throw new Error(
        `Failed to create initial files: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Upload or update a single file in a repository
   */
  async uploadFile(options: UploadFileOptions): Promise<void> {
    const { repoName, path, content, message, branch = 'master' } = options

    try {
      let sha: string | undefined

      try {
        const { data: existingFile } =
          await this.octokit.rest.repos.getContent({
            owner: this.owner,
            repo: repoName,
            path,
            ref: branch,
          })

        if ('sha' in existingFile) {
          sha = existingFile.sha
        }
      } catch {
        // File doesn't exist, that's fine
      }

      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: repoName,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        branch,
        ...(sha && { sha }),
      })
    } catch (error) {
      throw new Error(
        `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Create a pull request
   */
  async createPullRequest(
    options: CreatePullRequestOptions,
  ): Promise<PullRequestInfo> {
    const { repoName, title, body, head, base = 'master' } = options

    try {
      const { data: pr } = await this.octokit.rest.pulls.create({
        owner: this.owner,
        repo: repoName,
        title,
        body,
        head,
        base,
      })

      return {
        number: pr.number,
        htmlUrl: pr.html_url,
        state: pr.state,
      }
    } catch (error) {
      throw new Error(
        `Failed to create pull request: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Merge a pull request
   */
  async mergePullRequest(options: MergePullRequestOptions): Promise<void> {
    const { repoName, prNumber, mergeMethod = 'squash' } = options

    try {
      await this.octokit.rest.pulls.merge({
        owner: this.owner,
        repo: repoName,
        pull_number: prNumber,
        merge_method: mergeMethod,
      })
    } catch (error) {
      throw new Error(
        `Failed to merge pull request: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Get repository information
   */
  async getRepository(repoName: string): Promise<RepoInfo> {
    try {
      const { data: repo } = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: repoName,
      })

      return {
        name: repo.name,
        fullName: repo.full_name,
        htmlUrl: repo.html_url,
        cloneUrl: repo.clone_url,
        defaultBranch: repo.default_branch,
      }
    } catch (error) {
      throw new Error(
        `Failed to get repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Map TechStack to template repository name
   */
  private getTemplateRepoName(techStack: TechStack): string {
    const templateMap: Record<TechStack, string> = {
      'tanstack-start': 'tanstack-template',
      'react-vite': 'react-vite-template',
      nextjs: 'nextjs-template',
    }

    return templateMap[techStack]
  }
}
