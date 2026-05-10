import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-xl animate-in">
        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
          Travel<span className="text-brand-500">oop</span>
        </h1>
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
