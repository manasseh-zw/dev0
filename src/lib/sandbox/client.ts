import { env } from '@/lib/env'

export type E2bConnectionOpts = {
  apiKey: string
  domain?: string
  debug?: boolean
  requestTimeoutMs?: number
}

export function getE2bConnectionOpts(): E2bConnectionOpts {
  const domain = env.E2B_DOMAIN.trim()
  return {
    apiKey: env.E2B_API_KEY,
    ...(domain ? { domain } : {}),
  }
}

export function getE2bSandboxTimeoutMs(): number {
  const parsed = Number(env.E2B_SANDBOX_TIMEOUT_MS)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3600000
}
