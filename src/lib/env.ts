/**
 * Typed environment configuration for dev0
 *
 * Usage:
 *   import { env } from '@/lib/env'
 *   console.log(env.DATABASE_URL)
 */

/**
 * Require an environment variable - throws if not set
 */
function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

/**
 * Optional environment variable with fallback
 */
function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

/**
 * Typed environment configuration
 * Access via: env.VARIABLE_NAME
 */
export const env = {
  // Database
  DATABASE_URL: requireEnv('DATABASE_URL'),

  // Daytona
  DAYTONA_API_KEY: requireEnv('DAYTONA_API_KEY'),
  DAYTONA_API_URL: requireEnv('DAYTONA_API_URL'),

  // Google Gemini (AI SDK)
  GOOGLE_GENERATIVE_AI_API_KEY: requireEnv('GOOGLE_GENERATIVE_AI_API_KEY'),

  // GitHub
  GITHUB_TOKEN: requireEnv('GITHUB_TOKEN'),
  GITHUB_BOT_USERNAME: optionalEnv('GITHUB_BOT_USERNAME', 'dev0-agent'),

  // Application
  APP_URL: optionalEnv('APP_URL', 'http://localhost:3000'),
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),

  // Computed
  get isDev() {
    return this.NODE_ENV === 'development'
  },
  get isProd() {
    return this.NODE_ENV === 'production'
  },
} as const

export { requireEnv, optionalEnv }
