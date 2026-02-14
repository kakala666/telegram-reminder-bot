import type Database from 'better-sqlite3'
import type { Reminder, CreateReminderInput, ReminderStatus } from './reminder.types.js'
import { nowMs } from '../shared/time.js'
import { DbError } from '../shared/errors.js'

interface ReminderRow {
  id: number
  user_id: string
  chat_id: string
  type: string
  status: string
  content: string
  source_text: string
  raw_time_text: string | null
  ai_confidence: number | null
  cron_expr: string | null
  next_run_at: number
  last_run_at: number | null
  run_count: number
  created_at: number
  updated_at: number
}

function rowToReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    userId: row.user_id,
    chatId: row.chat_id,
    type: row.type as Reminder['type'],
    status: row.status as Reminder['status'],
    content: row.content,
    sourceText: row.source_text,
    rawTimeText: row.raw_time_text,
    aiConfidence: row.ai_confidence,
    cronExpr: row.cron_expr,
    nextRunAt: row.next_run_at,
    lastRunAt: row.last_run_at,
    runCount: row.run_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function createReminderRepository(db: Database.Database) {
  const insertStmt = db.prepare(`
    INSERT INTO reminders (user_id, chat_id, type, status, content, source_text, raw_time_text, ai_confidence, cron_expr, next_run_at, created_at, updated_at)
    VALUES (@userId, @chatId, @type, 'active', @content, @sourceText, @rawTimeText, @aiConfidence, @cronExpr, @nextRunAt, @createdAt, @updatedAt)
  `)

  const findDueStmt = db.prepare(`
    SELECT * FROM reminders WHERE status = 'active' AND next_run_at <= ? ORDER BY next_run_at ASC LIMIT ?
  `)

  const findByUserStmt = db.prepare(`
    SELECT * FROM reminders WHERE user_id = ? AND status IN ('active', 'paused') ORDER BY next_run_at ASC
  `)

  const findByIdStmt = db.prepare(`
    SELECT * FROM reminders WHERE id = ? AND user_id = ?
  `)

  const updateStatusStmt = db.prepare(`
    UPDATE reminders SET status = ?, updated_at = ? WHERE id = ?
  `)

  const updateNextRunStmt = db.prepare(`
    UPDATE reminders SET next_run_at = ?, last_run_at = ?, run_count = run_count + 1, status = 'active', updated_at = ? WHERE id = ?
  `)

  const claimFiringStmt = db.prepare(`
    UPDATE reminders SET status = 'firing', updated_at = ? WHERE id = ? AND status = 'active'
  `)

  const findFiringStmt = db.prepare(`
    SELECT * FROM reminders WHERE status = 'firing'
  `)

  const findActiveOnceExpiredStmt = db.prepare(`
    SELECT * FROM reminders WHERE status = 'active' AND type IN ('once', 'countdown') AND next_run_at < ?
  `)

  return {
    create(input: CreateReminderInput): Reminder {
      try {
        const now = nowMs()
        const result = insertStmt.run({
          userId: input.userId,
          chatId: input.chatId,
          type: input.type,
          content: input.content,
          sourceText: input.sourceText,
          rawTimeText: input.rawTimeText,
          aiConfidence: input.aiConfidence,
          cronExpr: input.cronExpr,
          nextRunAt: input.nextRunAt,
          createdAt: now,
          updatedAt: now,
        })
        const row = db.prepare('SELECT * FROM reminders WHERE id = ?').get(result.lastInsertRowid) as ReminderRow
        return rowToReminder(row)
      } catch (err) {
        throw new DbError('创建提醒失败', err)
      }
    },

    findDue(now: number, limit: number): Reminder[] {
      const rows = findDueStmt.all(now, limit) as ReminderRow[]
      return rows.map(rowToReminder)
    },

    findByUser(userId: string): Reminder[] {
      const rows = findByUserStmt.all(userId) as ReminderRow[]
      return rows.map(rowToReminder)
    },

    findById(id: number, userId: string): Reminder | null {
      const row = findByIdStmt.get(id, userId) as ReminderRow | undefined
      return row ? rowToReminder(row) : null
    },

    updateStatus(id: number, status: ReminderStatus): void {
      updateStatusStmt.run(status, nowMs(), id)
    },

    updateNextRun(id: number, nextRunAt: number): void {
      updateNextRunStmt.run(nextRunAt, nowMs(), nowMs(), id)
    },

    claimFiring(id: number): boolean {
      const result = claimFiringStmt.run(nowMs(), id)
      return result.changes > 0
    },

    findFiring(): Reminder[] {
      const rows = findFiringStmt.all() as ReminderRow[]
      return rows.map(rowToReminder)
    },

    findExpiredOnce(now: number): Reminder[] {
      const rows = findActiveOnceExpiredStmt.all(now) as ReminderRow[]
      return rows.map(rowToReminder)
    },
  }
}

export type ReminderRepository = ReturnType<typeof createReminderRepository>
