import { env } from '@/lib/env'

export type E2bConnectionOpts = {
  apiKey: string
  debug?: boolean
  requestTimeoutMs?: number
}

export function getE2bConnectionOpts(): E2bConnectionOpts {
  return {
    apiKey: env.E2B_API_KEY,
  }
}

export function getE2bSandboxTimeoutMs(): number {
  const parsed = Number(env.E2B_SANDBOX_TIMEOUT_MS)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3600000
}
