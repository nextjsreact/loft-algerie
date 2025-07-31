-- =====================================================
-- SYNCHRONISATION AUTOMATIQUE DU SCHÉMA
-- Environnement: TEST
-- Généré le: 31/07/2025 09:21:00
-- =====================================================

BEGIN;

-- Ajouter la colonne profiles.id
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id uuid NOT NULL;

-- Ajouter la colonne profiles.email
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text NOT NULL;

-- Ajouter la colonne profiles.full_name
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name text NOT NULL;

-- Ajouter la colonne profiles.role
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL;

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

-- Ajouter la colonne profiles.created_at
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL;

-- Ajouter la colonne profiles.updated_at
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL;

-- Ajouter la colonne profiles.airbnb_access_token
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS airbnb_access_token text;

-- Ajouter la colonne profiles.airbnb_refresh_token
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS airbnb_refresh_token text;

-- Ajouter la colonne profiles.avatar_url
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Ajouter la colonne zone_areas.id
ALTER TABLE zone_areas ADD COLUMN IF NOT EXISTS id uuid NOT NULL;

-- Ajouter la colonne zone_areas.name
ALTER TABLE zone_areas ADD COLUMN IF NOT EXISTS name text NOT NULL;

-- Ajouter la colonne zone_areas.created_at
ALTER TABLE zone_areas ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL;

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

-- Ajouter la colonne lofts.id
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS id uuid NOT NULL;

-- Ajouter la colonne lofts.name
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS name text NOT NULL;

-- Ajouter la colonne lofts.description
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS description text NOT NULL;

-- Ajouter la colonne lofts.address
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS address text NOT NULL;

-- Ajouter la colonne lofts.price_per_month
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS price_per_month integer NOT NULL;

-- Ajouter la colonne lofts.status
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS status text NOT NULL;

-- Ajouter la colonne lofts.owner_id
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS owner_id uuid NOT NULL;

-- Ajouter la colonne lofts.company_percentage
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS company_percentage integer NOT NULL;

-- Ajouter la colonne lofts.owner_percentage
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS owner_percentage integer NOT NULL;

-- Ajouter la colonne lofts.created_at
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL;

-- Ajouter la colonne lofts.updated_at
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL;

-- Ajouter la colonne lofts.zone_area_id
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS zone_area_id uuid NOT NULL;

-- Ajouter la colonne lofts.airbnb_listing_id
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS airbnb_listing_id text;

-- Ajouter la colonne lofts.internet_connection_type_id
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS internet_connection_type_id uuid NOT NULL;

-- Ajouter la colonne lofts.water_customer_code
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS water_customer_code text;

-- Ajouter la colonne lofts.water_contract_code
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS water_contract_code text;

-- Ajouter la colonne lofts.water_meter_number
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS water_meter_number text;

-- Ajouter la colonne lofts.water_correspondent
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS water_correspondent text;

-- Ajouter la colonne lofts.electricity_pdl_ref
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS electricity_pdl_ref text;

-- Ajouter la colonne lofts.electricity_customer_number
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS electricity_customer_number text;

-- Ajouter la colonne lofts.electricity_meter_number
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS electricity_meter_number text;

-- Ajouter la colonne lofts.electricity_correspondent
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS electricity_correspondent text;

-- Ajouter la colonne lofts.gas_pdl_ref
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS gas_pdl_ref text;

-- Ajouter la colonne lofts.gas_customer_number
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS gas_customer_number text;

-- Ajouter la colonne lofts.gas_meter_number
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS gas_meter_number text;

-- Ajouter la colonne lofts.gas_correspondent
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS gas_correspondent text;

-- Ajouter la colonne lofts.phone_number
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS phone_number text;

-- Ajouter la colonne lofts.frequence_paiement_eau
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_eau text;

-- Ajouter la colonne lofts.prochaine_echeance_eau
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_eau text;

-- Ajouter la colonne lofts.frequence_paiement_energie
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_energie text;

-- Ajouter la colonne lofts.prochaine_echeance_energie
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_energie text;

-- Ajouter la colonne lofts.frequence_paiement_telephone
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_telephone text;

-- Ajouter la colonne lofts.prochaine_echeance_telephone
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_telephone text;

-- Ajouter la colonne lofts.frequence_paiement_internet
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_internet text;

-- Ajouter la colonne lofts.prochaine_echeance_internet
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_internet text;

-- Ajouter la colonne lofts.price_per_night
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS price_per_night text;

-- Ajouter la colonne lofts.frequence_paiement_tv
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_tv text NOT NULL;

-- Ajouter la colonne lofts.prochaine_echeance_tv
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_tv text NOT NULL;

-- Ajouter la colonne categories.id
ALTER TABLE categories ADD COLUMN IF NOT EXISTS id uuid NOT NULL;

-- Ajouter la colonne categories.name
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name text NOT NULL;

-- Ajouter la colonne categories.description
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description text NOT NULL;

-- Ajouter la colonne categories.type
ALTER TABLE categories ADD COLUMN IF NOT EXISTS type text NOT NULL;

-- Ajouter la colonne categories.created_at
ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL;

-- Ajouter la colonne categories.updated_at
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL;

-- Ajouter la colonne currencies.id
ALTER TABLE currencies ADD COLUMN IF NOT EXISTS id uuid NOT NULL;

-- Ajouter la colonne currencies.code
ALTER TABLE currencies ADD COLUMN IF NOT EXISTS code text NOT NULL;

-- Ajouter la colonne currencies.name
ALTER TABLE currencies ADD COLUMN IF NOT EXISTS name text NOT NULL;

-- Ajouter la colonne currencies.symbol
ALTER TABLE currencies ADD COLUMN IF NOT EXISTS symbol text NOT NULL;

-- Ajouter la colonne currencies.decimal_digits
ALTER TABLE currencies ADD COLUMN IF NOT EXISTS decimal_digits integer NOT NULL;

-- Ajouter la colonne currencies.is_default
ALTER TABLE currencies ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL;

-- Ajouter la colonne currencies.created_at
ALTER TABLE currencies ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL;

-- Ajouter la colonne currencies.updated_at
ALTER TABLE currencies ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL;

-- Ajouter la colonne currencies.ratio
ALTER TABLE currencies ADD COLUMN IF NOT EXISTS ratio numeric NOT NULL;

-- Ajouter la colonne payment_methods.id
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS id uuid NOT NULL;

-- Ajouter la colonne payment_methods.name
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS name text NOT NULL;

-- Ajouter la colonne payment_methods.type
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS type text NOT NULL;

-- Ajouter la colonne payment_methods.details
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS details text;

-- Ajouter la colonne payment_methods.created_at
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL;

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

-- Ajouter la colonne tasks.id
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS id uuid NOT NULL;

-- Ajouter la colonne tasks.title
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title text NOT NULL;

-- Ajouter la colonne tasks.description
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description text NOT NULL;

-- Ajouter la colonne tasks.status
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status text NOT NULL;

-- Ajouter la colonne tasks.due_date
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date timestamp with time zone NOT NULL;

-- Ajouter la colonne tasks.assigned_to
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to uuid NOT NULL;

-- Ajouter la colonne tasks.team_id
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS team_id text;

-- Ajouter la colonne tasks.loft_id
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS loft_id text;

-- Ajouter la colonne tasks.created_by
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by text;

-- Ajouter la colonne tasks.created_at
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL;

-- Ajouter la colonne tasks.updated_at
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL;

-- Ajouter la colonne tasks.amount
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS amount integer NOT NULL;

-- Ajouter la colonne tasks.currency
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS currency text NOT NULL;

-- Ajouter la colonne notifications.id
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS id uuid NOT NULL;

-- Ajouter la colonne notifications.user_id
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL;

-- Ajouter la colonne notifications.title
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title text NOT NULL;

-- Ajouter la colonne notifications.message
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message text NOT NULL;

-- Ajouter la colonne notifications.is_read
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL;

-- Ajouter la colonne notifications.created_at
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL;

-- Ajouter la colonne notifications.link
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link text;

-- Ajouter la colonne notifications.sender_id
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sender_id text;

-- Ajouter la colonne notifications.type
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type text NOT NULL;

-- Ajouter la colonne conversations.id
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS id uuid NOT NULL;

-- Ajouter la colonne conversations.name
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS name text;

-- Ajouter la colonne conversations.type
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS type text NOT NULL;

-- Ajouter la colonne conversations.created_at
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL;

-- Ajouter la colonne conversations.updated_at
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL;

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

-- Ajouter la colonne messages.id
ALTER TABLE messages ADD COLUMN IF NOT EXISTS id uuid NOT NULL;

-- Ajouter la colonne messages.conversation_id
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id uuid NOT NULL;

-- Ajouter la colonne messages.sender_id
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_id uuid NOT NULL;

-- Ajouter la colonne messages.content
ALTER TABLE messages ADD COLUMN IF NOT EXISTS content text NOT NULL;

-- Ajouter la colonne messages.message_type
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type text NOT NULL;

-- Ajouter la colonne messages.created_at
ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL;

-- Ajouter la colonne messages.updated_at
ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at text;

-- Ajouter la colonne messages.edited
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited boolean NOT NULL;

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
-- Colonnes ajoutées: 131
-- =====================================================
