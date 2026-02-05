/**
 * Task event logging utility for Gemini CLI streams
 *
 * Creates a logs folder and writes task-specific log files.
 * Each task run gets its own {taskId}.log file with all events.
 */

import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { GeminiStreamEvent } from '@/lib/types/gemini-stream'

const LOGS_DIR = join(process.cwd(), 'logs')

// Ensure logs directory exists
function ensureLogsDir(): void {
  if (!existsSync(LOGS_DIR)) {
    mkdirSync(LOGS_DIR, { recursive: true })
  }
}

/**
 * Get the log file path for a specific task
 */
export function getTaskLogPath(taskId: string): string {
  return join(LOGS_DIR, `${taskId}.log`)
}

/**
 * Log entry types
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  source: string
  message: string
  data?: unknown
}

/**
 * Create a logger instance for a specific task
 */
export function createTaskLogger(taskId: string, projectId?: string) {
  ensureLogsDir()

  const logPath = getTaskLogPath(taskId)
  const startTime = Date.now()

  // Initialize log file with header
  const header = {
    taskId,
    projectId,
    startedAt: new Date().toISOString(),
  }
  writeFileSync(logPath, `# Task Log\n${JSON.stringify(header)}\n\n`, 'utf-8')

  function writeLog(
    level: LogLevel,
    source: string,
    message: string,
    data?: unknown,
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      data,
    }

    const line = JSON.stringify(entry)
    appendFileSync(logPath, `${line}\n`, 'utf-8')
  }

  return {
    /**
     * Log a Gemini stream event
     */
    logEvent: (event: GeminiStreamEvent) => {
      writeLog('info', 'gemini', `Event: ${event.type}`, event)
    },

    /**
     * Log stdout/stderr output
     */
    logStream: (stream: 'stdout' | 'stderr', data: string) => {
      writeLog('debug', stream, 'Stream output', { data })
    },

    /**
     * Log orchestrator actions
     */
    logOrchestrator: (message: string, data?: unknown) => {
      writeLog('info', 'orchestrator', message, data)
    },

    /**
     * Log sandbox operations
     */
    logSandbox: (message: string, data?: unknown) => {
      writeLog('info', 'sandbox', message, data)
    },

    /**
     * Log warnings
     */
    warn: (source: string, message: string, data?: unknown) => {
      writeLog('warn', source, message, data)
    },

    /**
     * Log errors
     */
    error: (source: string, message: string, error?: unknown) => {
      writeLog('error', source, message, {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      })
    },

    /**
     * Log debug information
     */
    debug: (source: string, message: string, data?: unknown) => {
      writeLog('debug', source, message, data)
    },

    /**
     * Mark task as completed and write summary
     */
    complete: (durationMs: number, success: boolean, error?: string) => {
      const summary = {
        type: 'completion',
        completedAt: new Date().toISOString(),
        durationMs,
        success,
        error,
      }
      writeLog('info', 'orchestrator', 'Task completed', summary)
    },

    /**
     * Log git operations with full command and output
     */
    logGitOperation: (
      operation: string,
      command: string,
      result: {
        exitCode: number
        stdout: string
        stderr: string
      },
      success: boolean,
    ) => {
      writeLog(success ? 'info' : 'error', 'git', `Git ${operation}`, {
        operation,
        command,
        exitCode: result.exitCode,
        stdout: result.stdout || undefined,
        stderr: result.stderr || undefined,
        success,
      })
    },

    /**
     * Get the log file path
     */
    getLogPath: () => logPath,

    /**
     * Get time elapsed since logger creation
     */
    getElapsedMs: () => Date.now() - startTime,
  }
}

/**
 * Global logger for non-task-specific logging
 */
export function createGlobalLogger() {
  ensureLogsDir()

  const logPath = join(LOGS_DIR, 'app.log')

  function writeLog(
    level: LogLevel,
    source: string,
    message: string,
    data?: unknown,
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      data,
    }

    const line = JSON.stringify(entry)
    appendFileSync(logPath, `${line}\n`, 'utf-8')
  }

  return {
    info: (source: string, message: string, data?: unknown) => {
      writeLog('info', source, message, data)
    },
    warn: (source: string, message: string, data?: unknown) => {
      writeLog('warn', source, message, data)
    },
    error: (source: string, message: string, error?: unknown) => {
      writeLog('error', source, message, {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      })
    },
    debug: (source: string, message: string, data?: unknown) => {
      writeLog('debug', source, message, data)
    },
  }
}

// Default global logger instance
export const globalLogger = createGlobalLogger()
