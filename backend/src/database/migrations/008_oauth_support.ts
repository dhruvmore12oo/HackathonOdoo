export const up = `
ALTER TABLE users 
  ALTER COLUMN password_hash DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) NOT NULL DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255);
`;

export const down = `
ALTER TABLE users 
  DROP COLUMN IF NOT EXISTS auth_provider,
  DROP COLUMN IF NOT EXISTS provider_id,
  ALTER COLUMN password_hash SET NOT NULL;
`;
