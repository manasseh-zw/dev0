/**
 * Create Universal Daytona Snapshot
 *
 * This script creates a single, universal sandbox environment with all
 * CLI tools pre-installed. No framework-specific code is included.
 *
 * The snapshot includes:
 * - Bun runtime (base image)
 * - Git
 * - GitHub CLI (gh)
 * - Gemini CLI (@google/gemini-cli) with:
 *   - API key authentication for headless/YOLO mode
 *
 * Usage:
 *   bun run scripts/create-snapshot.ts
 *
 * Requirements:
 *   - DAYTONA_API_KEY in .env.local
 *   - DAYTONA_API_URL in .env.local
 *   - AGENT_GEMINI_API_KEY in .env.local (for sandbox Gemini auth)
 */

import { Daytona, Image } from '@daytonaio/sdk'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const SNAPSHOT_NAME = 'dev0-universal'
const WORKING_DIR = '/home/daytona/workspace'

// Get required environment variables
const AGENT_GEMINI_API_KEY = process.env.AGENT_GEMINI_API_KEY

function validateEnv() {
  const missing: string[] = []

  if (!AGENT_GEMINI_API_KEY) {
    missing.push('AGENT_GEMINI_API_KEY')
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:')
    missing.forEach((v) => console.error(`   - ${v}`))
    console.error('\nPlease add these to your .env.local file')
    process.exit(1)
  }
}

/**
 * Generate the Gemini CLI settings.json content
 */
function generateGeminiSettings(): string {
  const settings = {
    selectedAuthType: 'gemini-api-key', // Critical for headless/non-interactive use
  }
  return JSON.stringify(settings)
}
async function createSnapshot() {
  // Validate environment variables before proceeding
  validateEnv()

  const daytona = new Daytona()

  console.log('🚀 Creating Universal Snapshot for dev0\n')
  console.log('Configuration:')
  console.log(`  Name: ${SNAPSHOT_NAME}`)
  console.log(`  Base image: oven/bun:1.3`)
  console.log(`  Working directory: ${WORKING_DIR}`)
  console.log('')
  console.log('Included tools:')
  console.log('  - Bun (runtime)')
  console.log('  - Git')
  console.log('  - GitHub CLI (gh)')
  console.log('  - Gemini CLI (@google/gemini-cli)')
  console.log('  - jq (JSON processor)')
  console.log('')
  console.log('Gemini CLI Configuration:')
  console.log('  - API key authentication for headless/YOLO mode')
  console.log('')

  // Generate configurations (single-line, shell-safe)
  const geminiSettings = generateGeminiSettings()

  const universalImage = Image.base('oven/bun:1.3')
    .env({
      GEMINI_API_KEY: AGENT_GEMINI_API_KEY!,
    })
    .runCommands(
      // Add 'ripgrep' here to prevent the CLI from trying to download it later
      'apt-get update && apt-get install -y git curl sudo jq procps ripgrep',
      'curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg',
      'chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg',
      'echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null',
      'apt-get update && apt-get install -y gh',
      'bun install -g @google/gemini-cli',
      'mkdir -p ~/.gemini',
      `echo '${geminiSettings}' > ~/.gemini/settings.json`,
      `mkdir -p ${WORKING_DIR}`,
    )
    .workdir(WORKING_DIR)

  console.log('Building snapshot (this may take a few minutes)...\n')

  // Handle process termination gracefully
  let isTerminating = false
  const cleanup = () => {
    if (isTerminating) return
    isTerminating = true
    console.log('\n\n⚠️  Build interrupted. Cleaning up...')
    process.exit(130)
  }
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  try {
    await daytona.snapshot.create(
      { name: SNAPSHOT_NAME, image: universalImage },
      {
        onLogs: (log) => {
          // Check for error messages in the log
          if (
            log.toLowerCase().includes('error') ||
            log.toLowerCase().includes('failed')
          ) {
            console.error(log)
          } else {
            process.stdout.write(log)
          }
        },
      },
    )

    console.log(`\n✅ Snapshot "${SNAPSHOT_NAME}" created successfully!`)
    console.log('\nPre-installed tools:')
    console.log('  - bun (JavaScript runtime)')
    console.log('  - git (version control)')
    console.log('  - gh (GitHub CLI - for PR creation)')
    console.log('  - gemini (Google Gemini CLI - for AI coding)')
    console.log('  - jq (JSON processor)')
    console.log('\nGemini CLI Configuration:')
    console.log('  - ~/.gemini/settings.json (headless auth configured)')
    console.log('  - ~/.gemini/.env (API key for headless mode)')
    console.log('\nYOLO Mode Usage:')
    console.log(
      '  gemini --yolo --model gemini-3-pro-preview -p "your prompt here"',
    )
    console.log('\nUsage:')
    console.log('  This snapshot is used as the base for all dev0 sandboxes.')
    console.log('  Projects are cloned from template repos at runtime.')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Failed to create snapshot:')
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`)
      if (error.stack) {
        console.error('\nStack trace:')
        console.error(error.stack)
      }
    } else {
      console.error(error)
    }
    process.exit(1)
  }
}

// Run with top-level error handling
createSnapshot().catch((error) => {
  console.error('\n❌ Unhandled error in snapshot creation:')
  console.error(error)
  process.exit(1)
})
