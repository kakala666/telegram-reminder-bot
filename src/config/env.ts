import { config } from 'dotenv'
import { z } from 'zod/v4'

config()

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN 未配置'),
  SILICONFLOW_API_KEY: z.string().min(1, 'SILICONFLOW_API_KEY 未配置'),
  SILICONFLOW_MODEL: z.string().default('deepseek-ai/DeepSeek-R1-0528-Qwen3-8B'),
  SILICONFLOW_BASE_URL: z.string().url().default('https://api.siliconflow.cn/v1'),
  DB_PATH: z.string().default('./data/reminders.db'),
  TZ: z.string().default('Asia/Shanghai'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const errors = parsed.error.issues.map(i => `  - ${i.path.join('.')}: ${i.message}`)
  console.error('环境变量配置错误:\n' + errors.join('\n'))
  process.exit(1)
}

export const env = parsed.data
