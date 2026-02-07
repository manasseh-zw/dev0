import { Redis } from '@upstash/redis'
import { Realtime } from '@upstash/realtime'
import { env } from '@/lib/env'
import { executionEventSchema } from './schema'

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
})

export const realtime = new Realtime({
  schema: executionEventSchema,
  redis,
  verbose: env.isDev,
})
