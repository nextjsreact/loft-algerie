-- =====================================================
-- LOFT MANAGEMENT SYSTEM - SCHEMA SUPABASE COMPATIBLE
-- =====================================================
-- Ce script est optimisé pour Supabase avec les permissions standard
-- =====================================================

-- =====================================================
-- 1. CUSTOM TYPES (ENUMS)
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'manager', 'member');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loft_status') THEN
        CREATE TYPE loft_status AS ENUM ('available', 'occupied', 'maintenance');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loft_ownership') THEN
        CREATE TYPE loft_ownership AS ENUM ('company', 'third_party');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'completed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
        CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed');
    END IF;
END$$;

-- =====================================================
-- 2. CORE TABLES
-- =====================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'member',
    avatar_url TEXT,
    airbnb_access_token TEXT,
    airbnb_refresh_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table for authentication
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Zone areas for geographical organization
CREATE TABLE IF NOT EXISTS zone_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Internet connection types
CREATE TABLE IF NOT EXISTS internet_connection_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    type TEXT,
    speed TEXT,
    provider TEXT,
    status TEXT,
    cost NUMERIC(10, 2),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loft owners
CREATE TABLE IF NOT EXISTS loft_owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    ownership_type loft_ownership NOT NULL DEFAULT 'third_party',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lofts table with utility billing fields
CREATE TABLE IF NOT EXISTS lofts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    price_per_month NUMERIC NOT NULL,
    status loft_status NOT NULL DEFAULT 'available',
    owner_id UUID REFERENCES loft_owners(id) ON DELETE CASCADE,
    company_percentage NUMERIC DEFAULT 50.00 NOT NULL,
    owner_percentage NUMERIC DEFAULT 50.00 NOT NULL,
    zone_area_id UUID REFERENCES zone_areas(id) ON DELETE SET NULL,
    internet_connection_type_id UUID REFERENCES internet_connection_types(id) ON DELETE SET NULL,
    airbnb_listing_id TEXT,
    
    -- Utility information
    water_customer_code TEXT,
    water_contract_code TEXT,
    water_meter_number TEXT,
    water_correspondent TEXT,
    electricity_pdl_ref TEXT,
    electricity_customer_number TEXT,
    electricity_meter_number TEXT,
    electricity_correspondent TEXT,
    gas_pdl_ref TEXT,
    gas_customer_number TEXT,
    gas_meter_number TEXT,
    gas_correspondent TEXT,
    phone_number TEXT,
    
    -- Bill frequency and due dates
    frequence_paiement_eau VARCHAR(20),
    prochaine_echeance_eau DATE,
    frequence_paiement_energie VARCHAR(20),
    prochaine_echeance_energie DATE,
    frequence_paiement_telephone VARCHAR(20),
    prochaine_echeance_telephone DATE,
    frequence_paiement_internet VARCHAR(20),
    prochaine_echeance_internet DATE,
    frequence_paiement_tv VARCHAR(20),
    prochaine_echeance_tv DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_percentage_split CHECK ((company_percentage + owner_percentage) = 100.00)
);

-- Categories for transactions
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    type VARCHAR(20) CHECK (type IN ('income', 'expense')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Currencies
CREATE TABLE IF NOT EXISTS currencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(10),
    is_default BOOLEAN DEFAULT FALSE,
    ratio DECIMAL(10,4) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status NOT NULL DEFAULT 'todo',
    due_date DATE,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    loft_id UUID REFERENCES lofts(id) ON DELETE SET NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount NUMERIC NOT NULL,
    description TEXT,
    transaction_type VARCHAR(50) NOT NULL,
    status transaction_status NOT NULL DEFAULT 'pending',
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    category VARCHAR(50),
    loft_id UUID REFERENCES lofts(id) ON DELETE SET NULL,
    currency_id UUID REFERENCES currencies(id),
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    ratio_at_transaction DECIMAL(18, 8),
    equivalent_amount_default_currency DECIMAL(18, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    link TEXT,
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction category references for amount alerts
CREATE TABLE IF NOT EXISTS transaction_category_references (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
    reference_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'DZD',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category, transaction_type)
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB
);

-- =====================================================
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_lofts_eau_due_date ON lofts(prochaine_echeance_eau) WHERE prochaine_echeance_eau IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lofts_energie_due_date ON lofts(prochaine_echeance_energie) WHERE prochaine_echeance_energie IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lofts_telephone_due_date ON lofts(prochaine_echeance_telephone) WHERE prochaine_echeance_telephone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lofts_internet_due_date ON lofts(prochaine_echeance_internet) WHERE prochaine_echeance_internet IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lofts_tv_due_date ON lofts(prochaine_echeance_tv) WHERE prochaine_echeance_tv IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transaction_category_references_category_type ON transaction_category_references(category, transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount) WHERE amount IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_type_amount ON transactions(transaction_type, amount) WHERE amount IS NOT NULL;
CREATE INDEX IF NOT EXISTS currencies_code_idx ON currencies (code);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- =====================================================
-- 4. ESSENTIAL FUNCTIONS (Supabase compatible)
-- =====================================================

-- Function to calculate next due date based on frequency
CREATE OR REPLACE FUNCTION calculate_next_due_date(due_date DATE, frequency TEXT)
RETURNS DATE AS $$
BEGIN
    CASE LOWER(frequency)
        WHEN 'monthly', 'mensuel' THEN RETURN due_date + INTERVAL '1 month';
        WHEN 'quarterly', 'trimestriel' THEN RETURN due_date + INTERVAL '3 months';
        WHEN 'semi-annual', 'semestriel' THEN RETURN due_date + INTERVAL '6 months';
        WHEN 'annual', 'annuel' THEN RETURN due_date + INTERVAL '1 year';
        WHEN 'bi-monthly', 'bimestriel' THEN RETURN due_date + INTERVAL '2 months';
        ELSE RETURN due_date + INTERVAL '1 month';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to get upcoming bill due dates
CREATE OR REPLACE FUNCTION get_upcoming_bills(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE(
    loft_id UUID, loft_name VARCHAR(255), owner_id UUID, utility_type VARCHAR(50),
    due_date DATE, frequency VARCHAR(50), days_until_due INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH bill_data AS (
        SELECT l.id as loft_id, l.name as loft_name, l.owner_id,
               'eau'::VARCHAR(50) as utility_type, l.prochaine_echeance_eau as due_date, l.frequence_paiement_eau as frequency
        FROM lofts l WHERE l.prochaine_echeance_eau IS NOT NULL AND l.frequence_paiement_eau IS NOT NULL
          AND l.prochaine_echeance_eau <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
        UNION ALL
        SELECT l.id, l.name, l.owner_id, 'energie'::VARCHAR(50), l.prochaine_echeance_energie, l.frequence_paiement_energie
        FROM lofts l WHERE l.prochaine_echeance_energie IS NOT NULL AND l.frequence_paiement_energie IS NOT NULL
          AND l.prochaine_echeance_energie <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
        UNION ALL
        SELECT l.id, l.name, l.owner_id, 'telephone'::VARCHAR(50), l.prochaine_echeance_telephone, l.frequence_paiement_telephone
        FROM lofts l WHERE l.prochaine_echeance_telephone IS NOT NULL AND l.frequence_paiement_telephone IS NOT NULL
          AND l.prochaine_echeance_telephone <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
        UNION ALL
        SELECT l.id, l.name, l.owner_id, 'internet'::VARCHAR(50), l.prochaine_echeance_internet, l.frequence_paiement_internet
        FROM lofts l WHERE l.prochaine_echeance_internet IS NOT NULL AND l.frequence_paiement_internet IS NOT NULL
          AND l.prochaine_echeance_internet <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
        UNION ALL
        SELECT l.id, l.name, l.owner_id, 'tv'::VARCHAR(50), l.prochaine_echeance_tv, l.frequence_paiement_tv
        FROM lofts l WHERE l.prochaine_echeance_tv IS NOT NULL AND l.frequence_paiement_tv IS NOT NULL
          AND l.prochaine_echeance_tv <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
    )
    SELECT bd.loft_id, bd.loft_name, bd.owner_id, bd.utility_type, bd.due_date, bd.frequency,
           (bd.due_date - CURRENT_DATE)::INTEGER as days_until_due
    FROM bill_data bd ORDER BY bd.due_date ASC, bd.loft_name ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) - Supabase compatible
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lofts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE loft_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE internet_connection_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_category_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies for authenticated users
CREATE POLICY "Enable all for authenticated users" ON profiles FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Enable all for authenticated users" ON user_sessions FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Enable all for authenticated users" ON lofts FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Enable all for authenticated users" ON transactions FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Enable all for authenticated users" ON tasks FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Enable all for authenticated users" ON loft_owners FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Enable all for authenticated users" ON categories FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Enable all for authenticated users" ON currencies FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Enable all for authenticated users" ON teams FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Enable all for authenticated users" ON team_members FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Enable all for authenticated users" ON zone_areas FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Enable all for authenticated users" ON internet_connection_types FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Enable all for authenticated users" ON payment_methods FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Enable all for authenticated users" ON transaction_category_references FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Enable all for authenticated users" ON settings FOR ALL USING (auth.uid() IS NOT NULL);

-- Specific RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Allow authenticated users to insert notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- ==
===================================================
-- 6. TRIGGERS POUR SYNCHRONISATION AUTOMATIQUE
-- =====================================================

-- Fonction pour créer automatiquement un profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'member'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger pour synchroniser automatiquement
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction pour nettoyer les profils orphelins
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour supprimer le profil quand l'utilisateur est supprimé
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();-- ==
===================================================
-- 7. TABLES DE CONVERSATIONS
-- =====================================================

-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    type VARCHAR(50) DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des participants aux conversations
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(conversation_id, user_id)
);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances des conversations
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- RLS pour les conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les conversations
CREATE POLICY "Users can view conversations they participate in" ON conversations
FOR SELECT USING (
  id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create conversations" ON conversations
FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view their own participations" ON conversation_participants
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can join conversations" ON conversation_participants
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation" ON conversation_participants
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view messages in their conversations" ON messages
FOR SELECT USING (
  conversation_id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to their conversations" ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  conversation_id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);