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
    links: { html: string };
  };
  links: { html: string };
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
