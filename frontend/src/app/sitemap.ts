import { MetadataRoute } from 'next';

/**
 * Production-ready sitemap for Traveloop.
 *
 * Next.js App Router automatically serves this at /sitemap.xml.
 *
 * Only publicly accessible, non-auth pages are included.
 * Dynamic routes like /share/[slug] and /trips/[id] are excluded because
 * they require runtime data; add them here if you later have a public API
 * endpoint that enumerates public shared trips.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://traveloop-sandy-sigma.vercel.app';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search/cities`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];
}
