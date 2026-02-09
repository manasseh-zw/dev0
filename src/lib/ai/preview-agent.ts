import { google } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
import { previewOutputSchema, type PreviewOutput } from './schemas'
import { GEMINI_3_FLASH } from './models'

const PREVIEW_MODEL = GEMINI_3_FLASH

const PREVIEW_SYSTEM_PROMPT = `You are a technical product strategist and naming expert. Your job is to take a user's rough "vibe" or idea for a software project and extract:

1. **A catchy, memorable project name** - Should be 2-4 words, either PascalCase (like "RetroLog") or with spaces (like "Recipe Hub"). Make it memorable but professional.

2. **A punchy tagline** - A single sentence (max 10 words) that captures the essence of the project.

3. **A technical description** - A concise 2-3 sentence description (max 300 characters) that preserves the most important requirements, theme/styling cues, target users, and constraints. Do not over-summarize, but keep it short.

4. **A suggested tech stack** - For now, always use "react-vite" (demo stability mode).
   - "tanstack-start" and "nextjs" are coming soon and should not be suggested yet

Guidelines:
- Be creative but practical with naming
- Keep the description short enough for a GitHub repo description limit
- Always recommend "react-vite" until other stacks are re-enabled
- If the vibe is vague, make reasonable assumptions and be explicit about them`

type PreviewAgentInput = {
  vibeInput: string
}

type PreviewAgentResult =
  | {
      success: true
      data: PreviewOutput
    }
  | {
      success: false
      error: string
    }

export async function generatePreview(
  input: PreviewAgentInput,
): Promise<PreviewAgentResult> {
  try {
    const { output } = await generateText({
      model: google(PREVIEW_MODEL),
      output: Output.object({ schema: previewOutputSchema }),
      system: PREVIEW_SYSTEM_PROMPT,
      prompt: `Here's the user's project idea:\n\n"${input.vibeInput}"\n\nGenerate a project preview with a name, tagline, description, and recommended tech stack.`,
      temperature: 0.7,
    })

    return {
      success: true,
      data: output,
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('[Preview Agent Error]:', message)

    return {
      success: false,
      error: message,
    }
  }
}

export { PREVIEW_MODEL, type PreviewAgentInput, type PreviewAgentResult }
