import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { projects, tasks } from '@/lib/db/schema'
import { GitHubProvider } from '@/lib/git/github'
import { env } from '@/lib/env'
import {
  getMockPRDetails,
  getMockPRFiles,
  getMockProject,
  hasMockPRDetails,
  hasMockPRFiles,
  isMockProjectId,
} from '@/data/mock'
import type {
  ReviewPRComment,
  ReviewPRFile,
  ReviewPRListItem,
  ReviewPRSummary,
} from '@/lib/types/review'

type PullRequestRef = {
  owner: string
  repoName: string
  prNumber: number
}

type PullRequestContext = {
  ref: PullRequestRef
  baseRef: string
  baseSha: string
  headSha: string
}

function parsePullRequestUrl(prUrl: string): PullRequestRef | null {
  const match = prUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/)
  if (!match) return null
  const [, owner, repoName, prNumber] = match
  return { owner, repoName, prNumber: Number(prNumber) }
}

async function resolvePullRequestContext(
  task: typeof tasks.$inferSelect,
  repoName: string | null,
): Promise<PullRequestContext | null> {
  let ref: PullRequestRef | null = null
  if (task.prUrl) {
    ref = parsePullRequestUrl(task.prUrl)
  }

  if (!ref && repoName && task.prNumber) {
    ref = {
      owner: env.GITHUB_BOT_USERNAME,
      repoName,
      prNumber: task.prNumber,
    }
  }

  if (!ref) return null

  const github = new GitHubProvider()
  const prResponse = await github.getPullRequest({
    owner: ref.owner,
    repoName: ref.repoName,
    prNumber: ref.prNumber,
  })

  const pr = prResponse.data
  const baseRef = pr.base?.ref ?? 'master'
  const baseSha = pr.base?.sha ?? ''
  const headSha = pr.head?.sha ?? ''

  if (!baseSha || !headSha) return null

  return { ref, baseRef, baseSha, headSha }
}

function mapMockDetailsToSummary(
  taskId: string,
  mock: ReturnType<typeof getMockPRDetails>,
): ReviewPRSummary | null {
  if (!mock) return null

  return {
    taskId,
    prNumber: mock.prNumber,
    title: mock.title,
    body: mock.body,
    state: mock.state,
    createdAt: mock.createdAt,
    updatedAt: mock.updatedAt,
    headBranch: mock.headBranch,
    baseBranch: mock.baseBranch,
    additions: mock.additions,
    deletions: mock.deletions,
    changedFiles: mock.changedFiles,
    commits: mock.commits,
    comments: mock.comments,
  }
}

function mapCommentAuthorType(author: string) {
  return author === env.GITHUB_BOT_USERNAME ? 'agent' : 'user'
}

function mapComments(
  comments: Array<{
    id: number | string
    body?: string | null
    user?: { login?: string | null } | null
    created_at?: string | null
  }>,
): ReviewPRComment[] {
  return comments
    .filter((comment) => Boolean(comment.body))
    .map((comment) => {
      const author = comment.user?.login ?? 'unknown'
      return {
        id: String(comment.id),
        author,
        authorType: mapCommentAuthorType(author),
        body: comment.body ?? '',
        createdAt: comment.created_at ?? new Date().toISOString(),
      }
    })
}

function normalizePrState(pr: { state?: string; merged?: boolean }) {
  if (pr.merged) return 'merged'
  if (pr.state === 'closed') return 'closed'
  return 'open'
}

export const getReviewPRSummary = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      projectId: z.string(),
      taskId: z.string(),
    }),
  )
  .handler(async ({ data }): Promise<ReviewPRSummary | null> => {
    if (isMockProjectId(data.projectId)) {
      const mock = getMockPRDetails(data.taskId)
      return mapMockDetailsToSummary(data.taskId, mock)
    }

    const [row] = await db
      .select({
        task: tasks,
        project: projects,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(eq(tasks.id, data.taskId), eq(tasks.projectId, data.projectId)),
      )
      .limit(1)

    if (!row) {
      throw new Error('Task not found')
    }

    const prContext = await resolvePullRequestContext(
      row.task,
      row.project?.repoName ?? null,
    )
    if (!prContext) {
      return null
    }

    const github = new GitHubProvider()
    const prResponse = await github.getPullRequest({
      owner: prContext.ref.owner,
      repoName: prContext.ref.repoName,
      prNumber: prContext.ref.prNumber,
    })
    const commentsResponse = await github.listPullRequestComments({
      owner: prContext.ref.owner,
      repoName: prContext.ref.repoName,
      prNumber: prContext.ref.prNumber,
    })

    const pr = prResponse.data
    const comments = [
      ...mapComments(commentsResponse.issueComments),
      ...mapComments(commentsResponse.reviewComments),
    ].sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    return {
      taskId: row.task.id,
      prNumber: pr.number,
      title: pr.title ?? `PR #${pr.number}`,
      body: pr.body ?? null,
      state: normalizePrState({ state: pr.state, merged: pr.merged }),
      createdAt: pr.created_at ?? new Date().toISOString(),
      updatedAt: pr.updated_at ?? new Date().toISOString(),
      headBranch: pr.head?.ref ?? 'unknown',
      baseBranch: pr.base?.ref ?? 'unknown',
      additions: pr.additions ?? 0,
      deletions: pr.deletions ?? 0,
      changedFiles: pr.changed_files ?? 0,
      commits: pr.commits ?? 0,
      comments,
    }
  })

export const getReviewPRList = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      projectId: z.string(),
    }),
  )
  .handler(async ({ data }): Promise<ReviewPRListItem[]> => {
    if (isMockProjectId(data.projectId)) {
      const mockProject = getMockProject()
      return mockProject.tasks
        .filter((task) => hasMockPRDetails(task.id))
        .map((task) => {
          const prDetails = getMockPRDetails(task.id)
          return {
            taskId: task.id,
            taskTitle: task.title,
            taskStatus: task.status,
            taskPhase: task.phase,
            taskCreatedAt: new Date(task.createdAt).toISOString(),
            geminiModel: task.geminiModel,
            prNumber: prDetails?.prNumber ?? task.prNumber ?? 0,
            prUrl: task.prUrl ?? '',
            prTitle: prDetails?.title ?? null,
            prState: prDetails?.state ?? 'open',
            prUpdatedAt: prDetails?.updatedAt ?? null,
          }
        })
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, data.projectId))
      .limit(1)

    if (!project) {
      throw new Error('Project not found')
    }

    const projectTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, data.projectId))
      .orderBy(asc(tasks.phase), asc(tasks.order))

    const tasksWithPrs = projectTasks.filter(
      (task) => task.prUrl || task.prNumber,
    )

    if (tasksWithPrs.length === 0) {
      return []
    }

    const github = new GitHubProvider()
    const listItems: ReviewPRListItem[] = []

    if (project.repoName) {
      const prList = await github.listPullRequests({
        repoName: project.repoName,
        state: 'all',
        perPage: 100,
      })
      const prMap = new Map(prList.data.map((pr) => [pr.number, pr]))

      tasksWithPrs.forEach((task) => {
        const prNumber =
          task.prNumber ?? parsePullRequestUrl(task.prUrl ?? '')?.prNumber
        if (!prNumber) return
        const pr = prMap.get(prNumber)
        if (!pr) return

        const merged = 'merged_at' in pr ? Boolean(pr.merged_at) : false

        listItems.push({
          taskId: task.id,
          taskTitle: task.title,
          taskStatus: task.status,
          taskPhase: task.phase,
          taskCreatedAt: new Date(task.createdAt).toISOString(),
          geminiModel: task.geminiModel,
          prNumber,
          prUrl: task.prUrl ?? pr.html_url ?? '',
          prTitle: pr.title ?? null,
          prState: normalizePrState({ state: pr.state, merged }),
          prUpdatedAt: pr.updated_at ?? null,
        })
      })

      return listItems
    }

    for (const task of tasksWithPrs) {
      const prContext = await resolvePullRequestContext(task, project.repoName)
      if (!prContext) continue

      const prResponse = await github.getPullRequest({
        owner: prContext.ref.owner,
        repoName: prContext.ref.repoName,
        prNumber: prContext.ref.prNumber,
      })
      const pr = prResponse.data

      listItems.push({
        taskId: task.id,
        taskTitle: task.title,
        taskStatus: task.status,
        taskPhase: task.phase,
        taskCreatedAt: new Date(task.createdAt).toISOString(),
        geminiModel: task.geminiModel,
        prNumber: pr.number,
        prUrl: task.prUrl ?? pr.html_url ?? '',
        prTitle: pr.title ?? null,
        prState: normalizePrState({ state: pr.state, merged: pr.merged }),
        prUpdatedAt: pr.updated_at ?? null,
      })
    }

    return listItems
  })

export const getReviewPRFiles = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      projectId: z.string(),
      taskId: z.string(),
    }),
  )
  .handler(async ({ data }): Promise<ReviewPRFile[]> => {
    // Handle mock data
    if (isMockProjectId(data.projectId)) {
      if (hasMockPRFiles(data.taskId)) {
        return getMockPRFiles(data.taskId)
      }
      return []
    }

    const [row] = await db
      .select({
        task: tasks,
        project: projects,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(eq(tasks.id, data.taskId), eq(tasks.projectId, data.projectId)),
      )
      .limit(1)

    if (!row) {
      throw new Error('Task not found')
    }

    const prContext = await resolvePullRequestContext(
      row.task,
      row.project?.repoName ?? null,
    )
    if (!prContext) {
      return []
    }

    const github = new GitHubProvider()
    const compareResponse = await github.compareCommits({
      owner: prContext.ref.owner,
      repoName: prContext.ref.repoName,
      base: prContext.baseSha,
      head: prContext.headSha,
    })

    return (
      compareResponse.data.files?.map((file) => ({
        filename: file.filename,
        status: file.status as ReviewPRFile['status'],
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        sha: file.sha ?? '',
        patch: file.patch ?? null,
        previousFilename: file.previous_filename ?? null,
      })) ?? []
    )
  })

export const mergePullRequest = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      projectId: z.string(),
      taskId: z.string(),
    }),
  )
  .handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
    // Mock data - simulate merge
    if (isMockProjectId(data.projectId)) {
      return {
        success: true,
        message: 'Pull request merged successfully (mock)',
      }
    }

    const [row] = await db
      .select({
        task: tasks,
        project: projects,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(eq(tasks.id, data.taskId), eq(tasks.projectId, data.projectId)),
      )
      .limit(1)

    if (!row) {
      throw new Error('Task not found')
    }

    const prContext = await resolvePullRequestContext(
      row.task,
      row.project?.repoName ?? null,
    )
    if (!prContext) {
      throw new Error('Pull request reference not found')
    }

    const github = new GitHubProvider()

    try {
      await github.mergePullRequest({
        repoName: prContext.ref.repoName,
        prNumber: prContext.ref.prNumber,
        mergeMethod: 'squash',
      })

      // Update task status to DONE
      await db
        .update(tasks)
        .set({ status: 'DONE' })
        .where(eq(tasks.id, data.taskId))

      return { success: true, message: 'Pull request merged successfully' }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to merge pull request'
      return { success: false, message }
    }
  })
