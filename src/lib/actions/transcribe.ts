import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { transcribeAudio } from '@/lib/ai/transcribe'

const transcribeInputSchema = z.object({
  audioBase64: z.string().min(1),
  mediaType: z.string().min(1),
})

type TranscribeInput = z.infer<typeof transcribeInputSchema>

export const transcribe = createServerFn({ method: 'POST' })
  .inputValidator(transcribeInputSchema)
  .handler(
    async ({
      data,
      signal,
    }: {
      data: TranscribeInput
      signal?: AbortSignal
    }) => {
      const buffer = Buffer.from(data.audioBase64, 'base64')
      const audioBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      )

      const result = await transcribeAudio({
        audioBuffer,
        mediaType: data.mediaType,
        signal,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      return { text: result.text }
    },
  )
