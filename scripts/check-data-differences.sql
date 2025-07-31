-- =====================================================
-- VÉRIFICATION DES DONNÉES ENTRE PROD ET TEST
-- =====================================================
-- Scripts pour comparer les données, pas seulement la structure

-- 1. Compter les enregistrements dans les tables principales
SELECT 'profiles' as table_name, COUNT(*) as record_count FROM profiles
UNION ALL
SELECT 'lofts' as table_name, COUNT(*) as record_count FROM lofts
UNION ALL
SELECT 'users' as table_name, COUNT(*) as record_count FROM auth.users
UNION ALL
SELECT 'transactions' as table_name, COUNT(*) as record_count FROM transactions
UNION ALL
SELECT 'tasks' as table_name, COUNT(*) as record_count FROM tasks
UNION ALL
SELECT 'teams' as table_name, COUNT(*) as record_count FROM teams
UNION ALL
SELECT 'notifications' as table_name, COUNT(*) as record_count FROM notifications
ORDER BY table_name;

-- 2. Vérifier spécifiquement la table profiles
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'member' THEN 1 END) as member_count
FROM profiles;

-- 3. Vérifier les données récentes (derniers 30 jours)
SELECT 
    'profiles' as table_name,
    COUNT(*) as recent_records
FROM profiles 
WHERE created_at >= NOW() - INTERVAL '30 days'
UNION ALL
SELECT 
    'lofts' as table_name,
    COUNT(*) as recent_records
FROM lofts 
WHERE created_at >= NOW() - INTERVAL '30 days'
UNION ALL
SELECT 
    'transactions' as table_name,
    COUNT(*) as recent_records
FROM transactions 
WHERE created_at >= NOW() - INTERVAL '30 days';

-- 4. Vérifier les tables de configuration
SELECT 'currencies' as table_name, COUNT(*) as record_count FROM currencies
UNION ALL
SELECT 'categories' as table_name, COUNT(*) as record_count FROM categories
UNION ALL
SELECT 'zone_areas' as table_name, COUNT(*) as record_count FROM zone_areas
UNION ALL
SELECT 'payment_methods' as table_name, COUNT(*) as record_count FROM payment_methods;