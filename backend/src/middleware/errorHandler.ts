import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { logger } from '../config/logger';
import { sendError } from '../lib/response';

/**
 * Global error handling middleware.
 * Must be registered LAST in the middleware chain.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle known operational errors
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('Non-operational error:', { error: err.message, stack: err.stack });
    }
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // Handle Multer errors
  if (err.name === 'MulterError') {
    sendError(res, 400, 'FILE_UPLOAD_ERROR', err.message);
    return;
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && 'body' in err) {
    sendError(res, 400, 'INVALID_JSON', 'Invalid JSON in request body');
    return;
  }

  // Handle unknown errors
  logger.error('Unhandled error:', { error: err.message, stack: err.stack });
  sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}
