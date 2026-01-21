import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createSandbox, executeCommand, executeGemini, deleteSandbox } from '@/lib/sandbox'
import { prisma } from '@/lib/db'
import type { TechStack } from '@/lib/templates'

const TEST_PROJECT_ID = `test-project-${Date.now()}`
const TEST_TECH_STACK: TechStack = 'tanstack-start'

let sandboxId: string | null = null

describe('Sandbox Integration Test', () => {
  beforeAll(async () => {
    console.log('\n🧪 Starting Sandbox Integration Tests...\n')
    
    await prisma.project.create({
      data: {
        id: TEST_PROJECT_ID,
        name: 'Test Todo App',
        description: 'Integration test project',
        techStack: TEST_TECH_STACK,
        status: 'PLANNING',
      },
    })
    console.log(`✅ Created test project: ${TEST_PROJECT_ID}`)
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

    try {
      await prisma.project.delete({ where: { id: TEST_PROJECT_ID } })
      console.log(`✅ Cleaned up test project`)
    } catch (error) {
      console.warn(`⚠️  Failed to clean up project: ${error}`)
    }

    await prisma.$disconnect()
    console.log('\n✅ Tests complete!\n')
  })

  test('1. Create sandbox from snapshot', async () => {
    console.log('\n📦 Test 1: Creating sandbox...')
    
    const sandbox = await createSandbox({
      projectId: TEST_PROJECT_ID,
      techStack: TEST_TECH_STACK,
    })

    expect(sandbox).toBeDefined()
    expect(sandbox.id).toBeDefined()
    expect(sandbox.daytonaId).toBeDefined()
    expect(sandbox.status).toBe('ready')

    sandboxId = sandbox.id
    console.log(`   ✅ Sandbox created: ${sandbox.id}`)
    console.log(`   📍 Daytona ID: ${sandbox.daytonaId}`)
  }, 180_000) // 3 minute timeout for sandbox creation

  test('2. Verify template was cloned', async () => {
    console.log('\n📂 Test 2: Verifying template clone...')
    
    if (!sandboxId) throw new Error('No sandbox ID from previous test')

    const result = await executeCommand(
      sandboxId,
      'ls -la /home/daytona/workspace/project',
      { cwd: '/home/daytona/workspace' }
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('package.json')
    expect(result.stdout).toContain('src')
    
    console.log(`   ✅ Template cloned successfully`)
    console.log(`   📁 Files found: package.json, src/`)
  }, 30_000)

  test('3. Execute basic command in sandbox', async () => {
    console.log('\n🔧 Test 3: Executing basic command...')
    
    if (!sandboxId) throw new Error('No sandbox ID from previous test')

    const result = await executeCommand(
      sandboxId,
      'echo "Hello from sandbox!"'
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Hello from sandbox!')
    
    console.log(`   ✅ Command executed successfully`)
    console.log(`   📝 Output: ${result.stdout.trim()}`)
  }, 30_000)

  test('4. Check Node/Bun environment', async () => {
    console.log('\n🔍 Test 4: Checking environment...')
    
    if (!sandboxId) throw new Error('No sandbox ID from previous test')

    const bunCheck = await executeCommand(sandboxId, 'bun --version')
    const nodeCheck = await executeCommand(sandboxId, 'node --version || echo "Node not found"')

    expect(bunCheck.exitCode).toBe(0)
    
    console.log(`   ✅ Bun version: ${bunCheck.stdout.trim()}`)
    console.log(`   ℹ️  Node: ${nodeCheck.stdout.trim()}`)
  }, 30_000)

  test('5. Execute Gemini CLI - Simple task', async () => {
    console.log('\n🤖 Test 5: Running Gemini CLI (simple task)...')
    console.log('   📝 Task: Create a simple README section')
    
    if (!sandboxId) throw new Error('No sandbox ID from previous test')

    const logs: string[] = []
    
    const result = await executeGemini(sandboxId, {
      prompt: 'Create a file called HELLO.md with a simple greeting message that says "Hello from dev0 test!"',
      model: 'gemini-2.5-flash',
      yolo: true,
      cwd: '/home/daytona/workspace/project',
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
      'cat /home/daytona/workspace/project/HELLO.md'
    )
    
    expect(fileCheck.exitCode).toBe(0)
    expect(fileCheck.stdout.toLowerCase()).toContain('hello')
    
    console.log(`   ✅ File created successfully`)
    console.log(`   📄 Content preview: ${fileCheck.stdout.substring(0, 100)}...`)
  }, 120_000) // 2 minute timeout for Gemini execution

  test('6. Execute Gemini CLI - Create todo component (realistic task)', async () => {
    console.log('\n🚀 Test 6: Running Gemini CLI (realistic task)...')
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
      cwd: '/home/daytona/workspace/project',
      onOutput: (data) => {
        logs.push(data)
        const preview = data.length > 100 ? data.substring(0, 100) + '...' : data
        console.log(`   📡 ${preview}`)
      },
    })

    expect(result.exitCode).toBe(0)
    
    console.log(`   ✅ Gemini task completed`)
    console.log(`   ⏱️  Duration: ${result.duration}ms`)
    
    const fileCheck = await executeCommand(
      sandboxId,
      'cat src/components/todo-list.tsx',
      { cwd: '/home/daytona/workspace/project' }
    )
    
    expect(fileCheck.exitCode).toBe(0)
    expect(fileCheck.stdout).toContain('export')
    expect(fileCheck.stdout.toLowerCase()).toContain('todo')
    
    console.log(`   ✅ Component created successfully`)
    console.log(`   📏 Component size: ${fileCheck.stdout.length} characters`)
    console.log(`   📄 Preview:`)
    console.log('   ' + fileCheck.stdout.substring(0, 200).split('\n').join('\n   '))
  }, 180_000) // 3 minute timeout for more complex task

  test('7. Verify git is configured', async () => {
    console.log('\n🔧 Test 7: Checking git configuration...')
    
    if (!sandboxId) throw new Error('No sandbox ID from previous test')

    const result = await executeCommand(
      sandboxId,
      'git --version'
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('git version')
    
    console.log(`   ✅ Git is available: ${result.stdout.trim()}`)
  }, 30_000)
})
