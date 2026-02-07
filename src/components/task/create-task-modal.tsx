'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createTask } from '@/lib/actions'
import { cn } from '@/lib/utils'
import {
  AiChat02Icon,
  Calendar01Icon,
  CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

type CreateTaskModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

const MODEL_OPTIONS = [
  {
    value: 'gemini-3-flash-preview',
    label: 'Gemini 3 Flash',
    dotClassName: 'bg-amber-400/80 ring-1 ring-amber-200/70 shadow-sm',
  },
  {
    value: 'gemini-3-pro-preview',
    label: 'Gemini 3 Pro',
    dotClassName: 'bg-blue-500/80 ring-1 ring-blue-200/70 shadow-sm',
  },
]

export function CreateTaskModal({
  open,
  onOpenChange,
  projectId,
}: CreateTaskModalProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [geminiModel, setGeminiModel] = useState<
    'gemini-3-flash-preview' | 'gemini-3-pro-preview'
  >('gemini-3-flash-preview')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && description.trim().length > 0
  }, [title, description])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setGeminiModel('gemini-3-flash-preview')
    setError(null)
  }

  const currentModel =
    MODEL_OPTIONS.find((option) => option.value === geminiModel) ??
    MODEL_OPTIONS[0]

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      await createTask({
        data: {
          projectId,
          title: title.trim(),
          description: description.trim(),
          geminiModel,
        },
      })
      await router.invalidate()
      resetForm()
      onOpenChange(false)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create task'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      resetForm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-2xl p-0 overflow-hidden top-[30%]"
        showCloseButton
      >
        <DialogHeader className="px-6 pt-4">
          <DialogTitle className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-2.5 py-1">
              <HugeiconsIcon
                icon={AiChat02Icon}
                className="size-3.5 text-orange-500"
              />
              CORE
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-1">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Issue title"
            className="border-0 px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
          />
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add description..."
            className="border-0 px-0 mt-3 min-h-[72px] max-h-[140px] shadow-none focus-visible:ring-0"
          />
          {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        </div>

        <div className="px-6 pb-2 -mt-1 flex flex-wrap items-center gap-2">
          <Select
            value={geminiModel}
            onValueChange={(value) => {
              if (value) {
                setGeminiModel(value as typeof geminiModel)
              }
            }}
          >
            <SelectTrigger
              size="sm"
              className="h-7 px-2 rounded-full border-muted bg-muted/30 text-xs"
            >
              <SelectValue placeholder="Model">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={cn(
                      'size-2 rounded-full',
                      currentModel.dotClassName,
                    )}
                  />
                  <span>{currentModel.label}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span
                    className={`size-2 rounded-full ${option.dotClassName}`}
                  />
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5 border border-border rounded-full py-1 px-2 text-[11px] text-muted-foreground">
            <HugeiconsIcon icon={Calendar01Icon} className="size-3" />
            <span>Phase (auto)</span>
          </div>
          <div className="flex items-center gap-1.5 border border-border rounded-full py-1 px-2 text-[11px] text-muted-foreground">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" />
            <span>Pending</span>
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-3 border-t border-border/60">
          <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
