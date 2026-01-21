
import { Logo } from '@/components/logo'
import { ChatInputBox } from '@/components/landing/chat-input-box'

export interface ChatWelcomeScreenProps {
  message: string
  onMessageChange: (value: string) => void
  onSend: () => void
  selectedMode: string
  onModeChange: (modeId: string) => void
  selectedModel: string
  onModelChange: (modelId: string) => void
}

export function ChatWelcomeScreen({
  message,
  onMessageChange,
  onSend,
  selectedModel,
  onModelChange,
}: ChatWelcomeScreenProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 md:px-8">
      <div className="w-full max-w-[640px] space-y-9 -mt-12">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo height={48} className="text-foreground" />
        </div>

        {/* Welcome Text */}
        <div className="space-y-4 text-center">
          <p className="text-2xl text-foreground">
            Build anything from zero to one
          </p>
        </div>

        {/* Chat Input */}
        <ChatInputBox
          message={message}
          onMessageChange={onMessageChange}
          onSend={onSend}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
        />
      </div>
    </div>
  )
}
