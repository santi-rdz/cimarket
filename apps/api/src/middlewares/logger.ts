import { pinoHttp } from 'pino-http';
import { logger } from '@/lib/logger.js';

export const httpLogger = pinoHttp({
  logger,

  customLogLevel(req, res, error) {
    if (error || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';

    return 'info';
  },
  customSuccessMessage(req, res, responseTime) {
    return `${req.method} ${req.url} ${res.statusCode} ${responseTime}ms`;
  },
  customErrorMessage(req, res, error, responseTime?: number) {
    return `${req.method} ${req.url} ${res.statusCode} ${responseTime}ms`;
  },
});
