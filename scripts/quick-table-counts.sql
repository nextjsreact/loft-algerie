-- =====================================================
-- COMPTAGE RAPIDE DES TABLES
-- =====================================================
-- Script simple pour comparer PROD vs TEST

-- Exécutez ceci sur PROD et TEST séparément

-- Tables principales
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'lofts', COUNT(*) FROM lofts  
UNION ALL
SELECT 'loft_owners', COUNT(*) FROM loft_owners
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'teams', COUNT(*) FROM teams
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'currencies', COUNT(*) FROM currencies
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'zone_areas', COUNT(*) FROM zone_areas
UNION ALL
SELECT 'payment_methods', COUNT(*) FROM payment_methods
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users
ORDER BY table_name;

-- Résumé global
SELECT 
    'RÉSUMÉ' as info,
    (SELECT COUNT(*) FROM profiles) as profiles,
    (SELECT COUNT(*) FROM lofts) as lofts,
    (SELECT COUNT(*) FROM auth.users) as users,
    (SELECT COUNT(*) FROM transactions) as transactions;