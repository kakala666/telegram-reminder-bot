type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? 'info'

function formatTime(): string {
  return new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
}

function log(level: LogLevel, message: string, data?: unknown): void {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[currentLevel]) return

  const prefix = `[${formatTime()}] [${level.toUpperCase()}]`
  const line = data !== undefined
    ? `${prefix} ${message} ${JSON.stringify(data)}`
    : `${prefix} ${message}`

  if (level === 'error') {
    console.error(line)
  } else if (level === 'warn') {
    console.warn(line)
  } else {
    console.log(line)
  }
}

export const logger = {
  debug: (msg: string, data?: unknown) => log('debug', msg, data),
  info: (msg: string, data?: unknown) => log('info', msg, data),
  warn: (msg: string, data?: unknown) => log('warn', msg, data),
  error: (msg: string, data?: unknown) => log('error', msg, data),
}
