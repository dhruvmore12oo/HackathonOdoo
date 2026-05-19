import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

/**
 * HTTP request logging middleware.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const isExpectedRefresh401 =
      res.statusCode === 401 &&
      req.method === 'POST' &&
      req.originalUrl.includes('/auth/refresh');
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')?.substring(0, 100),
    };

    if (res.statusCode >= 400 && !isExpectedRefresh401) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
}
