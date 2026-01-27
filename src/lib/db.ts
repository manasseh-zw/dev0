import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { env } from '@/lib/env'
import * as schema from '@/lib/db/schema'

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle> | undefined
}

const sql = neon(env.DATABASE_URL)

export const db =
  globalForDb.db ??
  drizzle({
    client: sql,
    schema,
  })

if (process.env.NODE_ENV !== 'production') globalForDb.db = db
