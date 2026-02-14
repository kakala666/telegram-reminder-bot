import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { env } from '../config/env.js'
import { logger } from '../shared/logger.js'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  const dbPath = env.DB_PATH
  mkdirSync(dirname(dbPath), { recursive: true })

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('busy_timeout = 5000')
  db.pragma('foreign_keys = ON')

  logger.info('数据库连接已建立', { path: dbPath })
  return db
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
    logger.info('数据库连接已关闭')
  }
}
