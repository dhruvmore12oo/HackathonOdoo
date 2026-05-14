import { unsplashProvider } from './media.providers';
import type { NormalizedImage } from './media.types';

/**
 * Media service – thin abstraction over media providers.
 * Makes swapping providers later trivial.
 */
export async function getCityImage(cityName: string, countryName: string): Promise<NormalizedImage> {
  return unsplashProvider.searchCityImages(cityName, countryName);
}

export async function getHeroImage(cityName: string, countryName: string): Promise<string> {
  return unsplashProvider.getHeroImage(cityName, countryName);
}
