import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import {
  createSandbox,
  executeCommand,
  executeCommandStreaming,
  executeGemini,
  deleteSandbox,
} from '@/lib/sandbox'
const WORKSPACE_DIR = '$HOME/project'

let sandboxId: string | null = null

describe('Sandbox Integration Test (Live)', () => {
  beforeAll(async () => {
    console.log('\n🧪 Starting Sandbox Integration Tests...\n')
  })

  afterAll(async () => {
    if (sandboxId) {
      try {
        await deleteSandbox(sandboxId)
        console.log(`✅ Cleaned up sandbox: ${sandboxId}`)
      } catch (error) {
        console.warn(`⚠️  Failed to clean up sandbox: ${error}`)
      }
    }

    console.log('\n✅ Tests complete!\n')
  })

  test('1. Create sandbox from template', async () => {
    console.log('\n📦 Test 1: Creating sandbox...')
    throw new Error(
      'Sandbox create requires database setup; run in app environment',
    )
  }, 5_000)

  test('2. Verify template was cloned', async () => {
    console.log('\n📂 Test 2: Verifying template clone...')

    if (!sandboxId) throw new Error('No sandbox ID from previous test')

    const result = await executeCommand(sandboxId, `ls -la ${WORKSPACE_DIR}`)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('package.json')
    expect(result.stdout).toContain('src')

    console.log(`   ✅ Template cloned successfully`)
    console.log(`   📁 Files found: package.json, src/`)
  }, 30_000)

  test('3. Execute basic command in sandbox', async () => {
    console.log('\n🔧 Test 3: Executing basic command...')

    if (!sandboxId) throw new Error('No sandbox ID from previous test')

    const result = await executeCommand(sandboxId, 'echo "Hello from sandbox!"')

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Hello from sandbox!')

    console.log(`   ✅ Command executed successfully`)
    console.log(`   📝 Output: ${result.stdout.trim()}`)
  }, 30_000)

  test('4. Check Node/Bun environment', async () => {
    console.log('\n🔍 Test 4: Checking environment...')

    if (!sandboxId) throw new Error('No sandbox ID from previous test')

    const bunCheck = await executeCommand(sandboxId, 'bun --version')
    const nodeCheck = await executeCommand(
      sandboxId,
      'node --version || echo "Node not found"',
    )

    expect(bunCheck.exitCode).toBe(0)

    console.log(`   ✅ Bun version: ${bunCheck.stdout.trim()}`)
    console.log(`   ℹ️  Node: ${nodeCheck.stdout.trim()}`)
  }, 30_000)

  test('5. Install dependencies with streaming output', async () => {
    console.log('\n📦 Test 5: Installing dependencies (streaming)...')

    if (!sandboxId) throw new Error('No sandbox ID from previous test')

    const outputChunks: string[] = []
    let lastOutputAt = Date.now()

    const result = await executeCommandStreaming(sandboxId, 'bun install', {
      cwd: WORKSPACE_DIR,
      timeout: 900_000,
      onOutput: (chunk) => {
        outputChunks.push(chunk)
        lastOutputAt = Date.now()
        const preview = chunk.length > 120 ? `${chunk.slice(0, 120)}...` : chunk
        console.log(`   📡 ${preview.replace(/\n/g, ' ')}`)
      },
      onComplete: (exitCode) => {
        console.log(`   ✅ bun install complete (exit ${exitCode})`)
      },
    })

    expect(result.exitCode).toBe(0)

    const outputLength = outputChunks.join('').trim().length
    const idleSeconds = Math.round((Date.now() - lastOutputAt) / 1000)
    console.log(`   📊 Output length: ${outputLength} chars`)
    console.log(`   ⏱️  Idle since last output: ${idleSeconds}s`)
  }, 900_000)

  test('6. Install package and run dev server briefly', async () => {
    console.log('\n🧪 Test 6: Installing a package + running dev server...')

    if (!sandboxId) throw new Error('No sandbox ID from previous test')

    const installLogs: string[] = []
    const installResult = await executeCommandStreaming(
      sandboxId,
      'bun add is-odd',
      {
        cwd: WORKSPACE_DIR,
        timeout: 300_000,
        onOutput: (chunk) => {
          installLogs.push(chunk)
          const preview =
            chunk.length > 120 ? `${chunk.slice(0, 120)}...` : chunk
          console.log(`   📦 ${preview.replace(/\n/g, ' ')}`)
        },
        onComplete: (exitCode) => {
          console.log(`   ✅ bun add complete (exit ${exitCode})`)
        },
      },
    )

    expect(installResult.exitCode).toBe(0)
    expect(installLogs.join('')).toMatch(/added|installed|resolved/i)

    const devLogs: string[] = []
    const devResult = await executeCommandStreaming(
      sandboxId,
      'timeout 20s bun run dev',
      {
        cwd: WORKSPACE_DIR,
        timeout: 60_000,
        onOutput: (chunk) => {
          devLogs.push(chunk)
          const preview =
            chunk.length > 140 ? `${chunk.slice(0, 140)}...` : chunk
          console.log(`   🚀 ${preview.replace(/\n/g, ' ')}`)
        },
        onComplete: (exitCode) => {
          console.log(`   ⏹️  dev server stopped (exit ${exitCode})`)
        },
      },
    )

    expect(devLogs.join('').length).toBeGreaterThan(0)
    expect(devResult.exitCode).not.toBe(0)
  }, 420_000)

  test('7. Execute Gemini CLI - Simple task', async () => {
    console.log('\n🤖 Test 7: Running Gemini CLI (simple task)...')
    console.log('   📝 Task: Create a simple README section')

    if (!sandboxId) throw new Error('No sandbox ID from previous test')

    const logs: string[] = []

    const result = await executeGemini(sandboxId, {
      prompt:
        'Create a file called HELLO.md with a simple greeting message that says "Hello from dev0 test!"',
      model: 'gemini-2.5-flash',
      yolo: true,
      cwd: WORKSPACE_DIR,
      onOutput: (data) => {
        logs.push(data)
        console.log(`   📡 ${data}`)
      },
    })

    expect(result.exitCode).toBe(0)

    console.log(`   ✅ Gemini executed successfully`)
    console.log(`   ⏱️  Duration: ${result.duration}ms`)

    const fileCheck = await executeCommand(
      sandboxId,
      `cat ${WORKSPACE_DIR}/HELLO.md`,
    )

    expect(fileCheck.exitCode).toBe(0)
    expect(fileCheck.stdout.toLowerCase()).toContain('hello')

    console.log(`   ✅ File created successfully`)
    console.log(
      `   📄 Content preview: ${fileCheck.stdout.substring(0, 100)}...`,
    )
  }, 120_000)

  test('8. Execute Gemini CLI - Create todo component (realistic task)', async () => {
    console.log('\n🚀 Test 8: Running Gemini CLI (realistic task)...')
    console.log('   📝 Task: Create a simple todo list component')

    if (!sandboxId) throw new Error('No sandbox ID from previous test')

    const logs: string[] = []

    const result = await executeGemini(sandboxId, {
      prompt: `Create a simple React todo list component at src/components/todo-list.tsx.
The component should:
- Use TypeScript
- Have a simple interface with an input and a button
- Display a list of todos
- Allow adding new todos
- Be a functional component with hooks

Keep it simple and minimal. Do not install any packages.`,
      model: 'gemini-2.5-flash',
      yolo: true,
      cwd: WORKSPACE_DIR,
      onOutput: (data) => {
        logs.push(data)
        const preview =
          data.length > 100 ? data.substring(0, 100) + '...' : data
        console.log(`   📡 ${preview}`)
      },
    })

    expect(result.exitCode).toBe(0)

    console.log(`   ✅ Gemini task completed`)
    console.log(`   ⏱️  Duration: ${result.duration}ms`)

    const fileCheck = await executeCommand(
      sandboxId,
      'cat src/components/todo-list.tsx',
      { cwd: WORKSPACE_DIR },
    )

    expect(fileCheck.exitCode).toBe(0)
    expect(fileCheck.stdout).toContain('export')
    expect(fileCheck.stdout.toLowerCase()).toContain('todo')

    console.log(`   ✅ Component created successfully`)
    console.log(`   📏 Component size: ${fileCheck.stdout.length} characters`)
    console.log(`   📄 Preview:`)
    console.log(
      '   ' + fileCheck.stdout.substring(0, 200).split('\n').join('\n   '),
    )
  }, 180_000)

  test('9. Verify git is configured', async () => {
    console.log('\n🔧 Test 9: Checking git configuration...')

    if (!sandboxId) throw new Error('No sandbox ID from previous test')

    const result = await executeCommand(sandboxId, 'git --version')

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('git version')

    console.log(`   ✅ Git is available: ${result.stdout.trim()}`)
  }, 30_000)
})
