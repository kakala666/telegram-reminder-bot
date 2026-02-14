import type { Bot, Context } from 'grammy'
import type { BotContext } from '../create-bot.js'
import { formatDateTime } from '../../shared/time.js'

const TYPE_LABELS: Record<string, string> = {
  once: '一次性',
  daily: '每日',
  weekly: '每周',
  monthly: '每月',
  weekday: '工作日',
  countdown: '倒计时',
}

const STATUS_LABELS: Record<string, string> = {
  active: '活跃',
  paused: '已暂停',
}

export function registerListHandler(bot: Bot<Context>, ctx: BotContext): void {
  bot.command('list', async (msgCtx) => {
    const userId = String(msgCtx.from!.id)
    const reminders = ctx.reminderService.listActive(userId)

    if (reminders.length === 0) {
      await msgCtx.reply('你还没有设置任何提醒。直接发消息给我就能创建提醒。')
      return
    }

    const lines = reminders.map((r) => {
      const typeLabel = TYPE_LABELS[r.type] ?? r.type
      const statusLabel = STATUS_LABELS[r.status] ?? r.status
      const timeStr = formatDateTime(r.nextRunAt)
      return `#${r.id} [${typeLabel}] [${statusLabel}]\n  📝 ${r.content}\n  ⏰ ${timeStr}`
    })

    await msgCtx.reply(`📋 你的提醒列表：\n\n${lines.join('\n\n')}`)
  })
}
