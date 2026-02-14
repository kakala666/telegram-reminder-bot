export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class AiParseError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, 'AI_PARSE_ERROR', cause)
    this.name = 'AiParseError'
  }
}

export class AiTimeoutError extends AppError {
  constructor(cause?: unknown) {
    super('AI 模型响应超时', 'AI_TIMEOUT', cause)
    this.name = 'AiTimeoutError'
  }
}

export class DbError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, 'DB_ERROR', cause)
    this.name = 'DbError'
  }
}
