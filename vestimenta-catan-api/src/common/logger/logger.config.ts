import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

// Custom format for development (colorized, readable)
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, context, ...meta } = info;
    const contextStr =
      typeof context === 'string' ? `[${context}]` : context ? '[App]' : '';
    const timestampStr = String(timestamp);
    const messageStr = String(message);
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestampStr} ${level} ${contextStr} ${messageStr} ${metaStr}`;
  }),
);

// Custom format for production (JSON, structured)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

export const winstonConfig: WinstonModuleOptions = {
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: isProduction ? prodFormat : devFormat,
    }),
    // File transport for errors (production only)
    ...(isProduction
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: prodFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            format: prodFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],
  // Handle exceptions
  exceptionHandlers: isProduction
    ? [
        new winston.transports.File({
          filename: 'logs/exceptions.log',
          format: prodFormat,
        }),
      ]
    : [],
  // Handle rejections
  rejectionHandlers: isProduction
    ? [
        new winston.transports.File({
          filename: 'logs/rejections.log',
          format: prodFormat,
        }),
      ]
    : [],
};
