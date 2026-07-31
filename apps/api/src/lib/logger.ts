import pino from 'pino';
import { env } from './env.js';

const transport =
  env.NODE_ENV !== 'production'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname,req,res,responseTime',
          singleLine: true,
        },
      }
    : undefined;

export const logger = pino({
  level: env.LOG_LEVEL,
  ...(transport ? { transport } : {}),
});
