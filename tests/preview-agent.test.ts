import { describe, test, expect } from 'vitest'
import { generatePreview } from '@/lib/ai'

function requireEnv(key: string) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
}

describe('Preview Agent (Live)', () => {
  test(
    'generates a valid project preview',
    async () => {
      requireEnv('GOOGLE_GENERATIVE_AI_API_KEY')

      const result = await generatePreview({
        vibeInput:
          'A lightweight habit tracker with streaks, reminders, and simple analytics for busy professionals.',
      })

      expect(result.success).toBe(true)
      if (!result.success) return

      const { name, tagline, description, suggestedTechStack } = result.data

      const trimmedName = name.trim()
      expect(trimmedName.length).toBeGreaterThan(2)

      if (trimmedName.includes(' ')) {
        const words = trimmedName.split(/\s+/)
        expect(words.length).toBeGreaterThanOrEqual(2)
        expect(words.length).toBeLessThanOrEqual(4)
      }

      const taglineWords = tagline.trim().split(/\s+/)
      expect(taglineWords.length).toBeLessThanOrEqual(10)

      expect(description.trim().length).toBeGreaterThan(20)
      expect(['tanstack-start', 'react-vite', 'nextjs']).toContain(
        suggestedTechStack,
      )
    },
    90_000,
  )
})
