# Telegram 提醒机器人 - 技术设计

## 技术决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 运行时 | Node.js + TypeScript | 用户指定 |
| Telegram SDK | grammY | 活跃维护、TypeScript 原生支持 |
| 数据库 | SQLite + better-sqlite3 | 轻量、无需额外服务、同步 API 性能好 |
| 调度器 | node-cron（DB 轮询模式） | 持久化调度、重启恢复简单 |
| AI 大模型 | deepseek-ai/DeepSeek-R1-0528-Qwen3-8B via 硅基流动 API | 高性价比、结构化输出能力强 |
| AI SDK | openai 包（兼容模式） | 与硅基流动 API 兼容、开发快 |
| Schema 验证 | zod | 验证大模型返回 JSON + 用户输入 |
| 部署 | Docker 容器 | 用户指定 |

## 目录结构

```
src/
  index.ts                    # 入口：启动 bot + 调度器
  config/
    env.ts                    # 环境变量加载与验证
    constants.ts              # 时区、置信度阈值、AI 系统提示词
  bot/
    create-bot.ts             # grammY Bot 实例创建
    middleware.ts             # 私聊过滤、错误兜底
    handlers/
      message.handler.ts      # 自然语言消息处理入口
      list.handler.ts         # /list 命令
      cancel.handler.ts       # /cancel 命令
      pause.handler.ts        # /pause 命令
      resume.handler.ts       # /resume 命令
      help.handler.ts         # /help 命令
      start.handler.ts        # /start 命令
  reminder/
    reminder.types.ts         # 类型定义
    reminder.schema.ts        # zod schema（AI 返回 + DB 记录）
    reminder.repository.ts    # 数据访问层
    reminder.service.ts       # 业务逻辑
    reminder.scheduler.ts     # 调度轮询 + 触发
    reminder.recovery.ts      # 启动恢复逻辑
  ai/
    client.ts                 # OpenAI SDK 封装（指向硅基流动）
    prompts.ts                # 系统提示词常量
    parse-reminder.ts         # 调用大模型 + 解析 + 验证
  db/
    connection.ts             # SQLite 连接管理
    migrations.ts             # 建表 + 迁移
  shared/
    time.ts                   # 时间工具（时区转换、cron 计算）
    errors.ts                 # 自定义错误类型
    logger.ts                 # 日志工具
```

## 数据库设计

### reminders 表

```sql
CREATE TABLE reminders (
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
);

CREATE INDEX idx_reminders_due ON reminders(status, next_run_at);
CREATE INDEX idx_reminders_user ON reminders(user_id, status);
```

- 时间字段统一使用 Unix 毫秒时间戳
- `next_run_at` 是调度核心字段，轮询时查询 `status='active' AND next_run_at <= now`
- 一次性提醒触发后 status → completed
- 重复提醒触发后更新 next_run_at 到下一次触发时间

## AI 大模型集成

### 系统提示词设计

```
你是一个中文提醒助手。你的唯一任务是从用户消息中提取提醒信息，并以严格的 JSON 格式返回。

当前时间：{{CURRENT_TIME}}（Asia/Shanghai 时区）
当前日期：{{CURRENT_DATE}}，星期{{CURRENT_WEEKDAY}}

## 输出格式

你必须且只能返回以下 JSON 格式，不要包含任何其他文字：

{
  "type": "once | daily | weekly | monthly | weekday | countdown",
  "time": "ISO 8601 格式的触发时间（用于 once 和 countdown 类型）",
  "cron": "cron 表达式（用于 daily/weekly/monthly/weekday 类型，5位格式：分 时 日 月 周）",
  "content": "提醒内容（简洁提取用户要做的事）",
  "confidence": 0.0到1.0之间的数字,
  "raw_time_text": "用户原始的时间表述"
}

## 类型判断规则

- once：明确指定某个具体日期时间的一次性提醒
- countdown：使用相对时间表述（X分钟后、X小时后）
- daily：每天重复
- weekly：每周某天重复
- monthly：每月某日重复
- weekday：每个工作日（周一至周五）重复

## 重要规则

1. countdown 类型：将相对时间转换为绝对时间填入 time 字段
2. 重复类型必须提供 cron 表达式，once/countdown 类型必须提供 time 字段
3. confidence 反映你对解析结果的确信程度，不确定时给低值
4. 如果消息不是提醒请求，返回：{"type": "not_reminder", "confidence": 1.0}
5. 如果无法确定时间，返回：{"type": "parse_failed", "confidence": 0.0, "reason": "原因说明"}
6. 绝对不要编造或猜测时间，不确定就返回 parse_failed
```

### 调用流程

1. 用户发送消息
2. 构造 prompt（注入当前时间）
3. 调用硅基流动 API（model: deepseek-ai/DeepSeek-R1-0528-Qwen3-8B, temperature: 0.1）
4. JSON.parse 响应
5. zod schema 验证
6. confidence >= 0.7 → 创建提醒
7. confidence < 0.7 或 parse_failed → 提示用户重试
8. not_reminder → 回复使用帮助

### 错误处理

- API 超时（30s）→ "抱歉，解析超时了，请稍后再试"
- API 错误（429/5xx）→ 1次指数退避重试，仍失败则友好提示
- JSON 解析失败 → "抱歉，我没能理解你的意思，请试试这样说：明天下午3点提醒我开会"
- 非法 schema → 同上

## 调度机制

### 轮询策略

- node-cron 每 10 秒执行一次轮询（`*/10 * * * * *`）
- 查询：`SELECT * FROM reminders WHERE status = 'active' AND next_run_at <= ? LIMIT 20`
- 事务内将匹配记录 status 更新为 firing（认领）
- 逐条发送 Telegram 消息
- 发送成功：一次性 → completed，重复 → 计算下一次 next_run_at，status → active
- 发送失败：status → active，下次轮询重试

### 启动恢复

1. 将所有 status = firing 的记录回滚为 active
2. 一次性提醒：next_run_at 已过期超过 1 小时 → 补发 + completed
3. 一次性提醒：过期超过 24 小时 → 标记 completed，不补发
4. 重复提醒：滚动 next_run_at 到下一个未来触发时间

## Docker 部署

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/ ./dist/
VOLUME ["/app/data"]
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
```

- SQLite 数据文件挂载到 `/app/data/reminders.db`
- 环境变量通过 docker-compose 或 --env-file 注入

## 环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| TELEGRAM_BOT_TOKEN | 是 | Telegram Bot Token |
| SILICONFLOW_API_KEY | 是 | 硅基流动 API Key |
| SILICONFLOW_MODEL | 否 | 模型名称，默认 deepseek-ai/DeepSeek-R1-0528-Qwen3-8B |
| SILICONFLOW_BASE_URL | 否 | API 端点，默认 https://api.siliconflow.cn/v1 |
| DB_PATH | 否 | 数据库文件路径，默认 ./data/reminders.db |
| TZ | 否 | 时区，默认 Asia/Shanghai |
