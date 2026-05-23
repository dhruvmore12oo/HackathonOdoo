import { MetadataRoute } from 'next';

/**
 * Production-ready robots.txt for Traveloop.
 *
 * Next.js App Router automatically serves this at /robots.txt.
 * Tells crawlers where the sitemap lives and blocks private routes.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://traveloop-sandy-sigma.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/profile',
          '/trips/',
          '/admin',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
