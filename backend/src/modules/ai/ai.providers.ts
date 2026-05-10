/**
 * Built-in AI provider that generates smart itinerary suggestions
 * without requiring external API keys. Uses curated travel knowledge.
 */
import { AIProvider, AISuggestionRequest, AISuggestionResponse } from './ai.types';

const POPULAR_ACTIVITIES: Record<string, string[]> = {
  beach: ['Snorkeling', 'Beach walk', 'Sunset cruise', 'Surfing lesson', 'Beachside dining'],
  city: ['City walking tour', 'Museum visit', 'Local market', 'Historical landmark', 'Street food tour'],
  mountain: ['Hiking trail', 'Scenic viewpoint', 'Nature photography', 'Mountain café', 'Wildlife spotting'],
  cultural: ['Temple visit', 'Cultural show', 'Cooking class', 'Art gallery', 'Heritage walk'],
  adventure: ['Zip-lining', 'Kayaking', 'Rock climbing', 'Bungee jumping', 'ATV ride'],
  relaxation: ['Spa treatment', 'Yoga session', 'Garden stroll', 'Tea ceremony', 'Meditation'],
  food: ['Food tour', 'Local restaurant', 'Cooking class', 'Night market', 'Wine tasting'],
  default: ['Explore the area', 'Local sightseeing', 'Try local cuisine', 'Visit a landmark', 'Relax at hotel'],
};

const SECTION_TYPES = ['morning', 'afternoon', 'evening'] as const;
const SECTION_TITLES: Record<string, string[]> = {
  morning: ['Morning Exploration', 'Sunrise Start', 'Early Adventures', 'Dawn Discoveries'],
  afternoon: ['Afternoon Delights', 'Midday Adventures', 'Lunch & Explore', 'Afternoon Wandering'],
  evening: ['Evening Magic', 'Sunset Hour', 'Night Vibes', 'Dusk Discoveries'],
};

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getActivitiesForInterests(interests: string[]): string[] {
  const matched = interests.flatMap(i =>
    POPULAR_ACTIVITIES[i.toLowerCase()] || POPULAR_ACTIVITIES.default
  );
  return [...new Set(matched)];
}

function estimateCost(activity: string, budget?: number): number {
  const base = budget ? budget * 0.05 : 500;
  const variance = Math.random() * 0.5 + 0.75;
  return Math.round(base * variance);
}

export class BuiltinProvider implements AIProvider {
  name = 'builtin';

  async generateItinerary(req: AISuggestionRequest): Promise<AISuggestionResponse> {
    const dayCount = Math.ceil(
      (new Date(req.endDate).getTime() - new Date(req.startDate).getTime()) / 86400000
    ) + 1;

    const interests = req.interests?.length ? req.interests : ['city', 'cultural', 'food'];
    const allActivities = getActivitiesForInterests(interests);
    const currency = req.currency || 'INR';

    const itinerary = Array.from({ length: Math.min(dayCount, 7) }, (_, dayIdx) => {
      const day = dayIdx + 1;
      const sections = SECTION_TYPES.map(type => {
        const titles = SECTION_TITLES[type];
        const activities = pickRandom(allActivities, 2).map(name => ({
          name: `${name} in ${req.destination}`,
          description: `Enjoy ${name.toLowerCase()} during your visit to ${req.destination}`,
          estimatedCost: estimateCost(name, req.budget),
          durationHours: type === 'morning' ? 3 : type === 'afternoon' ? 4 : 2,
          location: req.destination,
          tips: `Best time for ${name.toLowerCase()} is during ${type}`,
        }));
        return {
          type,
          title: titles[dayIdx % titles.length],
          activities,
        };
      });
      return { day, title: `Day ${day} — ${req.destination}`, sections };
    });

    const dailyCost = itinerary[0]?.sections
      .flatMap(s => s.activities)
      .reduce((sum, a) => sum + a.estimatedCost, 0) || 2000;

    return {
      itinerary,
      tips: [
        `Best time to visit ${req.destination}: check local seasonal guides`,
        `Budget tip: local transport is often cheaper than taxis`,
        `Try street food for authentic flavors at lower cost`,
        `Book activities in advance during peak season`,
        `Keep some buffer budget for unexpected discoveries`,
      ],
      estimatedBudget: {
        min: dailyCost * dayCount * 0.8,
        max: dailyCost * dayCount * 1.3,
        currency,
      },
    };
  }
}
