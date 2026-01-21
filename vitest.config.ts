import { defineConfig } from 'vitest/config'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { config as loadEnv } from 'dotenv'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const envCandidates = ['.env.local']
for (const envFile of envCandidates) {
  const fullPath = resolve(envFile)
  if (existsSync(fullPath)) {
    loadEnv({ path: fullPath })
  }
}

export default defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
  ],
  test: {
    // Use Node environment for integration tests (pg, Prisma, etc.)
    environment: 'node',

    // Timeout settings for integration tests
    testTimeout: 180_000, // 3 minutes for long-running tests
    hookTimeout: 30_000, // 30 seconds for setup/teardown

    // Run tests sequentially to avoid conflicts
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },

    // Don't transform node_modules (helps with pg compatibility)
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
})
