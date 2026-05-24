// ── Search Module Types ──

export type DestinationType = 'city' | 'region' | 'country' | 'place';

export interface SearchCityResult {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  region?: string;
  type?: string;
  destinationType?: DestinationType;
  latitude: number;
  longitude: number;
  population?: number;
  heroImage: string;
  thumbnailImage: string;
}

export interface SearchCityQuery {
  q: string;
  country?: string;
  limit?: number;
  offset?: number;
}

export interface TrendingCity extends SearchCityResult {
  searchCount: number;
}

export interface CityPlaceSuggestion {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  estimatedCost?: number;
  durationHours?: number | null;
  imageUrl?: string | null;
  distanceMeters?: number;
  source: 'catalogue' | 'opentripmap' | 'suggested';
}

export interface RecentSearch {
  id: string;
  query: string;
  resultCount: number;
  searchedAt: string;
}

// ── Provider Interfaces ──

export interface GeoDBCity {
  id: number;
  wikiDataId: string;
  type: string;
  city: string;
  name: string;
  country: string;
  countryCode: string;
  region: string;
  regionCode: string;
  latitude: number;
  longitude: number;
  population?: number;
}

export interface GeoDBResponse {
  data: GeoDBCity[];
  metadata: {
    currentOffset: number;
    totalCount: number;
  };
}

export interface GeoDBCountry {
  code: string;
  currencyCodes?: string[];
  name: string;
  wikiDataId?: string;
}

export interface GeoDBCountryResponse {
  data: GeoDBCountry[];
  metadata: {
    currentOffset: number;
    totalCount: number;
  };
}

export interface CitySearchProvider {
  searchCities(query: string, countryCode?: string, limit?: number, offset?: number): Promise<GeoDBCity[]>;
  searchAdminDivisions(query: string, countryCode?: string, limit?: number, offset?: number): Promise<GeoDBCity[]>;
  searchCountries(query: string, limit?: number, offset?: number): Promise<GeoDBCountry[]>;
  searchCountryPlaces(countryCode: string, limit?: number): Promise<GeoDBCity[]>;
  getCityDetails(cityId: string): Promise<GeoDBCity | null>;
}

export interface OpenTripMapPlace {
  xid: string;
  name: string;
  kinds?: string;
  kind?: string;
  dist?: number;
  rate?: number;
  point?: {
    lon: number;
    lat: number;
  };
  preview?: {
    source?: string;
  };
}

export interface OpenTripMapSearchOptions {
  destinationName: string;
  destinationType?: DestinationType;
  limit?: number;
}

// ── Media Types ──

export interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  description: string | null;
  user: {
    name: string;
    links: {
      html: string;
    };
  };
  links: {
    html: string;
  };
}

export interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashImage[];
}

export interface NormalizedImage {
  heroUrl: string;
  thumbnailUrl: string;
  attribution?: string;
}

export interface CityMediaProvider {
  searchCityImages(cityName: string, countryName: string): Promise<NormalizedImage>;
  getHeroImage(cityName: string, countryName: string): Promise<string>;
}

// ── Cache Types ──

export interface CachedCity {
  id: string;
  provider_city_id: string;
  name: string;
  country: string;
  country_code: string;
  region: string | null;
  latitude: number;
  longitude: number;
  population: number | null;
  hero_image_url: string | null;
  thumbnail_image_url: string | null;
  image_provider: string | null;
  search_count: number;
  last_searched_at: string;
  created_at: string;
  updated_at: string;
}
