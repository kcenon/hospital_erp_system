import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

interface LogMetadata {
  context?: string;
  trace?: string;
  userId?: string;
  correlationId?: string;
  [key: string]: any;
}

@Injectable()
export class AppLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: {
        service: 'hospital-erp-backend',
        environment: process.env.NODE_ENV || 'development',
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({ all: process.env.NODE_ENV !== 'production' }),
            winston.format.printf(({ timestamp, level, msg, context, ...meta }) => {
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
              return `${timestamp} [${level}] ${context ? `[${context}] ` : ''}${msg} ${metaStr}`;
            }),
          ),
        }),
      ],
    });
  }

  log(message: string, context?: string): void;
  log(message: string, metadata?: LogMetadata): void;
  log(message: string, contextOrMetadata?: string | LogMetadata): void {
    const meta = this.normalizeMetadata(contextOrMetadata);
    this.logger.info({
      msg: message,
      level: 'info',
      time: new Date().toISOString(),
      ...meta,
    });
  }

  error(message: string, trace?: string, context?: string): void;
  error(message: string, metadata?: LogMetadata): void;
  error(message: string, traceOrMetadata?: string | LogMetadata, context?: string): void {
    const meta =
      typeof traceOrMetadata === 'object' ? traceOrMetadata : { trace: traceOrMetadata, context };

    this.logger.error({
      msg: message,
      level: 'error',
      time: new Date().toISOString(),
      ...meta,
    });
  }

  warn(message: string, context?: string): void;
  warn(message: string, metadata?: LogMetadata): void;
  warn(message: string, contextOrMetadata?: string | LogMetadata): void {
    const meta = this.normalizeMetadata(contextOrMetadata);
    this.logger.warn({
      msg: message,
      level: 'warn',
      time: new Date().toISOString(),
      ...meta,
    });
  }

  debug(message: string, context?: string): void;
  debug(message: string, metadata?: LogMetadata): void;
  debug(message: string, contextOrMetadata?: string | LogMetadata): void {
    const meta = this.normalizeMetadata(contextOrMetadata);
    this.logger.debug({
      msg: message,
      level: 'debug',
      time: new Date().toISOString(),
      ...meta,
    });
  }

  verbose(message: string, context?: string): void;
  verbose(message: string, metadata?: LogMetadata): void;
  verbose(message: string, contextOrMetadata?: string | LogMetadata): void {
    const meta = this.normalizeMetadata(contextOrMetadata);
    this.logger.verbose({
      msg: message,
      level: 'verbose',
      time: new Date().toISOString(),
      ...meta,
    });
  }

  private normalizeMetadata(contextOrMetadata?: string | LogMetadata): LogMetadata {
    if (typeof contextOrMetadata === 'string') {
      return { context: contextOrMetadata };
    }
    return contextOrMetadata || {};
  }
}
