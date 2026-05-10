import { Response } from 'express';
import { ApiResponse, PaginatedResponse, PaginationMeta } from '../types';

/**
 * Send a standardized success response.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  if (message) response.message = message;
  res.status(statusCode).json(response);
}

/**
 * Send a standardized created response (201).
 */
export function sendCreated<T>(res: Response, data: T, message?: string): void {
  sendSuccess(res, data, message, 201);
}

/**
 * Send a no-content response (204).
 */
export function sendNoContent(res: Response): void {
  res.status(204).send();
}

/**
 * Send a paginated response.
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta
): void {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination,
  };
  res.setHeader('X-Total-Count', pagination.total.toString());
  res.setHeader('X-Total-Pages', pagination.totalPages.toString());
  res.status(200).json(response);
}

/**
 * Send a standardized error response.
 */
export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): void {
  const error: { code: string; message: string; details?: unknown } = { code, message };
  if (details) error.details = details;
  res.status(statusCode).json({ success: false, error });
}
