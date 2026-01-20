import { HugeiconsIcon } from '@hugeicons/react'
import {
  AddToListIcon,
  SparklesIcon,
} from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { VoiceInput } from './voice-input'



export interface ChatInputBoxProps {
  message: string
  onMessageChange: (value: string) => void
  onSend: () => void
  selectedModel: string
  onModelChange: (modelId: string) => void
  showTools?: boolean
  placeholder?: string
}

export function ChatInputBox({
  message,
  onMessageChange,
  onSend,
  placeholder = 'Ask anything...',
}: ChatInputBoxProps) {
  return (
    <div className="rounded-2xl border border-border bg-secondary dark:bg-card p-1">
      <div className="rounded-xl border border-border dark:border-transparent bg-card dark:bg-secondary">
        <Textarea
          placeholder={placeholder}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          className="min-h-[120px] resize-none border-0 bg-transparent px-4 py-3 text-base placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSend()
            }
          }}
        />

        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 h-7 rounded-full border border-border dark:border-input bg-card dark:bg-secondary hover:bg-accent px-3"
              >
                <HugeiconsIcon
                  icon={AddToListIcon}
                  className="size-4 text-muted-foreground"
                />
                <span className="hidden sm:inline text-sm text-muted-foreground/70">
                  Plan Mode
                </span>
              </Button>
            </>
          </div>

          <div className="flex items-center gap-2">
            <VoiceInput />
            <Button size="lg" onClick={onSend} className="px-4 rounded-full ">
              Build
              <HugeiconsIcon icon={SparklesIcon} className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
