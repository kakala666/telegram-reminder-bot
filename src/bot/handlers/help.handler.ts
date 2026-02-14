import type { Bot, Context } from 'grammy'

const HELP_TEXT = `📖 使用帮助

【设置提醒】直接发送自然语言消息：
• "明天下午3点提醒我开会"（一次性提醒）
• "每天早上8点提醒我喝水"（每日重复）
• "每周一提醒我写周报"（每周重复）
• "每月1号提醒我交房租"（每月重复）
• "每个工作日早上9点提醒我打卡"（工作日重复）
• "30分钟后提醒我回电话"（倒计时）

【管理提醒】
/list - 查看所有活跃提醒
/cancel <编号> - 取消提醒
/pause <编号> - 暂停重复提醒
/resume <编号> - 恢复重复提醒
/help - 显示本帮助`

export function registerHelpHandler(bot: Bot<Context>): void {
  bot.command('help', async (ctx) => {
    await ctx.reply(HELP_TEXT)
  })
}
