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
 * - Gemini CLI (@google/gemini-cli)
 *
 * Usage:
 *   bun run scripts/create-snapshot.ts
 *
 * Requirements:
 *   - DAYTONA_API_KEY in .env.local
 *   - DAYTONA_API_URL in .env.local
 */

import { Daytona, Image } from '@daytonaio/sdk'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const SNAPSHOT_NAME = 'dev0-universal'
const WORKING_DIR = '/home/daytona/workspace'

async function createSnapshot() {
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
  console.log('')

  const universalImage = Image.base('oven/bun:1.3')
    // Install system dependencies
    .runCommands(
      'apt-get update && apt-get install -y git curl sudo'
    )
    // Install GitHub CLI
    // https://github.com/cli/cli/blob/trunk/docs/install_linux.md
    .runCommands(
      'curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg'
    )
    .runCommands(
      'chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg'
    )
    .runCommands(
      'echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null'
    )
    .runCommands('apt-get update && apt-get install -y gh')
    // Install Gemini CLI globally
    .runCommands('bun install -g @google/gemini-cli')
    // Setup workspace directory
    .runCommands(`mkdir -p ${WORKING_DIR}`)
    .workdir(WORKING_DIR)
    // Verify installations
    .runCommands('bun --version && git --version && gh --version && gemini --version')

  console.log('Building snapshot (this may take a few minutes)...\n')

  try {
    await daytona.snapshot.create(
      { name: SNAPSHOT_NAME, image: universalImage },
      { onLogs: (log) => process.stdout.write(log) }
    )

    console.log(`\n✅ Snapshot "${SNAPSHOT_NAME}" created successfully!`)
    console.log('\nPre-installed tools:')
    console.log('  - bun (JavaScript runtime)')
    console.log('  - git (version control)')
    console.log('  - gh (GitHub CLI - for PR creation)')
    console.log('  - gemini (Google Gemini CLI - for AI coding)')
    console.log('\nUsage:')
    console.log('  This snapshot is used as the base for all dev0 sandboxes.')
    console.log('  Projects are cloned from template repos at runtime.')
  } catch (error) {
    console.error('\n❌ Failed to create snapshot:', error)
    process.exit(1)
  }
}

createSnapshot()
