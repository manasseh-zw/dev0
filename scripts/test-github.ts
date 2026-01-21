import 'dotenv/config'
import { GitHubProvider } from '@/lib/git/github'
import { generateRepoName } from '@/lib/git/utils'

async function testGitHubProvider() {
  console.log('🧪 Testing GitHub Provider\n')

  const github = new GitHubProvider()

  console.log('📝 Test 1: Generate repository name')
  const repoName = generateRepoName('My Awesome Project')
  console.log(`✅ Generated repo name: ${repoName}\n`)

  console.log('📝 Test 2: Check GitHub authentication')
  try {
    const testRepo = await github.getRepository('tanstack-template')
    console.log(`✅ Authentication successful`)
    console.log(`   Found template: ${testRepo.htmlUrl}\n`)
  } catch (error) {
    console.error(`❌ Authentication failed:`, error)
    process.exit(1)
  }

  console.log('📝 Test 3: Verify template repositories exist')
  const templates = ['tanstack-template', 'react-vite-template', 'nextjs-template']

  for (const template of templates) {
    try {
      const repo = await github.getRepository(template)
      console.log(`✅ ${template}: ${repo.htmlUrl}`)
    } catch (error) {
      console.warn(`⚠️  ${template}: Not found (needs to be created and marked as template)`)
    }
  }

  console.log('\n✨ GitHub provider is ready!')
  console.log('\n📋 Next steps:')
  console.log('1. Mark template repositories as templates on GitHub')
  console.log('2. Test repository creation with the full flow')
}

testGitHubProvider().catch(console.error)
