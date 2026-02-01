import type { SandboxProvider } from '@/lib/sandbox/provider-interface'
import { e2bProvider } from '@/lib/sandbox/providers/e2b'

let provider: SandboxProvider | null = null

export function getSandboxProvider(): SandboxProvider {
  if (!provider) {
    provider = e2bProvider
  }
  return provider
}
