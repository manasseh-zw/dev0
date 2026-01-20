/**
 * Test Sandbox Creation & Tool Verification
 *
 * This script creates a sandbox from the universal snapshot and verifies
 * that all required tools are installed and working correctly.
 *
 * Tests:
 * 1. Sandbox creation from snapshot
 * 2. Git is installed and working
 * 3. GitHub CLI (gh) is installed
 * 4. Gemini CLI is installed and can be invoked
 * 5. Git clone from a public repo
 *
 * Usage:
 *   bun run scripts/test-sandbox.ts
 *
 * Requirements:
 *   - DAYTONA_API_KEY in .env.local
 *   - DAYTONA_API_URL in .env.local
 *   - Snapshot "dev0-universal" must exist (run create-snapshot.ts first)
 */

import { Daytona } from '@daytonaio/sdk'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const SNAPSHOT_NAME = 'dev0-universal'

type TestResult = {
  name: string
  passed: boolean
  output?: string
  error?: string
}

async function runTest(
  name: string,
  fn: () => Promise<{ output: string }>
): Promise<TestResult> {
  try {
    console.log(`  ⏳ Running: ${name}...`)
    const { output } = await fn()
    console.log(`  ✅ Passed: ${name}`)
    return { name, passed: true, output: output.trim() }
  } catch (error) {
    console.log(`  ❌ Failed: ${name}`)
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function testSandbox() {
  const daytona = new Daytona()

  console.log('🧪 dev0 Sandbox Test Suite\n')
  console.log('═'.repeat(50))
  console.log(`Snapshot: ${SNAPSHOT_NAME}`)
  console.log('═'.repeat(50))
  console.log('')

  // Create sandbox from snapshot
  console.log('📦 Creating sandbox from snapshot...\n')

  let sandbox
  try {
    sandbox = await daytona.create(
      { snapshot: SNAPSHOT_NAME },
      { timeout: 120 } // 2 minute timeout for sandbox creation
    )
    console.log(`✅ Sandbox created: ${sandbox.id}\n`)
  } catch (error) {
    console.error('❌ Failed to create sandbox:', error)
    process.exit(1)
  }

  const results: TestResult[] = []

  console.log('🔍 Running tool verification tests...\n')

  // Test 1: Bun version
  results.push(
    await runTest('Bun Runtime', async () => {
      const response = await sandbox.process.executeCommand('bun --version')
      if (response.exitCode !== 0) throw new Error(response.result)
      return { output: `Bun v${response.result}` }
    })
  )

  // Test 2: Git version
  results.push(
    await runTest('Git Installation', async () => {
      const response = await sandbox.process.executeCommand('git --version')
      if (response.exitCode !== 0) throw new Error(response.result)
      return { output: response.result }
    })
  )

  // Test 3: GitHub CLI version
  results.push(
    await runTest('GitHub CLI (gh)', async () => {
      const response = await sandbox.process.executeCommand('gh --version')
      if (response.exitCode !== 0) throw new Error(response.result)
      // Just get first line
      const firstLine = response.result.split('\n')[0]
      return { output: firstLine }
    })
  )

  // Test 4: Gemini CLI version
  results.push(
    await runTest('Gemini CLI', async () => {
      const response = await sandbox.process.executeCommand('gemini --version')
      if (response.exitCode !== 0) throw new Error(response.result)
      return { output: response.result }
    })
  )

  // Test 5: Git clone (public repo)
  results.push(
    await runTest('Git Clone (Public Repo)', async () => {
      const response = await sandbox.process.executeCommand(
        'cd /tmp && git clone --depth 1 https://github.com/octocat/Hello-World.git && ls Hello-World'
      )
      if (response.exitCode !== 0) throw new Error(response.result)
      return { output: 'Successfully cloned octocat/Hello-World' }
    })
  )

  // Test 6: Working directory exists
  results.push(
    await runTest('Working Directory', async () => {
      const response = await sandbox.process.executeCommand(
        'test -d /home/daytona/workspace && echo "exists"'
      )
      if (response.exitCode !== 0 || !response.result.includes('exists')) {
        throw new Error('Working directory does not exist')
      }
      return { output: '/home/daytona/workspace exists' }
    })
  )

  // Test 7: Gemini CLI can be invoked with help
  results.push(
    await runTest('Gemini CLI Help', async () => {
      const response = await sandbox.process.executeCommand('gemini --help | head -5')
      if (response.exitCode !== 0) throw new Error(response.result)
      return { output: 'Gemini CLI help accessible' }
    })
  )

  // Summary
  console.log('\n' + '═'.repeat(50))
  console.log('📊 Test Summary')
  console.log('═'.repeat(50) + '\n')

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length

  for (const result of results) {
    const icon = result.passed ? '✅' : '❌'
    console.log(`${icon} ${result.name}`)
    if (result.output) {
      console.log(`   └─ ${result.output}`)
    }
    if (result.error) {
      console.log(`   └─ Error: ${result.error}`)
    }
  }

  console.log('')
  console.log(`Passed: ${passed}/${results.length}`)
  console.log(`Failed: ${failed}/${results.length}`)

  // Cleanup
  console.log('\n🧹 Cleaning up sandbox...')
  try {
    await daytona.delete(sandbox)
    console.log('✅ Sandbox deleted')
  } catch (error) {
    console.log('⚠️  Failed to delete sandbox (manual cleanup may be needed)')
  }

  // Exit with appropriate code
  if (failed > 0) {
    console.log('\n❌ Some tests failed!')
    process.exit(1)
  } else {
    console.log('\n🎉 All tests passed! Snapshot is ready for use.')
    process.exit(0)
  }
}

testSandbox().catch((error) => {
  console.error('\n❌ Test suite failed:', error)
  process.exit(1)
})
