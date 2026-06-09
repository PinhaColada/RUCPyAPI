type Level = 'info' | 'warn' | 'error'

function log(level: Level, message: string, meta?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ?? {}),
  }
  const output = JSON.stringify(entry)
  if (level === 'error') {
    console.error(output)
  } else {
    console.log(output)
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
}
