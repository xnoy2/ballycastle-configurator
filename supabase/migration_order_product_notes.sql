-- Add product order, notes, and birthday booking fields to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS product_order TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS is_birthday_booking BOOLEAN NOT NULL DEFAULT FALSE;
