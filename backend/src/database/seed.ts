import { pool } from '../config/database';
import { logger } from '../config/logger';

const SEED_CITIES = `
INSERT INTO cities (name, country, region, cost_index, popularity_score, lat, lng) VALUES
  ('Goa', 'India', 'South Asia', 'budget', 95, 15.2993, 74.1240),
  ('Mumbai', 'India', 'South Asia', 'mid', 90, 19.0760, 72.8777),
  ('Delhi', 'India', 'South Asia', 'mid', 88, 28.6139, 77.2090),
  ('Jaipur', 'India', 'South Asia', 'budget', 85, 26.9124, 75.7873),
  ('Manali', 'India', 'South Asia', 'budget', 82, 32.2396, 77.1887),
  ('Rishikesh', 'India', 'South Asia', 'budget', 78, 30.0869, 78.2676),
  ('Udaipur', 'India', 'South Asia', 'mid', 80, 24.5854, 73.7125),
  ('Varanasi', 'India', 'South Asia', 'budget', 76, 25.3176, 82.9739),
  ('Kerala', 'India', 'South Asia', 'mid', 87, 10.8505, 76.2711),
  ('Ladakh', 'India', 'South Asia', 'mid', 83, 34.1526, 77.5771),
  ('Bangkok', 'Thailand', 'Southeast Asia', 'budget', 92, 13.7563, 100.5018),
  ('Bali', 'Indonesia', 'Southeast Asia', 'mid', 94, -8.3405, 115.0920),
  ('Tokyo', 'Japan', 'East Asia', 'luxury', 96, 35.6762, 139.6503),
  ('Singapore', 'Singapore', 'Southeast Asia', 'luxury', 91, 1.3521, 103.8198),
  ('Dubai', 'UAE', 'Middle East', 'luxury', 93, 25.2048, 55.2708),
  ('Paris', 'France', 'Europe', 'luxury', 97, 48.8566, 2.3522),
  ('London', 'United Kingdom', 'Europe', 'luxury', 95, 51.5074, -0.1278),
  ('Rome', 'Italy', 'Europe', 'mid', 89, 41.9028, 12.4964),
  ('Barcelona', 'Spain', 'Europe', 'mid', 88, 41.3874, 2.1686),
  ('Amsterdam', 'Netherlands', 'Europe', 'mid', 86, 52.3676, 4.9041),
  ('Istanbul', 'Turkey', 'Europe', 'budget', 84, 41.0082, 28.9784),
  ('New York', 'USA', 'North America', 'luxury', 98, 40.7128, -74.0060),
  ('San Francisco', 'USA', 'North America', 'luxury', 87, 37.7749, -122.4194),
  ('Cancun', 'Mexico', 'North America', 'mid', 85, 21.1619, -86.8515),
  ('Sydney', 'Australia', 'Oceania', 'luxury', 90, -33.8688, 151.2093),
  ('Cape Town', 'South Africa', 'Africa', 'mid', 82, -33.9249, 18.4241),
  ('Marrakech', 'Morocco', 'Africa', 'budget', 79, 31.6295, -7.9811),
  ('Zurich', 'Switzerland', 'Europe', 'luxury', 84, 47.3769, 8.5417),
  ('Prague', 'Czech Republic', 'Europe', 'budget', 83, 50.0755, 14.4378),
  ('Hanoi', 'Vietnam', 'Southeast Asia', 'budget', 81, 21.0278, 105.8342)
ON CONFLICT DO NOTHING;
`;

const SEED_ACTIVITIES = `
INSERT INTO activity_catalogue (city_id, name, category, avg_cost, duration_hours, description) VALUES
  ((SELECT id FROM cities WHERE name='Goa' LIMIT 1), 'Beach Hopping Tour', 'adventure', 500, 4, 'Visit Baga, Calangute, and Anjuna beaches'),
  ((SELECT id FROM cities WHERE name='Goa' LIMIT 1), 'Spice Plantation Visit', 'sightseeing', 800, 3, 'Guided tour of organic spice farms'),
  ((SELECT id FROM cities WHERE name='Goa' LIMIT 1), 'Seafood Dinner', 'food', 1200, 2, 'Fresh catch at beachside restaurant'),
  ((SELECT id FROM cities WHERE name='Mumbai' LIMIT 1), 'Gateway of India Visit', 'sightseeing', 0, 1.5, 'Iconic colonial-era arch monument'),
  ((SELECT id FROM cities WHERE name='Mumbai' LIMIT 1), 'Street Food Walk', 'food', 600, 3, 'Vada pav, pav bhaji, and more'),
  ((SELECT id FROM cities WHERE name='Mumbai' LIMIT 1), 'Marine Drive Walk', 'relaxation', 0, 1, 'Sunset walk along the Queens Necklace'),
  ((SELECT id FROM cities WHERE name='Jaipur' LIMIT 1), 'Amber Fort Tour', 'sightseeing', 500, 3, 'Majestic hilltop fort with elephant rides'),
  ((SELECT id FROM cities WHERE name='Jaipur' LIMIT 1), 'Hawa Mahal Visit', 'sightseeing', 200, 1, 'Palace of Winds with 953 windows'),
  ((SELECT id FROM cities WHERE name='Manali' LIMIT 1), 'Solang Valley Paragliding', 'adventure', 2500, 2, 'Tandem paragliding with mountain views'),
  ((SELECT id FROM cities WHERE name='Manali' LIMIT 1), 'Rohtang Pass Drive', 'adventure', 1500, 6, 'High-altitude mountain pass excursion'),
  ((SELECT id FROM cities WHERE name='Bali' LIMIT 1), 'Ubud Rice Terraces', 'sightseeing', 300, 3, 'Walk through Tegallalang terraces'),
  ((SELECT id FROM cities WHERE name='Bali' LIMIT 1), 'Sunset at Tanah Lot', 'relaxation', 200, 2, 'Iconic sea temple at sunset'),
  ((SELECT id FROM cities WHERE name='Tokyo' LIMIT 1), 'Shibuya Crossing Experience', 'sightseeing', 0, 1, 'World-famous pedestrian crossing'),
  ((SELECT id FROM cities WHERE name='Tokyo' LIMIT 1), 'Tsukiji Market Food Tour', 'food', 5000, 3, 'Fresh sushi and Japanese street food'),
  ((SELECT id FROM cities WHERE name='Paris' LIMIT 1), 'Eiffel Tower Visit', 'sightseeing', 2500, 2, 'Ascend the iconic iron tower'),
  ((SELECT id FROM cities WHERE name='Paris' LIMIT 1), 'Louvre Museum', 'sightseeing', 1700, 4, 'World-class art museum'),
  ((SELECT id FROM cities WHERE name='Paris' LIMIT 1), 'Seine River Cruise', 'relaxation', 1500, 1.5, 'Evening boat cruise with city views'),
  ((SELECT id FROM cities WHERE name='Dubai' LIMIT 1), 'Burj Khalifa Observation', 'sightseeing', 3500, 1.5, 'View from the worlds tallest building'),
  ((SELECT id FROM cities WHERE name='Dubai' LIMIT 1), 'Desert Safari', 'adventure', 4000, 5, 'Dune bashing, camel rides, BBQ dinner'),
  ((SELECT id FROM cities WHERE name='London' LIMIT 1), 'British Museum', 'sightseeing', 0, 3, 'Free entry world-class museum'),
  ((SELECT id FROM cities WHERE name='London' LIMIT 1), 'Thames River Walk', 'relaxation', 0, 2, 'Walk from Westminster to Tower Bridge'),
  ((SELECT id FROM cities WHERE name='Rome' LIMIT 1), 'Colosseum Tour', 'sightseeing', 1600, 2, 'Guided tour of the ancient amphitheatre'),
  ((SELECT id FROM cities WHERE name='Rome' LIMIT 1), 'Trastevere Food Walk', 'food', 3000, 3, 'Pasta, gelato, and Roman cuisine'),
  ((SELECT id FROM cities WHERE name='New York' LIMIT 1), 'Central Park Walk', 'relaxation', 0, 2, 'Stroll through Manhattan green oasis'),
  ((SELECT id FROM cities WHERE name='New York' LIMIT 1), 'Statue of Liberty', 'sightseeing', 2400, 3, 'Ferry to Liberty and Ellis Islands')
ON CONFLICT DO NOTHING;
`;

async function seed(): Promise<void> {
  logger.info('🌱 Starting database seed...');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(SEED_CITIES);
    logger.info('✅ Cities seeded (30 cities)');
    await client.query(SEED_ACTIVITIES);
    logger.info('✅ Activities seeded (25 activities)');
    await client.query('COMMIT');
    logger.info('🎉 Seed complete');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Seed failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('Seed error:', err);
    process.exit(1);
  });
