import type { ReminderRepository } from './reminder.repository.js'
import { nowMs, computeNextCronRun } from '../shared/time.js'
import { logger } from '../shared/logger.js'
import { RECOVERY_RESEND_WINDOW_MS, RECOVERY_SKIP_WINDOW_MS } from '../config/constants.js'

export function runRecovery(repo: ReminderRepository): { recovered: number; skipped: number } {
  const now = nowMs()
  let recovered = 0
  let skipped = 0

  const firingReminders = repo.findFiring()
  for (const r of firingReminders) {
    repo.updateStatus(r.id, 'active')
    recovered++
    logger.info('恢复 firing 状态提醒', { id: r.id })
  }

  const expiredOnce = repo.findExpiredOnce(now)
  for (const r of expiredOnce) {
    const elapsed = now - r.nextRunAt

    if (elapsed > RECOVERY_SKIP_WINDOW_MS) {
      repo.updateStatus(r.id, 'completed')
      skipped++
      logger.info('过期提醒已跳过（超过24小时）', { id: r.id })
    } else if (elapsed > RECOVERY_RESEND_WINDOW_MS) {
      repo.updateStatus(r.id, 'completed')
      skipped++
      logger.info('过期提醒已跳过（超过1小时）', { id: r.id })
    }
  }

  const activeRecurring = repo.findDue(now, 1000)
  for (const r of activeRecurring) {
    if (r.type === 'once' || r.type === 'countdown') continue
    if (!r.cronExpr) continue

    const nextRun = computeNextCronRun(r.cronExpr, now)
    repo.updateNextRun(r.id, nextRun)
    recovered++
    logger.info('重复提醒已滚动到下一次触发', { id: r.id, nextRun })
  }

  logger.info('启动恢复完成', { recovered, skipped })
  return { recovered, skipped }
}
