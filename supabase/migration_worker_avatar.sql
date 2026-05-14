-- Add avatar_url to worker_profiles
ALTER TABLE worker_profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
