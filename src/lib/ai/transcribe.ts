import { google } from '@ai-sdk/google'
import type { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google'
import { generateText } from 'ai'
import { GEMINI_3_FLASH } from './models'

const TRANSCRIBE_MODEL = GEMINI_3_FLASH

type TranscribeInput = {
  audioBuffer: ArrayBuffer
  mediaType: string
  signal?: AbortSignal
}

type TranscribeResult =
  | { success: true; text: string }
  | { success: false; error: string }

const TRANSCRIBE_SYSTEM_PROMPT =
  'Transcribe the spoken audio accurately. Return only the plain text with no extra commentary.'

export async function transcribeAudio(
  input: TranscribeInput,
): Promise<TranscribeResult> {
  try {
    const { text } = await generateText({
      model: google(TRANSCRIBE_MODEL),
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingLevel: 'minimal',
            includeThoughts: false,
          },
        } satisfies GoogleGenerativeAIProviderOptions,
      },
      abortSignal: input.signal,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: TRANSCRIBE_SYSTEM_PROMPT },
            {
              type: 'file',
              data: input.audioBuffer,
              mediaType: input.mediaType,
            },
          ],
        },
      ],
      temperature: 0,
    })

    return { success: true, text: text ?? '' }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('[Transcription Error]:', message)
    return { success: false, error: message }
  }
}

export { TRANSCRIBE_MODEL, type TranscribeInput, type TranscribeResult }
