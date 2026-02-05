/**
 * End-to-end sandbox test:
 * - Create E2B sandbox from template
 * - Clone target repo
 * - Run Gemini CLI to implement a feature
 * - Create a PR via gh
 *
 * Usage:
 *   bun run scripts/test-gemini-sandbox.ts
 */

import { CommandExitError, Sandbox } from 'e2b'
import { config } from 'dotenv'
import { existsSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env.local')
if (!existsSync(envPath)) {
  console.warn(`⚠️  .env.local not found at ${envPath}`)
}
config({ path: envPath })

const TEMPLATE_NAME = process.env.E2B_TEMPLATE ?? 'dev0-universal'
const WORKSPACE_DIR = '$HOME/project'
const HOME_DIR = '$HOME'

const E2B_API_KEY = process.env.E2B_API_KEY
const AGENT_GEMINI_API_KEY = process.env.AGENT_GEMINI_API_KEY
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GEMINI_DEBUG = process.env.GEMINI_DEBUG
const GEMINI_FLAGS = process.env.GEMINI_FLAGS
const GEMINI_OUTPUT = process.env.GEMINI_OUTPUT ?? 'stream-json'
const APP_URL = process.env.APP_URL ?? 'http://localhost:3000'
const DEV0_PROJECT_ID = process.env.DEV0_PROJECT_ID
const DEV0_TASK_ID = process.env.DEV0_TASK_ID
const SANDBOX_TEST_MODE = process.env.SANDBOX_TEST_MODE ?? ''

const REPO_URL =
  process.env.TEST_REPO_URL ??
  'https://github.com/dev0-agent/scholarspend-ml2kz1df'
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3-pro-preview'
const RUN_ID =
  process.env.DEV0_RUN_ID ??
  new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('Z')[0]
const RUN_DIR = `.dev0/runs/${RUN_ID}`
const BRANCH_NAME = process.env.DEV0_BRANCH_NAME ?? 'dev0/layout-shell'

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

function escapeForSingleQuotes(value: string): string {
  return value.replace(/'/g, `'"'"'`)
}

function buildGeminiCommand(args: string[]): string {
  const safeArgs = args.filter(Boolean).join(' ')
  return `gemini ${safeArgs}`
}

function wrapBash(command: string): string {
  return `bash -lc '${escapeForSingleQuotes(command)}'`
}

async function runCommand(
  sandbox: Sandbox,
  command: string,
  options?: {
    cwd?: string
    timeoutMs?: number
    wrapBash?: boolean
    stream?: boolean
  },
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const fullCommand = options?.cwd ? `cd ${options.cwd} && ${command}` : command
  const wrapped =
    options?.wrapBash === false ? fullCommand : wrapBash(fullCommand)
  const streamOutput = options?.stream !== false

  try {
    const result = await sandbox.commands.run(
      wrapped,
      streamOutput
        ? {
            timeoutMs: options?.timeoutMs ?? 600000,
            onStdout: (chunk) => {
              process.stdout.write(chunk)
            },
            onStderr: (chunk) => {
              process.stderr.write(chunk)
            },
          }
        : {
            timeoutMs: options?.timeoutMs ?? 600000,
          },
    )
    return result
  } catch (error) {
    if (error instanceof CommandExitError) {
      return {
        exitCode: error.exitCode,
        stdout: error.stdout,
        stderr: error.stderr,
      }
    }
    throw error
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
    'E2B_API_KEY',
    'AGENT_GEMINI_API_KEY',
    'GITHUB_TOKEN',
    'GEMINI_DEBUG',
    'GEMINI_FLAGS',
    'GEMINI_OUTPUT',
    'APP_URL',
    'DEV0_PROJECT_ID',
    'DEV0_TASK_ID',
  ])
  requireEnv('E2B_API_KEY', E2B_API_KEY)
  requireEnv('AGENT_GEMINI_API_KEY', AGENT_GEMINI_API_KEY)
  requireEnv('GITHUB_TOKEN', GITHUB_TOKEN)

  const sandbox = await Sandbox.create(TEMPLATE_NAME, {
    apiKey: E2B_API_KEY!,
    envs: {
      GH_TOKEN: GITHUB_TOKEN!,
      GITHUB_TOKEN: GITHUB_TOKEN!,
      GEMINI_API_KEY: AGENT_GEMINI_API_KEY!,
      AGENT_GEMINI_API_KEY: AGENT_GEMINI_API_KEY!,
      ...(GEMINI_DEBUG ? { GEMINI_DEBUG } : {}),
    },
    allowInternetAccess: true,
  })

  try {
    const settingsResult = await runCommand(
      sandbox,
      [
        `mkdir -p "${HOME_DIR}/.gemini"`,
        `printf '%s' '{"selectedAuthType":"gemini-api-key"}' > "${HOME_DIR}/.gemini/settings.json"`,
        `printf '%s' "GEMINI_API_KEY=${escapeForDoubleQuotes(AGENT_GEMINI_API_KEY!)}" > "${HOME_DIR}/.gemini/.env"`,
      ].join(' && '),
      { wrapBash: false },
    )
    if (settingsResult.exitCode !== 0) {
      throw new Error(
        `Failed to write Gemini settings (exit ${settingsResult.exitCode})`,
      )
    }

    const cloneResult = await runCommand(
      sandbox,
      `GIT_TERMINAL_PROMPT=0 git clone "${REPO_URL}" "${WORKSPACE_DIR}"`,
    )
    if (cloneResult.exitCode !== 0) {
      throw new Error(`Git clone failed (exit ${cloneResult.exitCode})`)
    }

    const gitConfigResult = await runCommand(
      sandbox,
      `git config user.email "dev0-agent@users.noreply.github.com" && git config user.name "dev0-agent"`,
      { cwd: WORKSPACE_DIR },
    )
    if (gitConfigResult.exitCode !== 0) {
      throw new Error(`Git config failed (exit ${gitConfigResult.exitCode})`)
    }

    const remoteResult = await runCommand(
      sandbox,
      `git remote set-url origin "https://x-access-token:${GITHUB_TOKEN!}@github.com/${REPO_URL.split('github.com/')[1]}"`,
      { cwd: WORKSPACE_DIR, wrapBash: false },
    )
    if (remoteResult.exitCode !== 0) {
      throw new Error(
        `Git remote set-url failed (exit ${remoteResult.exitCode})`,
      )
    }

    const runDirResult = await runCommand(
      sandbox,
      `mkdir -p "${WORKSPACE_DIR}/${RUN_DIR}"`,
      { wrapBash: false },
    )
    if (runDirResult.exitCode !== 0) {
      throw new Error(
        `Failed to create run directory (exit ${runDirResult.exitCode})`,
      )
    }

    const installResult = await runCommand(sandbox, 'bun install', {
      cwd: WORKSPACE_DIR,
      timeoutMs: 900000,
    })
    if (installResult.exitCode !== 0) {
      throw new Error(`bun install failed (exit ${installResult.exitCode})`)
    }

    if (SANDBOX_TEST_MODE !== 'gemini-dialog') {
      console.log('🧪 Adding shadcn components to observe output...')
      const shadcnResult = await runCommand(
        sandbox,
        'bunx --bun shadcn@latest add dialog --yes --overwrite',
        {
          cwd: WORKSPACE_DIR,
          timeoutMs: 300000,
        },
      )
      if (shadcnResult.exitCode !== 0) {
        throw new Error(`shadcn add failed (exit ${shadcnResult.exitCode})`)
      }
    }

    if (SANDBOX_TEST_MODE === 'shadcn') {
      console.log('🧪 Sandbox test mode set to shadcn; stopping early.')
      return
    }

    if (SANDBOX_TEST_MODE !== 'gemini-dialog') {
      console.log('🧪 Starting dev server briefly to observe streaming...')
      const devResult = await runCommand(
        sandbox,
        'set -m; bun run dev & DEV_PID=$!; sleep 20; kill $DEV_PID; wait $DEV_PID; exit 0',
        {
          cwd: WORKSPACE_DIR,
          timeoutMs: 60000,
        },
      )
      if (devResult.exitCode !== 0) {
        console.warn(`⚠️  dev server command exited ${devResult.exitCode}`)
      }
    }

    const diagnosticPrompt = `🔎 Diagnostic: shadcn dialog add
Run the following command from the repo root EXACTLY as written (no extra args, paths, or prefixes):
- bunx --bun shadcn@latest add dialog --yes --overwrite
Then summarize the command output. Do not run any other commands.
If the command fails, report the full error output and exit.
Write a JSON file at ${RUN_DIR}/agent-result.json with:
  {"status":"success|failed","commitMessage":"...","prTitle":"...","prBody":"...","notes":"..."}
`

    const prompt = `${SANDBOX_TEST_MODE === 'gemini-dialog' ? diagnosticPrompt : FEATURE_PROMPT}

Repo: ${REPO_URL}

Please:
- Implement the feature in the repo.
- Use bun for installs and scripts (bun install, bun run, etc.).
- Run relevant checks if needed.
- Do NOT run git commit, git push, or gh pr create.
- Write a JSON file at ${RUN_DIR}/agent-result.json with:
  {"status":"success|failed","commitMessage":"...","prTitle":"...","prBody":"...","notes":"..."}
- Include a brief human summary in the final response.
`

    const geminiArgs = [
      '--yolo',
      `--model ${GEMINI_MODEL}`,
      GEMINI_DEBUG ? '--debug' : '',
      GEMINI_FLAGS ?? '',
      GEMINI_OUTPUT === 'stream-json' || SANDBOX_TEST_MODE === 'gemini-dialog'
        ? '--output-format stream-json'
        : '',
      `-p "${escapeForDoubleQuotes(prompt)}"`,
    ]

    const geminiCmd = buildGeminiCommand(geminiArgs)
    const logsPath = `${WORKSPACE_DIR}/${RUN_DIR}/logs.jsonl`
    const geminiWithLogs = `set -o pipefail && ${geminiCmd} 2>&1 | tee "${logsPath}"`

    const result = await runCommand(sandbox, geminiWithLogs, {
      cwd: WORKSPACE_DIR,
      timeoutMs: 900000,
    })

    if (result.exitCode !== 0) {
      if (SANDBOX_TEST_MODE === 'gemini-dialog') {
        console.error(`Gemini CLI failed (exit ${result.exitCode})`)
      } else {
        throw new Error(`Gemini CLI failed (exit ${result.exitCode})`)
      }
    }

    if (SANDBOX_TEST_MODE === 'gemini-dialog') {
      const logsResult = await runCommand(sandbox, `cat "${logsPath}"`, {
        cwd: WORKSPACE_DIR,
        stream: false,
      })
      if (logsResult.exitCode === 0) {
        console.log(logsResult.stdout)
      }
      return
    }

    const resultPath = `${WORKSPACE_DIR}/${RUN_DIR}/result.json`
    const agentResultPath = `${WORKSPACE_DIR}/${RUN_DIR}/agent-result.json`
    const commitMessagePath = `${WORKSPACE_DIR}/${RUN_DIR}/commit-message.txt`
    const prTitlePath = `${WORKSPACE_DIR}/${RUN_DIR}/pr-title.txt`
    const prBodyPath = `${WORKSPACE_DIR}/${RUN_DIR}/pr-body.txt`
    const extractResult = `node -e "const fs=require('fs');const lines=fs.readFileSync('${logsPath}','utf8').trim().split('\\n');let res=null;for (const line of lines){try{const obj=JSON.parse(line);if(obj.type==='result')res=obj;}catch{}}if(!res){process.exit(1);}fs.writeFileSync('${resultPath}', JSON.stringify(res, null, 2));"`
    const extractResultCmd = await runCommand(sandbox, extractResult, {
      cwd: WORKSPACE_DIR,
      wrapBash: false,
    })
    if (extractResultCmd.exitCode !== 0) {
      throw new Error(
        `Failed to extract result JSON (exit ${extractResultCmd.exitCode})`,
      )
    }

    const prepareMetadata = `node -e "const fs=require('fs');const data=JSON.parse(fs.readFileSync('${agentResultPath}','utf8'));if(data.status!=='success'){console.error('Agent status not success');process.exit(2);}const commit=String(data.commitMessage||'').trim();const title=String(data.prTitle||'').trim();const body=String(data.prBody||'').trim();if(!commit||!title||!body){console.error('Missing commit/pr metadata');process.exit(3);}fs.writeFileSync('${commitMessagePath}', commit+'\\n');fs.writeFileSync('${prTitlePath}', title+'\\n');fs.writeFileSync('${prBodyPath}', body+'\\n');"`
    const prepareResult = await runCommand(sandbox, prepareMetadata, {
      cwd: WORKSPACE_DIR,
      wrapBash: false,
    })
    if (prepareResult.exitCode !== 0) {
      throw new Error(
        `Failed to prepare commit/PR metadata (exit ${prepareResult.exitCode})`,
      )
    }

    const branchResult = await runCommand(
      sandbox,
      `git checkout -B "${BRANCH_NAME}"`,
      { cwd: WORKSPACE_DIR },
    )
    if (branchResult.exitCode !== 0) {
      throw new Error(`Git checkout failed (exit ${branchResult.exitCode})`)
    }

    const addResult = await runCommand(sandbox, 'git add -A', {
      cwd: WORKSPACE_DIR,
    })
    if (addResult.exitCode !== 0) {
      throw new Error(`Git add failed (exit ${addResult.exitCode})`)
    }

    const commitResult = await runCommand(
      sandbox,
      `git -c core.compression=0 -c http.compression=0 -c http.version=HTTP/1.1 commit -F "${commitMessagePath}"`,
      { cwd: WORKSPACE_DIR },
    )
    if (commitResult.exitCode !== 0) {
      throw new Error(`Git commit failed (exit ${commitResult.exitCode})`)
    }

    const pushResult = await runCommand(
      sandbox,
      `GIT_HTTP_VERSION=HTTP/1.1 git -c core.compression=0 -c http.compression=0 -c http.version=HTTP/1.1 push -u origin "${BRANCH_NAME}"`,
      { cwd: WORKSPACE_DIR },
    )
    if (pushResult.exitCode !== 0) {
      throw new Error(`Git push failed (exit ${pushResult.exitCode})`)
    }

    const prResult = await runCommand(
      sandbox,
      `GODEBUG=http2client=0 GH_PAGER=cat GIT_HTTP_VERSION=HTTP/1.1 gh pr create --title "$(cat ${prTitlePath})" --body-file "${prBodyPath}"`,
      { cwd: WORKSPACE_DIR },
    )
    if (prResult.exitCode !== 0) {
      throw new Error(`gh pr create failed (exit ${prResult.exitCode})`)
    }

    if (DEV0_TASK_ID) {
      const logsResult = await runCommand(sandbox, `cat "${logsPath}"`, {
        cwd: WORKSPACE_DIR,
        stream: false,
      })
      if (logsResult.exitCode !== 0) {
        throw new Error(`Failed to read logs (exit ${logsResult.exitCode})`)
      }

      const agentResult = await runCommand(
        sandbox,
        `cat "${agentResultPath}"`,
        { cwd: WORKSPACE_DIR, stream: false },
      )
      if (agentResult.exitCode !== 0) {
        throw new Error(
          `Failed to read agent result (exit ${agentResult.exitCode})`,
        )
      }

      const response = await fetch(`${APP_URL}/api/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: DEV0_PROJECT_ID ?? null,
          taskId: DEV0_TASK_ID,
          runId: RUN_ID,
          logsJsonl: logsResult.stdout,
          agentResult: JSON.parse(agentResult.stdout),
        }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(
          `Failed to persist logs (status ${response.status}): ${errorText}`,
        )
      }
    }
  } finally {
    await sandbox.kill().catch(() => undefined)
  }
}

main().catch((error) => {
  console.error(
    `\n❌ Sandbox test failed: ${error instanceof Error ? error.message : error}`,
  )
  process.exit(1)
})
