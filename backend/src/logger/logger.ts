import * as winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

const devFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  colorize({ all: true }),
  printf(({ level, message, timestamp: ts, context, ...meta }) => {
    const ctx = context ? `[${context}]` : '';
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} ${level} ${ctx} ${message}${metaStr}`;
  }),
);

const prodFormat = combine(timestamp(), json());

function createWinstonLogger(context?: string): winston.Logger {
  const isProd = process.env.NODE_ENV === 'production';
  return winston.createLogger({
    level: process.env.LOG_LEVEL ?? 'info',
    format: isProd ? prodFormat : devFormat,
    defaultMeta: context ? { context } : undefined,
    transports: [new winston.transports.Console()],
  });
}

/**
 * Application logger backed by Winston. Use Logger.forContext('ServiceName') in
 * services so log lines include a [ServiceName] tag.
 */
export class Logger {
  private readonly winston: winston.Logger;

  constructor(context?: string) {
    this.winston = createWinstonLogger(context);
  }

  /**
   * Create a child logger that prefixes all messages with the given context.
   * Use in Nest services: private readonly logger = Logger.forContext(MyService.name);
   */
  static forContext(context: string): Logger {
    return new Logger(context);
  }

  log(message: string, ...args: unknown[]): void {
    this.winston.info(message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.winston.error(message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.winston.warn(message, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    this.winston.debug(message, ...args);
  }

  verbose(message: string, ...args: unknown[]): void {
    this.winston.verbose(message, ...args);
  }
}

/** Default logger with no context. Prefer Logger.forContext() in services. */
export const logger = new Logger();
