import React from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { cn } from '@/lib/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import { Mic } from '@hugeicons/core-free-icons'
import { Spinner } from '@/components/ui/spinner'
import { transcribe } from '@/lib/actions'

interface VoiceInputProps {
  onStart?: () => void
  onStop?: () => void
  onTranscription?: (text: string) => void
}

export function VoiceInput({
  className,
  onStart,
  onStop,
  onTranscription,
}: React.ComponentProps<'div'> & VoiceInputProps) {
  const [isRecording, setIsRecording] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [time, setTime] = React.useState(0)
  const [isHovering, setIsHovering] = React.useState(false)
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const abortControllerRef = React.useRef<AbortController | null>(null)

  React.useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (isRecording) {
      onStart?.()
      intervalId = setInterval(() => {
        setTime((t) => t + 1)
      }, 1000)
    } else {
      onStop?.()
      setTime(0)
    }

    return () => clearInterval(intervalId)
  }, [isRecording, onStart, onStop])

  React.useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    for (const byte of bytes) {
      binary += String.fromCharCode(byte)
    }
    return btoa(binary)
  }

  const handleStartRecording = async () => {
    if (isProcessing || isRecording || mediaRecorderRef.current) {
      return
    }

    try {
      const startSound = new Audio('/transcribe_start.mp3')
      startSound.play().catch(() => {})

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream)
      const recordingChunks: Blob[] = []
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunks.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(recordingChunks, {
            type: mediaRecorder.mimeType || 'audio/webm',
          })
          const file = new File([blob], 'recording', {
            type: blob.type || 'audio/webm',
          })
          const buffer = await file.arrayBuffer()
          const audioBase64 = arrayBufferToBase64(buffer)

          const controller = new AbortController()
          abortControllerRef.current = controller

          const { text } = await transcribe({
            data: {
              audioBase64,
              mediaType: file.type || 'audio/webm',
            },
            signal: controller.signal,
          })

          const cleaned = text?.trim()
          if (cleaned) {
            onTranscription?.(cleaned)
          }
        } catch (error) {
          if (abortControllerRef.current?.signal.aborted) {
            return
          }
          const message =
            error instanceof Error ? error.message : 'Unknown error occurred'
          console.error('[Voice Input Error]:', message)
        } finally {
          setIsProcessing(false)
          abortControllerRef.current = null
          streamRef.current?.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('[Voice Input Error]:', message)
    }
  }

  const handleStopRecording = () => {
    if (!mediaRecorderRef.current) {
      return
    }

    setIsProcessing(true)
    mediaRecorderRef.current.stop()
    mediaRecorderRef.current = null
    setIsRecording(false)
  }

  const handleCancelProcessing = () => {
    if (!abortControllerRef.current) {
      return
    }

    abortControllerRef.current.abort()
    abortControllerRef.current = null
    setIsProcessing(false)
  }

  const onClickHandler = () => {
    if (isProcessing) {
      handleCancelProcessing()
      return
    }

    if (isRecording) {
      handleStopRecording()
      return
    }

    void handleStartRecording()
  }

  return (
    <div
      className={cn('flex flex-col items-center justify-center', className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <motion.div
        className="flex p-2 border items-center justify-center rounded-full cursor-pointer"
        onClick={onClickHandler}
      >
        <div className="h-4 w-4 items-center justify-center flex">
          {isProcessing ? (
            isHovering ? (
              <div className="w-4 h-4 rounded-sm bg-foreground" />
            ) : (
              <Spinner className="size-4" />
            )
          ) : isRecording ? (
            <motion.div
              className="w-4 h-4 bg-primary rounded-sm"
              animate={{
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
            />
          ) : (
            <HugeiconsIcon icon={Mic} />
          )}
        </div>
        <AnimatePresence mode="wait">
          {isRecording && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, width: 0, marginLeft: 0 }}
              animate={{ opacity: 1, width: 'auto', marginLeft: 8 }}
              exit={{ opacity: 0, width: 0, marginLeft: 0 }}
              transition={{
                duration: 0.4,
              }}
              className="overflow-hidden flex gap-2 items-center justify-center"
            >
              {/* Frequency Animation */}
              <div className="flex gap-0.5 items-center justify-center">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 bg-primary rounded-full"
                    initial={{ height: 2 }}
                    animate={{
                      height: isRecording
                        ? [2, 3 + Math.random() * 10, 3 + Math.random() * 5, 2]
                        : 2,
                    }}
                    transition={{
                      duration: isRecording ? 1 : 0.3,
                      repeat: isRecording ? Infinity : 0,
                      delay: isRecording ? i * 0.05 : 0,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
              {/* Timer */}
              <div className="text-xs text-muted-foreground w-10 text-center">
                {formatTime(time)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
