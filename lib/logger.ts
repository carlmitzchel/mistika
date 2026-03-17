/**
 * Structured logger for API route handlers.
 * Outputs JSON lines in production, pretty-prints in development.
 */

type Level = 'info' | 'warn' | 'error'

interface LogEntry {
  level: Level
  route: string
  message: string
  [key: string]: unknown
}

function log(level: Level, route: string, message: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = { level, route, message, ts: new Date().toISOString(), ...meta }
  if (process.env.NODE_ENV === 'development') {
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️'
    console[level](`${prefix} [${route}] ${message}`, meta ?? '')
  } else {
    console[level](JSON.stringify(entry))
  }
}

export function makeLogger(route: string) {
  return {
    info: (msg: string, meta?: Record<string, unknown>) => log('info', route, msg, meta),
    warn: (msg: string, meta?: Record<string, unknown>) => log('warn', route, msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => log('error', route, msg, meta),
  }
}
