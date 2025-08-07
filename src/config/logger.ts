/**
 * Winston-based Logger Configuration
 * ---------------------------------
 * Provides file-based logging with configurable log levels and scoped folders
 * Compatible with existing logger usage throughout the codebase
 */

import path from 'path';
import winston from 'winston';
import fs from 'fs';

import appConfig from './app.config';

// Define log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  verbose: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
  verbose: 'magenta',
};

// Add colors to winston
winston.addColors(logColors);

// Custom format for log messages
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format with colors for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta, null, 2)}`;
    }

    return logMessage;
  })
);

// Define proper type for log metadata
type LogMeta = Record<string, unknown> | string | undefined;

/**
 * Create a scoped Winston logger instance
 * @param scope - The scope for the logger (e.g., 'api', 'queue')
 * @returns Winston logger instance with compatible interface
 */
export function createLogger(scope: string = 'api') {
  // Create scoped logs directory path
  const logsDir = path.join(process.cwd(), 'logs', scope);

  // Create log directory if it doesn't exist
  fs.mkdirSync(logsDir, { recursive: true });

  // Create Winston logger instance
  const winstonLogger = winston.createLogger({
    levels: logLevels,
    level: appConfig.logging.level,
    format: logFormat,
    defaultMeta: {
      scope,
      environment: appConfig.nodeEnv,
    },
    transports: [
      // Error log file - only errors
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true,
        handleExceptions: false,
        handleRejections: false,
      }),

      // Combined log file - all levels
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10,
        tailable: true,
        handleExceptions: false,
        handleRejections: false,
      }),

      // Console output with colors (only in development)
      ...(appConfig.nodeEnv !== 'production'
        ? [
            new winston.transports.Console({
              format: consoleFormat,
              handleExceptions: false,
              handleRejections: false,
            }),
          ]
        : []),
    ],

    // Disable exit on error to prevent process termination
    exitOnError: false,

    // Handle uncaught exceptions and rejections separately
    exceptionHandlers: [
      new winston.transports.File({
        filename: path.join(logsDir, 'exceptions.log'),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 3,
        handleExceptions: true,
      }),
    ],

    rejectionHandlers: [
      new winston.transports.File({
        filename: path.join(logsDir, 'rejections.log'),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 3,
        handleRejections: true,
      }),
    ],
  });

  // Create a logger interface compatible with existing usage
  return {
    fatal: (message: string | Error | unknown, meta?: LogMeta) => {
      if (message instanceof Error) {
        winstonLogger.error(message.message, {
          error: message,
          stack: message.stack,
          ...(typeof meta === 'object' && meta !== null ? meta : {}),
        });
      } else {
        const logMessage = String(message);
        const logMeta = typeof meta === 'string' ? { message: meta } : meta;
        winstonLogger.error(logMessage, logMeta);
      }
    },
    error: (message: string | Error | unknown, meta?: LogMeta) => {
      if (message instanceof Error) {
        winstonLogger.error(message.message, {
          error: message,
          stack: message.stack,
          ...(typeof meta === 'object' && meta !== null ? meta : {}),
        });
      } else {
        const logMessage = String(message);
        const logMeta = typeof meta === 'string' ? { message: meta } : meta;
        winstonLogger.error(logMessage, logMeta);
      }
    },
    warn: (message: string | Error | unknown, meta?: LogMeta) => {
      if (message instanceof Error) {
        winstonLogger.warn(message.message, {
          error: message,
          stack: message.stack,
          ...(typeof meta === 'object' && meta !== null ? meta : {}),
        });
      } else {
        const logMessage = String(message);
        const logMeta = typeof meta === 'string' ? { message: meta } : meta;
        winstonLogger.warn(logMessage, logMeta);
      }
    },
    info: (message: string | Error | unknown, meta?: LogMeta) => {
      if (message instanceof Error) {
        winstonLogger.info(message.message, {
          error: message,
          stack: message.stack,
          ...(typeof meta === 'object' && meta !== null ? meta : {}),
        });
      } else {
        const logMessage = String(message);
        const logMeta = typeof meta === 'string' ? { message: meta } : meta;
        winstonLogger.info(logMessage, logMeta);
      }
    },
    debug: (message: string | Error | unknown, meta?: LogMeta) => {
      if (message instanceof Error) {
        winstonLogger.debug(message.message, {
          error: message,
          stack: message.stack,
          ...(typeof meta === 'object' && meta !== null ? meta : {}),
        });
      } else {
        const logMessage = String(message);
        const logMeta = typeof meta === 'string' ? { message: meta } : meta;
        winstonLogger.debug(logMessage, logMeta);
      }
    },
    trace: (message: string | Error | unknown, meta?: LogMeta) => {
      if (message instanceof Error) {
        winstonLogger.verbose(message.message, {
          error: message,
          stack: message.stack,
          ...(typeof meta === 'object' && meta !== null ? meta : {}),
        });
      } else {
        const logMessage = String(message);
        const logMeta = typeof meta === 'string' ? { message: meta } : meta;
        winstonLogger.verbose(logMessage, logMeta);
      }
    },
  };
}

// Create default API logger for backward compatibility
const logger = createLogger('api');

// Log startup information
logger.info('Logger initialized', {
  logLevel: appConfig.logging.level,
  nodeEnv: appConfig.nodeEnv,
  scope: 'api',
});

// Export default API logger for existing usage
export default logger;
