process.env.TZ = 'Asia/Shanghai'

import { env } from './config/env.js'
import { getDb, closeDb } from './db/connection.js'
import { runMigrations } from './db/migrations.js'
import { createReminderRepository } from './reminder/reminder.repository.js'
import { createReminderService } from './reminder/reminder.service.js'
import { createScheduler } from './reminder/reminder.scheduler.js'
import { runRecovery } from './reminder/reminder.recovery.js'
import { createBot } from './bot/create-bot.js'
import { logger } from './shared/logger.js'

async function main(): Promise<void> {
  logger.info('正在启动提醒机器人...')

  const db = getDb()
  runMigrations(db)

  const repo = createReminderRepository(db)
  const service = createReminderService(repo)

  const { recovered, skipped } = runRecovery(repo)
  logger.info('启动恢复结果', { recovered, skipped })

  const bot = createBot({ reminderService: service })
  const scheduler = createScheduler(repo, bot)

  scheduler.start()

  function shutdown(): void {
    logger.info('正在关闭...')
    scheduler.stop()
    closeDb()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  await bot.start({
    onStart: () => logger.info('Bot 已启动', { model: env.SILICONFLOW_MODEL }),
  })
}

main().catch((err) => {
  logger.error('启动失败', { error: err })
  process.exit(1)
})
