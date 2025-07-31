-- =====================================================
-- SYNC TEST SCHEMA WITH PRODUCTION
-- =====================================================
-- Add missing columns that exist in production but not in test

-- Add updated_at to team_members if it doesn't exist
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add price_per_night to lofts if it doesn't exist  
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS price_per_night DECIMAL(10,2);

-- Add decimal_digits to currencies if it doesn't exist
ALTER TABLE currencies ADD COLUMN IF NOT EXISTS decimal_digits INTEGER DEFAULT 2;

-- Add updated_at to other tables that might be missing it
ALTER TABLE zone_areas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add triggers to automatically update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_zone_areas_updated_at ON zone_areas;
CREATE TRIGGER update_zone_areas_updated_at 
    BEFORE UPDATE ON zone_areas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at 
    BEFORE UPDATE ON payment_methods 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at 
    BEFORE UPDATE ON team_members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Schema synchronization completed!';
  RAISE NOTICE '• Added missing columns to test environment';
  RAISE NOTICE '• Created updated_at triggers';
  RAISE NOTICE '• Test environment now matches production schema';
END $$;