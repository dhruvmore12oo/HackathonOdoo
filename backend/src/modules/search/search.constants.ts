// ── Search Constants ──

/** Minimum query length before triggering API search */
export const MIN_QUERY_LENGTH = 2;

/** Maximum results per search request */
export const MAX_SEARCH_LIMIT = 20;

/** Default results per search request */
export const DEFAULT_SEARCH_LIMIT = 10;

/** In-memory cache TTL in seconds (5 minutes) */
export const SEARCH_CACHE_TTL_SECONDS = 300;

/** GeoDB rate limit: requests per second for free tier */
export const GEODB_RATE_LIMIT_RPS = 1;

/** Maximum retry attempts for external API calls */
export const MAX_RETRY_ATTEMPTS = 2;

/** Retry delay in ms (exponential backoff base) */
export const RETRY_BASE_DELAY_MS = 500;

/** Request timeout for external APIs in ms */
export const EXTERNAL_API_TIMEOUT_MS = 8000;

/** Fallback city image when Unsplash fails */
export const FALLBACK_HERO_IMAGE = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80';
export const FALLBACK_THUMBNAIL_IMAGE = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80';

/** Maximum number of trending cities to return */
export const MAX_TRENDING_CITIES = 12;

/** Maximum number of recent searches to return */
export const MAX_RECENT_SEARCHES = 10;

/** Image search quality keywords for Unsplash */
export const IMAGE_SEARCH_SUFFIXES = [
  'skyline',
  'city travel',
  'cityscape landmark',
  'aerial view',
];
