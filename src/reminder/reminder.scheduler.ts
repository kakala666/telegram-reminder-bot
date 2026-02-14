import cron from 'node-cron'
import type { Bot, Context } from 'grammy'
import type { ReminderRepository } from './reminder.repository.js'
import { nowMs, computeNextCronRun, isWeekday } from '../shared/time.js'
import { logger } from '../shared/logger.js'
import { SCHEDULER_INTERVAL_SECONDS, SCHEDULER_BATCH_SIZE } from '../config/constants.js'

export function createScheduler(repo: ReminderRepository, bot: Bot<Context>) {
  let task: cron.ScheduledTask | null = null
  let running = false

  async function tick(): Promise<void> {
    if (running) return
    running = true

    try {
      const now = nowMs()
      const dueReminders = repo.findDue(now, SCHEDULER_BATCH_SIZE)

      for (const reminder of dueReminders) {
        if (reminder.type === 'weekday' && !isWeekday(reminder.nextRunAt)) {
          const nextRun = computeNextCronRun(reminder.cronExpr!, now)
          repo.updateNextRun(reminder.id, nextRun)
          continue
        }

        const claimed = repo.claimFiring(reminder.id)
        if (!claimed) continue

        try {
          await bot.api.sendMessage(
            reminder.chatId,
            `⏰ 提醒：${reminder.content}`,
          )

          if (reminder.type === 'once' || reminder.type === 'countdown') {
            repo.updateStatus(reminder.id, 'completed')
          } else {
            const nextRun = computeNextCronRun(reminder.cronExpr!, now)
            repo.updateNextRun(reminder.id, nextRun)
          }

          logger.info('提醒已发送', { id: reminder.id, content: reminder.content })
        } catch (err) {
          repo.updateStatus(reminder.id, 'active')
          logger.error('发送提醒失败', { id: reminder.id, error: err })
        }
      }
    } catch (err) {
      logger.error('调度器轮询异常', { error: err })
    } finally {
      running = false
    }
  }

  return {
    start(): void {
      const cronExpr = `*/${SCHEDULER_INTERVAL_SECONDS} * * * * *`
      task = cron.schedule(cronExpr, () => { void tick() })
      logger.info(`调度器已启动，每 ${SCHEDULER_INTERVAL_SECONDS} 秒轮询`)
    },

    stop(): void {
      if (task) {
        task.stop()
        task = null
        logger.info('调度器已停止')
      }
    },
  }
}
