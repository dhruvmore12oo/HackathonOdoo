import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-3xl animate-in w-full">
        <div className="flex justify-center mb-10 w-full px-2">
          <Image 
            src="/logo-full.png" 
            alt="Traveloop Logo" 
            width={800} 
            height={320} 
            className="w-full max-w-md sm:max-w-lg lg:max-w-2xl h-auto object-contain"
            priority
          />
        </div>
        <p className="text-lg text-gray-600 mb-8 font-body">
          Personalized travel planning made easy. Design, organize, and share
          multi-city itineraries with intelligent budget estimation.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/community"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Explore Trips
          </Link>
        </div>
      </div>
    </main>
  );
}
