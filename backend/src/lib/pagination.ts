import { PaginationMeta, PaginationParams } from '../types';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * Parse pagination query parameters safely.
 */
export function parsePagination(
  queryPage?: string | number,
  queryLimit?: string | number
): PaginationParams {
  const page = Math.max(Number(queryPage) || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(Number(queryLimit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Build pagination metadata from total count.
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Generate SQL LIMIT/OFFSET clause.
 */
export function paginationSQL(params: PaginationParams): string {
  return `LIMIT ${params.limit} OFFSET ${params.offset}`;
}
