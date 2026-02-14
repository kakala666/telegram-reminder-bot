import type Database from 'better-sqlite3'
import { logger } from '../shared/logger.js'

const CREATE_REMINDERS = `
CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('once','daily','weekly','monthly','weekday','countdown')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','paused','cancelled','completed','firing')),
  content TEXT NOT NULL,
  source_text TEXT NOT NULL,
  raw_time_text TEXT,
  ai_confidence REAL,
  cron_expr TEXT,
  next_run_at INTEGER NOT NULL,
  last_run_at INTEGER,
  run_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)`

const CREATE_INDEX_DUE = `
CREATE INDEX IF NOT EXISTS idx_reminders_due
  ON reminders(status, next_run_at)`

const CREATE_INDEX_USER = `
CREATE INDEX IF NOT EXISTS idx_reminders_user
  ON reminders(user_id, status)`

export function runMigrations(db: Database.Database): void {
  db.exec(CREATE_REMINDERS)
  db.exec(CREATE_INDEX_DUE)
  db.exec(CREATE_INDEX_USER)
  logger.info('数据库迁移完成')
}
