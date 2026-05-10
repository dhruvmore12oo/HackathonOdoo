import { Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors';
import { verifyAccessToken } from '../lib/token';
import { AuthenticatedRequest } from '../types';

/**
 * Authentication middleware — verifies JWT from Authorization header.
 * Attaches decoded user payload to req.user.
 */
export function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Token not provided');
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  }
}

/**
 * Optional authentication — attaches user if token is present, continues regardless.
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        req.user = verifyAccessToken(token);
      }
    }
  } catch {
    // Token invalid — continue without user
  }
  next();
}
