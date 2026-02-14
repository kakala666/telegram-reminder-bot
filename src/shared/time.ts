import { TIMEZONE } from '../config/constants.js'
import { AppError } from './errors.js'

export function nowMs(): number {
  return Date.now()
}

export function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString('zh-CN', { timeZone: TIMEZONE })
}

export function getCurrentTimeString(): string {
  return new Date().toLocaleString('zh-CN', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function getCurrentDateString(): string {
  return new Date().toLocaleDateString('zh-CN', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export function getCurrentWeekday(): string {
  const idx = new Date().getDay()
  return WEEKDAYS[idx] ?? String(idx)
}

export function validateCronExpr(cronExpr: string): void {
  const parts = cronExpr.split(/\s+/)
  if (parts.length !== 5) {
    throw new AppError(`无效的 cron 表达式: ${cronExpr}`, 'INVALID_CRON')
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts as [string, string, string, string, string]

  const minuteNum = parseInt(minute, 10)
  const hourNum = parseInt(hour, 10)
  if (isNaN(minuteNum) || minuteNum < 0 || minuteNum > 59) {
    throw new AppError(`cron 分钟字段无效: ${minute}`, 'INVALID_CRON')
  }
  if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) {
    throw new AppError(`cron 小时字段无效: ${hour}`, 'INVALID_CRON')
  }

  if (dayOfMonth !== '*') {
    const d = parseInt(dayOfMonth, 10)
    if (isNaN(d) || d < 1 || d > 31) {
      throw new AppError(`cron 日期字段无效: ${dayOfMonth}`, 'INVALID_CRON')
    }
  }

  if (month !== '*') {
    const m = parseInt(month, 10)
    if (isNaN(m) || m < 1 || m > 12) {
      throw new AppError(`cron 月份字段无效: ${month}`, 'INVALID_CRON')
    }
  }

  if (dayOfWeek !== '*') {
    if (dayOfWeek.includes('-')) {
      const [start, end] = dayOfWeek.split('-').map(Number)
      if (start === undefined || end === undefined || isNaN(start) || isNaN(end) || start < 0 || end > 6) {
        throw new AppError(`cron 星期字段无效: ${dayOfWeek}`, 'INVALID_CRON')
      }
    } else {
      const d = parseInt(dayOfWeek, 10)
      if (isNaN(d) || d < 0 || d > 6) {
        throw new AppError(`cron 星期字段无效: ${dayOfWeek}`, 'INVALID_CRON')
      }
    }
  }
}

export function computeNextCronRun(cronExpr: string, afterMs: number): number {
  validateCronExpr(cronExpr)

  const parts = cronExpr.split(/\s+/)
  const [minute, hour, dayOfMonth, , dayOfWeek] = parts as [string, string, string, string, string]

  const minuteNum = parseInt(minute, 10)
  const hourNum = parseInt(hour, 10)

  const after = new Date(afterMs)
  const target = new Date(after)
  target.setSeconds(0, 0)
  target.setMinutes(minuteNum)
  target.setHours(hourNum)

  if (dayOfWeek !== '*' && dayOfWeek.includes('-')) {
    const [startDay, endDay] = dayOfWeek.split('-').map(Number) as [number, number]
    target.setDate(after.getDate())
    if (target.getTime() <= afterMs) {
      target.setDate(target.getDate() + 1)
    }
    for (let i = 0; i < 8; i++) {
      const d = target.getDay()
      if (d >= startDay && d <= endDay) return target.getTime()
      target.setDate(target.getDate() + 1)
    }
    return target.getTime()
  }

  if (dayOfWeek !== '*') {
    const targetDay = parseInt(dayOfWeek, 10)
    const currentDay = after.getDay()
    let daysAhead = targetDay - currentDay
    if (daysAhead < 0) daysAhead += 7
    if (daysAhead === 0 && target.getTime() <= afterMs) daysAhead = 7
    target.setDate(after.getDate() + daysAhead)
    return target.getTime()
  }

  if (dayOfMonth !== '*') {
    const targetDate = parseInt(dayOfMonth, 10)
    target.setDate(targetDate)
    if (target.getTime() <= afterMs) {
      target.setMonth(target.getMonth() + 1)
      target.setDate(targetDate)
    }
    return target.getTime()
  }

  if (target.getTime() <= afterMs) {
    target.setDate(target.getDate() + 1)
  }

  return target.getTime()
}

export function isWeekday(ms: number): boolean {
  const day = new Date(ms).getDay()
  return day >= 1 && day <= 5
}
