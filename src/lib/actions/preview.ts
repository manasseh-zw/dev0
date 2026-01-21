import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { generatePreview, type PreviewOutput } from '@/lib/ai'

const previewInputSchema = z.object({
  vibeInput: z.string().min(10, 'Please describe your project idea in more detail'),
})

type PreviewInput = z.infer<typeof previewInputSchema>

/**
 * Generate a project preview from vibe input
 * Uses Gemini 3 Flash for fast response
 */
export const getPreview = createServerFn({ method: 'POST' })
  .inputValidator(previewInputSchema)
  .handler(async ({ data }: { data: PreviewInput }) => {
    const result = await generatePreview({ vibeInput: data.vibeInput })

    if (!result.success) {
      throw new Error(result.error)
    }

    return result.data
  })

export type { PreviewOutput }
