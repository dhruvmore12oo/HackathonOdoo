import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../lib/response';
import * as searchService from './search.service';
import type { SearchCitiesInput, TrendingInput } from './search.schema';

/**
 * GET /search/cities?q=...&country=...&limit=...&offset=...
 */
export async function searchCities(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { q, country, limit, offset } = req.query as unknown as SearchCitiesInput;
    const results = await searchService.searchCities(q, country, limit, offset);
    sendSuccess(res, results, `Found ${results.length} cities`);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /search/trending?limit=...
 */
export async function getTrending(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { limit } = req.query as unknown as TrendingInput;
    const results = await searchService.getTrendingCities(limit);
    sendSuccess(res, results, `${results.length} trending destinations`);
  } catch (error) {
    next(error);
  }
}
