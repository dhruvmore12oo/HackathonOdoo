import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),

  // Database
  DATABASE_URL: z.string().url().startsWith('postgresql://'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Security
  BCRYPT_SALT_ROUNDS: z.coerce.number().min(10).max(15).default(12),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3001'),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),

  // GeoDB Cities API (RapidAPI)
  GEODB_API_KEY: z.string().default(''),
  GEODB_BASE_URL: z.string().default('https://wft-geo-db.p.rapidapi.com/v1/geo'),
  GEODB_HOST: z.string().default('wft-geo-db.p.rapidapi.com'),

  // Unsplash API
  UNSPLASH_ACCESS_KEY: z.string().default(''),
  UNSPLASH_BASE_URL: z.string().default('https://api.unsplash.com'),

  // OpenTripMap API (optional, richer global place suggestions)
  OPENTRIPMAP_API_KEY: z.string().default(''),
  OPENTRIPMAP_BASE_URL: z.string().default('https://api.opentripmap.com/0.1/en/places'),

  // File Uploads
  MAX_FILE_SIZE_MB: z.coerce.number().default(5),
  UPLOAD_DIR: z.string().default('./uploads'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(5),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  return parsed.data;
}

export const env = validateEnv();
