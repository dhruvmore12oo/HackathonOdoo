import { z } from 'zod';

/** Validates the query params for GET /search/cities */
export const searchCitiesSchema = z.object({
  q: z
    .string()
    .min(2, 'Query must be at least 2 characters')
    .max(100, 'Query must be at most 100 characters')
    .transform((v) => v.trim()),
  country: z
    .string()
    .length(2, 'Country code must be exactly 2 characters (ISO 3166-1 alpha-2)')
    .toUpperCase()
    .optional(),
  limit: z.coerce.number().int().min(1).max(20).default(10).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

/** Validates query params for GET /search/trending */
export const trendingSchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(12).optional(),
});

/** Validates query params for GET /search/recent */
export const recentSearchesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(10).optional(),
});

export type SearchCitiesInput = z.infer<typeof searchCitiesSchema>;
export type TrendingInput = z.infer<typeof trendingSchema>;
export type RecentSearchesInput = z.infer<typeof recentSearchesSchema>;
