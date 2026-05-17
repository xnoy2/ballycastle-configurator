-- Add build_date column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS build_date DATE;
