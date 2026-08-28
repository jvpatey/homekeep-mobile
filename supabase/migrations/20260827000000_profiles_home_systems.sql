ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS home_systems jsonb;
