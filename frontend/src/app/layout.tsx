import type { Metadata } from 'next';
import { Providers } from '@/providers/Providers';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://traveloop-sandy-sigma.vercel.app'),
  title: {
    default: 'Traveloop — Personalized Travel Planning',
    template: '%s | Traveloop',
  },
  description:
    'Design, organize, and share personalized multi-city itineraries with intelligent budget estimation and community discovery.',
  keywords: ['travel planning', 'itinerary builder', 'budget travel', 'trip planner', 'collaborative travel'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Traveloop',
    title: 'Traveloop — Personalized Travel Planning',
    description: 'Plan, explore, and experience your perfect trip with AI-powered itineraries and real-time collaboration.',
    images: [{ url: '/logo.png', width: 1024, height: 1024, alt: 'Traveloop Logo' }],
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  verification: {
    google: 'RSyIP-Z84S0v-8mFDEk8LwGfkYSzrp6aCMSAZU7-JK0',
  },
  other: {
    'msapplication-TileColor': '#1A6B5A',
  },
};

export const viewport = {
  themeColor: '#1A6B5A',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-body antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
