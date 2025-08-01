-- =====================================================
-- SYNCHRONISATION AUTOMATIQUE DU SCHÉMA
-- Environnement: DEV
-- Généré le: 31/07/2025 22:00:33
-- =====================================================

BEGIN;

-- Ajouter la colonne profiles.password_hash
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash text;

-- Ajouter la colonne profiles.email_verified
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL;

-- Ajouter la colonne profiles.reset_token
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reset_token text;

-- Ajouter la colonne profiles.reset_token_expires
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reset_token_expires text;

-- Ajouter la colonne profiles.last_login
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login text;

-- Ajouter la colonne zone_areas.updated_at
ALTER TABLE zone_areas ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL;

-- Ajouter la colonne internet_connection_types.id
ALTER TABLE internet_connection_types ADD COLUMN IF NOT EXISTS id uuid NOT NULL;

-- Ajouter la colonne internet_connection_types.type
ALTER TABLE internet_connection_types ADD COLUMN IF NOT EXISTS type text NOT NULL;

-- Ajouter la colonne internet_connection_types.speed
ALTER TABLE internet_connection_types ADD COLUMN IF NOT EXISTS speed text NOT NULL;

-- Ajouter la colonne internet_connection_types.provider
ALTER TABLE internet_connection_types ADD COLUMN IF NOT EXISTS provider text NOT NULL;

-- Ajouter la colonne internet_connection_types.status
ALTER TABLE internet_connection_types ADD COLUMN IF NOT EXISTS status text NOT NULL;

-- Ajouter la colonne internet_connection_types.cost
ALTER TABLE internet_connection_types ADD COLUMN IF NOT EXISTS cost integer NOT NULL;

-- Ajouter la colonne internet_connection_types.created_at
ALTER TABLE internet_connection_types ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL;

-- Ajouter la colonne categories.updated_at
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL;

-- Ajouter la colonne currencies.decimal_digits
ALTER TABLE currencies ADD COLUMN IF NOT EXISTS decimal_digits integer NOT NULL;

-- Ajouter la colonne currencies.updated_at
ALTER TABLE currencies ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL;

-- Ajouter la colonne payment_methods.updated_at
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL;

-- Ajouter la colonne teams.id
ALTER TABLE teams ADD COLUMN IF NOT EXISTS id uuid NOT NULL;

-- Ajouter la colonne teams.name
ALTER TABLE teams ADD COLUMN IF NOT EXISTS name text NOT NULL;

-- Ajouter la colonne teams.description
ALTER TABLE teams ADD COLUMN IF NOT EXISTS description text NOT NULL;

-- Ajouter la colonne teams.created_by
ALTER TABLE teams ADD COLUMN IF NOT EXISTS created_by uuid NOT NULL;

-- Ajouter la colonne teams.created_at
ALTER TABLE teams ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL;

-- Ajouter la colonne teams.updated_at
ALTER TABLE teams ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL;

-- Ajouter la colonne tasks.amount
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS amount integer NOT NULL;

-- Ajouter la colonne tasks.currency
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS currency text NOT NULL;

-- Ajouter la colonne conversations.name
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS name text;

-- Ajouter la colonne conversation_participants.id
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS id uuid NOT NULL;

-- Ajouter la colonne conversation_participants.conversation_id
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS conversation_id uuid NOT NULL;

-- Ajouter la colonne conversation_participants.user_id
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL;

-- Ajouter la colonne conversation_participants.joined_at
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS joined_at timestamp with time zone NOT NULL;

-- Ajouter la colonne conversation_participants.last_read_at
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS last_read_at text;

-- Ajouter la colonne conversation_participants.role
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS role text NOT NULL;

-- Permissions et RLS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to authenticated users" ON profiles FOR ALL USING (auth.uid() IS NOT NULL);
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to authenticated users" ON user_sessions FOR ALL USING (auth.uid() IS NOT NULL);
ALTER TABLE zone_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to authenticated users" ON zone_areas FOR ALL USING (auth.uid() IS NOT NULL);
ALTER TABLE internet_connection_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to authenticated users" ON internet_connection_types FOR ALL USING (auth.uid() IS NOT NULL);
ALTER TABLE loft_owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to authenticated users" ON loft_owners FOR ALL USING (auth.uid() IS NOT NULL);
ALTER TABLE lofts ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to authenticated users" ON lofts FOR ALL USING (auth.uid() IS NOT NULL);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to authenticated users" ON categories FOR ALL USING (auth.uid() IS NOT NULL);
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to authenticated users" ON currencies FOR ALL USING (auth.uid() IS NOT NULL);
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to authenticated users" ON payment_methods FOR ALL USING (auth.uid() IS NOT NULL);
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to authenticated users" ON teams FOR ALL USING (auth.uid() IS NOT NULL);
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to authenticated users" ON team_members FOR ALL USING (auth.uid() IS NOT NULL);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to authenticated users" ON tasks FOR ALL USING (auth.uid() IS NOT NULL);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to authenticated users" ON transactions FOR ALL USING (auth.uid() IS NOT NULL);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to authenticated users" ON notifications FOR ALL USING (auth.uid() IS NOT NULL);
ALTER TABLE transaction_category_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to authenticated users" ON transaction_category_references FOR ALL USING (auth.uid() IS NOT NULL);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to authenticated users" ON settings FOR ALL USING (auth.uid() IS NOT NULL);
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to authenticated users" ON conversations FOR ALL USING (auth.uid() IS NOT NULL);
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to authenticated users" ON conversation_participants FOR ALL USING (auth.uid() IS NOT NULL);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to authenticated users" ON messages FOR ALL USING (auth.uid() IS NOT NULL);

COMMIT;

-- =====================================================
-- RÉSUMÉ DE LA SYNCHRONISATION
-- =====================================================
-- Tables créées: 0
-- Colonnes ajoutées: 32
-- =====================================================
