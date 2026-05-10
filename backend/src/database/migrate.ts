import { pool } from '../config/database';
import { logger } from '../config/logger';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

interface MigrationModule {
  up: string;
  down?: string;
}

async function getExecutedMigrations(): Promise<string[]> {
  try {
    const result = await pool.query<{ name: string }>(
      'SELECT name FROM _migrations ORDER BY executed_at ASC'
    );
    return result.rows.map((r) => r.name);
  } catch {
    return [];
  }
}

async function runMigrations(): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.ts') || f.endsWith('.js'))
    .sort();

  const executed = await getExecutedMigrations();

  for (const file of files) {
    const migrationName = path.basename(file, path.extname(file));

    if (executed.includes(migrationName)) {
      logger.info(`⏭️  Skipping (already run): ${migrationName}`);
      continue;
    }

    logger.info(`🔄 Running migration: ${migrationName}`);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const migration: MigrationModule = require(path.join(migrationsDir, file));

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(migration.up);
      await client.query(
        'INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [migrationName]
      );
      await client.query('COMMIT');
      logger.info(`✅ Completed: ${migrationName}`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`❌ Failed: ${migrationName}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  logger.info('🎉 All migrations complete');
}

// Run if called directly
runMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('Migration failed:', err);
    process.exit(1);
  });
