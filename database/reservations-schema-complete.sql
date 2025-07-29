-- Reservations System Database Schema
-- This extends the existing Loft Algérie database with reservation functionality

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Guest Information
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(50) NOT NULL,
    guest_nationality VARCHAR(100) NOT NULL,
    guest_count INTEGER NOT NULL DEFAULT 1,
    
    -- Reservation Details
    loft_id UUID NOT NULL REFERENCES lofts(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    nights INTEGER GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
    
    -- Pricing
    base_price DECIMAL(10,2) NOT NULL,
    cleaning_fee DECIMAL(10,2) DEFAULT 0,
    service_fee DECIMAL(10,2) DEFAULT 0,
    taxes DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Status and Timestamps
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    
    -- Special Requests
    special_requests TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (check_out_date > check_in_date),
    CONSTRAINT positive_amounts CHECK (base_price >= 0 AND total_amount >= 0),
    CONSTRAINT valid_guest_count CHECK (guest_count > 0)
);

-- Create availability calendar table
CREATE TABLE IF NOT EXISTS loft_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loft_id UUID NOT NULL REFERENCES lofts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    blocked_reason VARCHAR(100), -- 'maintenance', 'personal_use', 'booked', etc.
    price_override DECIMAL(10,2), -- Override base price for specific dates
    minimum_stay INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(loft_id, date)
);

-- Create pricing rules table
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loft_id UUID NOT NULL REFERENCES lofts(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('seasonal', 'weekend', 'holiday', 'event', 'length_of_stay')),
    
    -- Date range (optional for some rule types)
    start_date DATE,
    end_date DATE,
    
    -- Days of week (for weekend rules)
    days_of_week INTEGER[], -- Array of integers 0-6 (Sunday-Saturday)
    
    -- Minimum stay requirements
    minimum_nights INTEGER,
    
    -- Pricing adjustments
    adjustment_type VARCHAR(20) NOT NULL CHECK (adjustment_type IN ('percentage', 'fixed_amount')),
    adjustment_value DECIMAL(10,2) NOT NULL,
    
    -- Priority for overlapping rules
    priority INTEGER NOT NULL DEFAULT 0,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS reservation_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'DZD',
    payment_method VARCHAR(50) NOT NULL, -- 'card', 'bank_transfer', 'cash', etc.
    
    -- Payment processor info
    transaction_id VARCHAR(255),
    processor_response TEXT,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Refund info
    refund_amount DECIMAL(10,2) DEFAULT 0,
    refund_reason TEXT,
    refunded_at TIMESTAMP WITH TIME ZONE
);

-- Create guest communications table
CREATE TABLE IF NOT EXISTS guest_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    
    -- Message details
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('guest', 'owner', 'system')),
    sender_id UUID, -- References users table for guest/owner, NULL for system
    message_type VARCHAR(30) NOT NULL CHECK (message_type IN ('booking_confirmation', 'check_in_instructions', 'general_inquiry', 'support_request', 'review_request')),
    
    subject VARCHAR(255),
    message TEXT NOT NULL,
    
    -- Status
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_automated BOOLEAN NOT NULL DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reservation_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    
    -- Review details
    reviewer_type VARCHAR(10) NOT NULL CHECK (reviewer_type IN ('guest', 'owner')),
    reviewer_id UUID NOT NULL, -- References users table
    
    -- Ratings (1-5 scale)
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    cleanliness_rating INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    location_rating INTEGER CHECK (location_rating BETWEEN 1 AND 5),
    value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),
    
    -- Written review
    review_text TEXT,
    
    -- Status
    is_public BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(reservation_id, reviewer_type) -- One review per reservation per reviewer type
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reservations_loft_id ON reservations(loft_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_guest_email ON reservations(guest_email);

CREATE INDEX IF NOT EXISTS idx_loft_availability_loft_date ON loft_availability(loft_id, date);
CREATE INDEX IF NOT EXISTS idx_loft_availability_date ON loft_availability(date);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_loft_id ON pricing_rules(loft_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_dates ON pricing_rules(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_payments_reservation_id ON reservation_payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON reservation_payments(status);

CREATE INDEX IF NOT EXISTS idx_communications_reservation_id ON guest_communications(reservation_id);
CREATE INDEX IF NOT EXISTS idx_communications_unread ON guest_communications(is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_reviews_reservation_id ON reservation_reviews(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reviews_public ON reservation_reviews(is_public) WHERE is_public = true;

-- Create functions for availability checking
CREATE OR REPLACE FUNCTION check_loft_availability(
    p_loft_id UUID,
    p_check_in DATE,
    p_check_out DATE
) RETURNS BOOLEAN AS $$
DECLARE
    unavailable_count INTEGER;
BEGIN
    -- Check if any dates in the range are unavailable
    SELECT COUNT(*)
    INTO unavailable_count
    FROM loft_availability
    WHERE loft_id = p_loft_id
    AND date >= p_check_in
    AND date < p_check_out
    AND is_available = false;
    
    -- Also check for existing confirmed reservations
    SELECT COUNT(*) + unavailable_count
    INTO unavailable_count
    FROM reservations
    WHERE loft_id = p_loft_id
    AND status IN ('confirmed', 'pending')
    AND (
        (check_in_date <= p_check_in AND check_out_date > p_check_in) OR
        (check_in_date < p_check_out AND check_out_date >= p_check_out) OR
        (check_in_date >= p_check_in AND check_out_date <= p_check_out)
    );
    
    RETURN unavailable_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate pricing
CREATE OR REPLACE FUNCTION calculate_reservation_price(
    p_loft_id UUID,
    p_check_in DATE,
    p_check_out DATE,
    p_guest_count INTEGER DEFAULT 1
) RETURNS TABLE(
    base_price DECIMAL(10,2),
    cleaning_fee DECIMAL(10,2),
    service_fee DECIMAL(10,2),
    taxes DECIMAL(10,2),
    total_amount DECIMAL(10,2)
) AS $$
DECLARE
    nights INTEGER;
    daily_rate DECIMAL(10,2);
    calculated_base DECIMAL(10,2) := 0;
    calculated_cleaning DECIMAL(10,2) := 0;
    calculated_service DECIMAL(10,2) := 0;
    calculated_taxes DECIMAL(10,2) := 0;
    current_date DATE;
BEGIN
    nights := p_check_out - p_check_in;
    
    -- Get base daily rate from loft
    SELECT COALESCE(price_per_night, 0) INTO daily_rate
    FROM lofts WHERE id = p_loft_id;
    
    -- Calculate base price for each night (considering pricing rules and overrides)
    FOR current_date IN SELECT generate_series(p_check_in, p_check_out - INTERVAL '1 day', INTERVAL '1 day')::DATE
    LOOP
        -- Check for price override first
        SELECT COALESCE(price_override, daily_rate) INTO daily_rate
        FROM loft_availability
        WHERE loft_id = p_loft_id AND date = current_date;
        
        -- Apply pricing rules (simplified - would need more complex logic for real implementation)
        calculated_base := calculated_base + daily_rate;
    END LOOP;
    
    -- Calculate fees (simplified - would be configurable)
    calculated_cleaning := CASE WHEN nights >= 7 THEN 50.00 ELSE 30.00 END;
    calculated_service := calculated_base * 0.05; -- 5% service fee
    calculated_taxes := (calculated_base + calculated_service) * 0.19; -- 19% tax
    
    RETURN QUERY SELECT 
        calculated_base,
        calculated_cleaning,
        calculated_service,
        calculated_taxes,
        calculated_base + calculated_cleaning + calculated_service + calculated_taxes;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update availability when reservation is confirmed
CREATE OR REPLACE FUNCTION update_availability_on_reservation() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        -- Block dates for confirmed reservation
        INSERT INTO loft_availability (loft_id, date, is_available, blocked_reason)
        SELECT NEW.loft_id, generate_series(NEW.check_in_date, NEW.check_out_date - INTERVAL '1 day', INTERVAL '1 day')::DATE, false, 'booked'
        ON CONFLICT (loft_id, date) DO UPDATE SET 
            is_available = false, 
            blocked_reason = 'booked';
    ELSIF NEW.status IN ('cancelled', 'completed') AND OLD.status = 'confirmed' THEN
        -- Free up dates when reservation is cancelled or completed
        DELETE FROM loft_availability 
        WHERE loft_id = NEW.loft_id 
        AND date >= NEW.check_in_date 
        AND date < NEW.check_out_date 
        AND blocked_reason = 'booked';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservation_availability_trigger
    AFTER INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_availability_on_reservation();

-- Enable RLS on tables (policies will be added later based on your auth setup)
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE loft_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_reviews ENABLE ROW LEVEL SECURITY;

-- Temporary permissive policies for development (REMOVE IN PRODUCTION)
-- These allow all operations for testing - replace with proper auth-based policies later
CREATE POLICY "Allow all for development" ON reservations FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON loft_availability FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON pricing_rules FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON reservation_payments FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON guest_communications FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON reservation_reviews FOR ALL USING (true);