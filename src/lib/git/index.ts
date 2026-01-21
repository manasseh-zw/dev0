import { GitHubProvider } from './github'
import {
  generateReadme,
  generateTasklist,
  getInitialLearningsTemplate,
  getTechStackRules,
} from './content-generators'
import { generateRepoName } from './utils'
import type { TechStack } from '@/lib/templates'
import type { Task } from '@/lib/types'

export type CreateProjectRepositoryOptions = {
  projectName: string
  description: string
  context: string
  techStack: TechStack
  tasks: Task[]
  readmeContent?: string
}

export type ProjectRepositoryResult = {
  repoName: string
  repoUrl: string
  cloneUrl: string
}

export async function createProjectRepository(
  options: CreateProjectRepositoryOptions,
): Promise<ProjectRepositoryResult> {
  const { projectName, description, context, techStack, tasks } = options

  const github = new GitHubProvider()

  const repoName = generateRepoName(projectName)

  const repo = await github.createFromTemplate({
    templateName: techStack,
    repoName,
    description,
    isPrivate: false,
  })

  const readmeContent =
    options.readmeContent ??
    generateReadme({
      name: projectName,
      description,
      context,
      techStack,
    })

  const tasklistContent = generateTasklist(tasks)
  const learningsContent = getInitialLearningsTemplate()
  const rulesContent = getTechStackRules(techStack)

  await github.createInitialFiles({
    repoName,
    files: [
      { path: 'README.md', content: readmeContent },
      { path: 'TASKLIST.md', content: tasklistContent },
      { path: 'LEARNINGS.md', content: learningsContent },
      { path: '.dev0/RULES.md', content: rulesContent },
    ],
    commitMessage: 'feat: initialize project with dev0 context files',
  })

  return {
    repoName: repo.name,
    repoUrl: repo.htmlUrl,
    cloneUrl: repo.cloneUrl,
  }
}

export async function updateTasklist(
  repoName: string,
  tasks: Task[],
): Promise<void> {
  const github = new GitHubProvider()

  const tasklistContent = generateTasklist(tasks)

  await github.uploadFile({
    repoName,
    path: 'TASKLIST.md',
    content: tasklistContent,
    message: 'chore: update task list',
  })
}
