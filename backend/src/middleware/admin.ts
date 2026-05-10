import { Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors';
import { AuthenticatedRequest } from '../types';

/**
 * Admin role guard — must be used AFTER authenticate middleware.
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'admin') {
    next(new ForbiddenError('Admin access required'));
    return;
  }
  next();
}
