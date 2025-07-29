-- Add price_per_night column to lofts table for reservations system
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS price_per_night DECIMAL(10,2);

-- Set a default value based on price_per_month (rough estimate: monthly/30)
UPDATE lofts 
SET price_per_night = ROUND(price_per_month / 30, 2) 
WHERE price_per_night IS NULL;

-- Add a constraint to ensure price_per_night is positive
ALTER TABLE lofts ADD CONSTRAINT positive_price_per_night CHECK (price_per_night >= 0);