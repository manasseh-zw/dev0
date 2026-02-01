/**
 * End-to-end sandbox test:
 * - Create Daytona sandbox from snapshot
 * - Clone target repo
 * - Run Gemini CLI to implement a feature
 * - Create a PR via gh
 *
 * Usage:
 *   bun run scripts/test-gemini-sandbox.ts
 */

import { Daytona } from '@daytonaio/sdk'
import { config } from 'dotenv'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { randomUUID } from 'crypto'

const envPath = resolve(process.cwd(), '.env.local')
if (!existsSync(envPath)) {
  console.warn(`⚠️  .env.local not found at ${envPath}`)
}
config({ path: envPath })

const SNAPSHOT_NAME = 'dev0-universal'
const WORKSPACE_DIR = '/home/daytona/workspace/project'

const DAYTONA_API_KEY = process.env.DAYTONA_API_KEY
const DAYTONA_API_URL = process.env.DAYTONA_API_URL
const AGENT_GEMINI_API_KEY = process.env.AGENT_GEMINI_API_KEY
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GEMINI_DEBUG = process.env.GEMINI_DEBUG
const GEMINI_FLAGS = process.env.GEMINI_FLAGS
const GEMINI_OUTPUT = process.env.GEMINI_OUTPUT ?? 'stream-json'

const REPO_URL =
  process.env.TEST_REPO_URL ??
  'https://github.com/dev0-agent/scholarspend-ml2kz1df'
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3-pro-preview'

const FEATURE_PROMPT = `⏳ Create Application Layout Shell
Build the main App Layout component including a responsive Header/Navbar and a main content container.
Implement basic routing if necessary (Dashboard vs History view), or use a simple conditional render for this MVP.`

function requireEnv(name: string, value?: string) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function escapeForDoubleQuotes(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`')
}

async function runCommand(
  sandbox: any,
  command: string,
  options?: { cwd?: string; timeoutMs?: number },
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const fullCommand = options?.cwd ? `cd ${options.cwd} && ${command}` : command
  const sessionId = `exec-${randomUUID()}`
  await sandbox.process.createSession(sessionId)

  try {
    const response = await sandbox.process.executeSessionCommand(
      sessionId,
      { command: fullCommand, runAsync: true },
      options?.timeoutMs ?? 600000,
    )
    const cmdId = response?.cmdId ?? response?.cmd_id
    if (!cmdId) {
      throw new Error('Failed to start session command')
    }

    let stdout = ''
    let stderr = ''

    await sandbox.process.getSessionCommandLogs(
      sessionId,
      cmdId,
      (chunk: string) => {
        stdout += chunk
        process.stdout.write(chunk)
      },
      (chunk: string) => {
        stderr += chunk
        process.stderr.write(chunk)
      },
    )

    const commandInfo = await sandbox.process.getSessionCommand(
      sessionId,
      cmdId,
    )
    const exitCode =
      (commandInfo as { exitCode?: number }).exitCode ??
      (commandInfo as { exit_code?: number }).exit_code

    if (typeof exitCode !== 'number') {
      throw new Error('Failed to retrieve session command exit code')
    }

    return { exitCode, stdout, stderr }
  } finally {
    await sandbox.process.deleteSession(sessionId).catch(() => undefined)
  }
}

function reportEnv(keys: string[]) {
  const present = keys.filter((key) => Boolean(process.env[key]))
  const missing = keys.filter((key) => !process.env[key])
  console.log(
    `Env check: present=${present.join(', ') || 'none'} missing=${missing.join(', ') || 'none'}`,
  )
}

async function main() {
  reportEnv([
    'DAYTONA_API_KEY',
    'DAYTONA_API_URL',
    'AGENT_GEMINI_API_KEY',
    'GITHUB_TOKEN',
    'GEMINI_DEBUG',
    'GEMINI_FLAGS',
    'GEMINI_OUTPUT',
  ])
  requireEnv('DAYTONA_API_KEY', DAYTONA_API_KEY)
  requireEnv('DAYTONA_API_URL', DAYTONA_API_URL)
  requireEnv('AGENT_GEMINI_API_KEY', AGENT_GEMINI_API_KEY)
  requireEnv('GITHUB_TOKEN', GITHUB_TOKEN)

  const daytona = new Daytona()
  const sandbox = await daytona.create({
    snapshot: SNAPSHOT_NAME,
    envVars: {
      GH_TOKEN: GITHUB_TOKEN!,
      GITHUB_TOKEN: GITHUB_TOKEN!,
      GEMINI_API_KEY: AGENT_GEMINI_API_KEY!,
      AGENT_GEMINI_API_KEY: AGENT_GEMINI_API_KEY!,
      ...(GEMINI_DEBUG ? { GEMINI_DEBUG } : {}),
    },
  })

  try {
    await runCommand(
      sandbox,
      `git clone "${REPO_URL}" ${WORKSPACE_DIR} && cd ${WORKSPACE_DIR}`,
    )

    await runCommand(
      sandbox,
      `git config user.email "dev0-agent@users.noreply.github.com" && git config user.name "dev0-agent"`,
      { cwd: WORKSPACE_DIR },
    )

    const prompt = `${FEATURE_PROMPT}

Repo: ${REPO_URL}

Please:
- Create a new branch named "dev0/layout-shell".
- Implement the feature in the repo.
- Run relevant checks if needed.
- Commit changes with a concise message.
- Push the branch and open a PR using "gh pr create".
- Include the PR URL in the final output.`

    const geminiCmd = [
      'gemini',
      '--yolo',
      `--model ${GEMINI_MODEL}`,
      GEMINI_DEBUG ? '--debug' : '',
      GEMINI_FLAGS ?? '',
      GEMINI_OUTPUT === 'stream-json' ? '--output-format stream-json' : '',
      `-p "${escapeForDoubleQuotes(prompt)}"`,
    ]
      .filter(Boolean)
      .join(' ')

    const result = await runCommand(sandbox, geminiCmd, {
      cwd: WORKSPACE_DIR,
      timeoutMs: 900000,
    })

    if (result.exitCode !== 0) {
      throw new Error(`Gemini CLI failed (exit ${result.exitCode})`)
    }
  } finally {
    await daytona.delete(sandbox).catch(() => undefined)
  }
}

main().catch((error) => {
  console.error(
    `\n❌ Sandbox test failed: ${error instanceof Error ? error.message : error}`,
  )
  process.exit(1)
})
