-- =====================================================
-- SYNCHRONISATION AUTOMATIQUE DU SCHÉMA
-- Environnement: TEST
-- Généré le: 31/07/2025 09:20:00
-- =====================================================

BEGIN;

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
-- Colonnes ajoutées: 0
-- =====================================================
