-- Change extras.price from integer to numeric to support decimal prices
-- Safe to re-run.
alter table extras
  alter column price type numeric using price::numeric;
