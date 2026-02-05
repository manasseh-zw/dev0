import * as schema from '@/lib/db/schema'
import { env } from '@/lib/env'
import { neon } from '@neondatabase/serverless'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { drizzle as drizzlePostgresJs } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const globalForDb = globalThis as unknown as {
  db:
    | ReturnType<typeof drizzleNeon>
    | ReturnType<typeof drizzlePostgresJs>
    | undefined
}

const databaseProvider = env.DATABASE_PROVIDER

function createDb() {
  if (databaseProvider === 'neon') {
    const sql = neon(env.DATABASE_URL)
    return drizzleNeon({
      client: sql,
      schema,
    })
  }

  if (databaseProvider === 'supabase') {
    if (!env.SUPABASE_DATABASE_URL) {
      throw new Error(
        'Missing required environment variable: SUPABASE_DATABASE_URL',
      )
    }
    const client = postgres(env.SUPABASE_DATABASE_URL)
    return drizzlePostgresJs({
      client,
      schema,
    })
  }

  throw new Error(`Unsupported database provider: ${databaseProvider}`)
}

export const db = globalForDb.db ?? createDb()

if (process.env.NODE_ENV !== 'production') globalForDb.db = db
