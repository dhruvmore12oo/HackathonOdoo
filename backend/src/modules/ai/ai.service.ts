import { logger } from '../../config/logger';
import { AIProvider, AISuggestionRequest, AISuggestionResponse } from './ai.types';
import { BuiltinProvider } from './ai.providers';

// Provider registry — extensible for OpenAI, Claude, etc.
const providers: Record<string, AIProvider> = {
  builtin: new BuiltinProvider(),
};

function getProvider(name?: string): AIProvider {
  const providerName = name || 'builtin';
  const provider = providers[providerName];
  if (!provider) throw new Error(`AI provider "${providerName}" not found`);
  return provider;
}

// Simple in-memory cache (TTL: 10 minutes)
const cache = new Map<string, { data: AISuggestionResponse; expires: number }>();
const CACHE_TTL = 10 * 60 * 1000;

function getCacheKey(req: AISuggestionRequest): string {
  return `${req.destination}:${req.startDate}:${req.endDate}:${req.interests?.join(',')}:${req.travelStyle}`;
}

export async function generateItinerary(
  req: AISuggestionRequest, providerName?: string
): Promise<AISuggestionResponse> {
  const key = getCacheKey(req);
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    logger.info('AI cache hit', { destination: req.destination });
    return cached.data;
  }

  const provider = getProvider(providerName);
  logger.info('AI generating itinerary', { provider: provider.name, destination: req.destination });

  const result = await provider.generateItinerary(req);
  cache.set(key, { data: result, expires: Date.now() + CACHE_TTL });
  return result;
}
