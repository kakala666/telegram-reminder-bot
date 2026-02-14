import type { Bot, Context } from 'grammy'
import type { BotContext } from '../create-bot.js'
import { parseReminder } from '../../ai/parse-reminder.js'
import { AI_CONFIDENCE_THRESHOLD } from '../../config/constants.js'
import { formatDateTime } from '../../shared/time.js'
import { AiParseError, AiTimeoutError, AppError } from '../../shared/errors.js'
import { logger } from '../../shared/logger.js'

const RETRY_HINT = `抱歉，我没能理解你的意思。请试试这样说：
• "明天下午3点提醒我开会"
• "每天早上8点提醒我喝水"
• "30分钟后提醒我回电话"`

const TYPE_LABELS: Record<string, string> = {
  once: '一次性',
  daily: '每日',
  weekly: '每周',
  monthly: '每月',
  weekday: '工作日',
  countdown: '倒计时',
}

export function registerMessageHandler(bot: Bot<Context>, ctx: BotContext): void {
  bot.on('message:text', async (msgCtx) => {
    const text = msgCtx.message.text
    if (text.startsWith('/')) return

    const userId = String(msgCtx.from.id)
    const chatId = String(msgCtx.chat.id)

    try {
      const aiResult = await parseReminder(text)

      if (aiResult.type === 'not_reminder') {
        await msgCtx.reply('这似乎不是一个提醒请求。输入 /help 查看使用帮助。')
        return
      }

      if (aiResult.type === 'parse_failed') {
        await msgCtx.reply(RETRY_HINT)
        return
      }

      if (aiResult.confidence < AI_CONFIDENCE_THRESHOLD) {
        await msgCtx.reply(RETRY_HINT)
        return
      }

      const reminder = ctx.reminderService.createFromAiResult(userId, chatId, text, aiResult)
      const typeLabel = TYPE_LABELS[reminder.type] ?? reminder.type
      const timeStr = formatDateTime(reminder.nextRunAt)

      await msgCtx.reply(
        `✅ 提醒已设置！\n\n` +
        `📝 内容：${reminder.content}\n` +
        `📅 类型：${typeLabel}\n` +
        `⏰ 下次提醒：${timeStr}\n` +
        `🔢 编号：#${reminder.id}`,
      )
    } catch (err) {
      if (err instanceof AiTimeoutError) {
        await msgCtx.reply('抱歉，解析超时了，请稍后再试。')
      } else if (err instanceof AiParseError) {
        logger.error('AI 解析错误', { error: err.message })
        await msgCtx.reply(RETRY_HINT)
      } else if (err instanceof AppError && err.code === 'PAST_TIME') {
        await msgCtx.reply('提醒时间已过，请设置未来的时间。')
      } else {
        logger.error('消息处理异常', { error: err })
        await msgCtx.reply('抱歉，处理消息时出错了，请稍后再试。')
      }
    }
  })
}
