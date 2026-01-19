"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  FlashIcon,
  Search01Icon,
  MagicWand01Icon,
  GlobeIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/logo";
import { cn } from "@/lib/utils";
import { ChatInputBox } from "./chat-input-box";

const chatModes = [
  { id: "fast", label: "Fast", icon: FlashIcon },
  { id: "in-depth", label: "In-depth", icon: Search01Icon },
  { id: "magic", label: "Magic AI", icon: MagicWand01Icon, pro: true },
  { id: "holistic", label: "Holistic", icon: GlobeIcon },
];

export interface ChatWelcomeScreenProps {
  message: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  selectedMode: string;
  onModeChange: (modeId: string) => void;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function ChatWelcomeScreen({
  message,
  onMessageChange,
  onSend,
  selectedMode,
  onModeChange,
  selectedModel,
  onModelChange,
}: ChatWelcomeScreenProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 md:px-8">
      <div className="w-full max-w-[640px] space-y-9 -mt-12">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center justify-center size-20 rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-900/30 dark:to-blue-900/30 shadow-lg">
            <LogoIcon size={48} className="text-foreground" />
          </div>
        </div>

        {/* Welcome Text */}
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Hey! I&apos;m Dev0.ai
          </h1>
          <p className="text-2xl text-foreground">
            Tell me everything you need
          </p>
        </div>

        {/* Chat Input */}
        <ChatInputBox
          message={message}
          onMessageChange={onMessageChange}
          onSend={onSend}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          showTools={true}
        />

        {/* Mode Selection */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {chatModes.map((mode) => (
            <Button
              key={mode.id}
              variant={selectedMode === mode.id ? "secondary" : "ghost"}
              className={cn("gap-2", selectedMode === mode.id && "bg-accent")}
              onClick={() => onModeChange(mode.id)}
            >
              <HugeiconsIcon icon={mode.icon} className="size-4" />
              <span>{mode.label}</span>
              {mode.pro && (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium">
                  Pro
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="absolute bottom-6 text-center">
        <p className="text-sm text-muted-foreground">
          Dev0 AI can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
