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
 * 6. Gemini CLI settings.json with Context7 MCP exists
 * 7. Gemini CLI .env for API key authentication exists
 * 8. Gemini YOLO mode with Context7 MCP integration test
 *
 * Usage:
 *   bun run scripts/test-sandbox.ts
 *
 * Options:
 *   --skip-yolo    Skip the YOLO mode integration test (faster)
 *   --full         Run full integration test including YOLO mode (default)
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
const SKIP_YOLO = process.argv.includes('--skip-yolo')

type TestResult = {
  name: string
  passed: boolean
  output?: string
  error?: string
  skipped?: boolean
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

function skipTest(name: string, reason: string): TestResult {
  console.log(`  ⏭️  Skipped: ${name} (${reason})`)
  return { name, passed: true, skipped: true, output: reason }
}

async function testSandbox() {
  const daytona = new Daytona()

  console.log('🧪 dev0 Sandbox Test Suite\n')
  console.log('═'.repeat(50))
  console.log(`Snapshot: ${SNAPSHOT_NAME}`)
  console.log(`Skip YOLO: ${SKIP_YOLO}`)
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

  // Test 8: Gemini settings.json exists with Context7 MCP configuration
  results.push(
    await runTest('Gemini Settings (Context7 MCP)', async () => {
      const response = await sandbox.process.executeCommand(
        'cat ~/.gemini/settings.json'
      )
      if (response.exitCode !== 0) throw new Error(response.result)
      
      // Verify the settings contain context7 configuration
      const settings = JSON.parse(response.result)
      if (!settings.mcpServers?.context7) {
        throw new Error('Context7 MCP not configured in settings.json')
      }
      
      // Check for HTTP URL approach (preferred)
      const ctx7 = settings.mcpServers.context7
      if (!ctx7.httpUrl || !ctx7.httpUrl.includes('context7.com')) {
        throw new Error('Context7 MCP httpUrl not properly configured')
      }
      if (!ctx7.headers?.CONTEXT7_API_KEY) {
        throw new Error('Context7 API key not configured in headers')
      }
      
      return { output: 'Context7 MCP configured in ~/.gemini/settings.json (HTTP URL mode)' }
    })
  )

  // Test 9: Gemini .env exists with API key
  results.push(
    await runTest('Gemini API Key (.env)', async () => {
      const response = await sandbox.process.executeCommand(
        'cat ~/.gemini/.env'
      )
      if (response.exitCode !== 0) throw new Error(response.result)
      
      // Verify the .env contains GEMINI_API_KEY
      if (!response.result.includes('GEMINI_API_KEY=')) {
        throw new Error('GEMINI_API_KEY not found in ~/.gemini/.env')
      }
      
      return { output: 'GEMINI_API_KEY configured in ~/.gemini/.env' }
    })
  )

  // Test 10: Gemini YOLO mode integration test (optional)
  if (SKIP_YOLO) {
    results.push(skipTest('Gemini YOLO Mode + Context7', '--skip-yolo flag used'))
  } else {
    console.log('\n🤖 Running Gemini YOLO Mode Integration Test...\n')
    console.log('   This test will:')
    console.log('   1. Run Gemini in YOLO mode')
    console.log('   2. Use Context7 MCP to fetch documentation')
    console.log('   3. Write the result to a file')
    console.log('   4. Verify the file was created with content\n')
    
    results.push(
      await runTest('Gemini YOLO Mode + Context7', async () => {
        // Run Gemini in YOLO mode with a simple Context7 documentation request
        // Using a simple library and short prompt to minimize execution time
        const testFile = '/home/daytona/workspace/context7_test.txt'
        const prompt = `Use context7 to get a brief description of the zod library (just the overview, not full docs). Create a file at ${testFile} containing a one-paragraph summary of what zod is. Be concise.`
        
        const response = await sandbox.process.executeCommand(
          `gemini --yolo --model gemini-3-pro-preview -p "${prompt}"`
        )
        
        // Check if Gemini executed (even if there are warnings)
        // The key is whether the file was created
        const fileCheck = await sandbox.process.executeCommand(`cat ${testFile}`)
        
        if (fileCheck.exitCode !== 0) {
          throw new Error(`File not created. Gemini output: ${response.result}`)
        }
        
        const content = fileCheck.result.trim()
        if (content.length < 10) {
          throw new Error(`File content too short: "${content}"`)
        }
        
        // Verify the content mentions zod-related terms
        const lowerContent = content.toLowerCase()
        if (!lowerContent.includes('zod') && 
            !lowerContent.includes('schema') && 
            !lowerContent.includes('validation')) {
          throw new Error('File content does not appear to be about zod')
        }
        
        return { 
          output: `YOLO mode successful! Created ${testFile} with ${content.length} chars\n   Preview: "${content.substring(0, 100)}..."` 
        }
      })
    )
    
    // Cleanup the test file
    await sandbox.process.executeCommand('rm -f /home/daytona/workspace/context7_test.txt')
  }

  // Summary
  console.log('\n' + '═'.repeat(50))
  console.log('📊 Test Summary')
  console.log('═'.repeat(50) + '\n')

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  const skipped = results.filter((r) => r.skipped).length

  for (const result of results) {
    let icon = result.passed ? '✅' : '❌'
    if (result.skipped) icon = '⏭️'
    
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
  if (skipped > 0) {
    console.log(`Skipped: ${skipped}/${results.length}`)
  }

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
    if (SKIP_YOLO) {
      console.log('   (Run without --skip-yolo to test Gemini YOLO mode)')
    }
    process.exit(0)
  }
}

testSandbox().catch((error) => {
  console.error('\n❌ Test suite failed:', error)
  process.exit(1)
})
