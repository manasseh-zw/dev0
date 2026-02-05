import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: '.env.local' })

const databaseProvider = process.env.DATABASE_PROVIDER ?? 'neon'

function getDatabaseUrl() {
  if (databaseProvider === 'neon') {
    if (!process.env.DATABASE_URL) {
      throw new Error('Missing required environment variable: DATABASE_URL')
    }
    return process.env.DATABASE_URL
  }

  if (databaseProvider === 'supabase') {
    if (!process.env.SUPABASE_DATABASE_URL) {
      throw new Error(
        'Missing required environment variable: SUPABASE_DATABASE_URL',
      )
    }
    return process.env.SUPABASE_DATABASE_URL
  }

  throw new Error(`Unsupported database provider: ${databaseProvider}`)
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: getDatabaseUrl(),
  },
})
