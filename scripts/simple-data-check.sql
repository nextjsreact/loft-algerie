-- =====================================================
-- VÉRIFICATION SIMPLE DES DONNÉES
-- =====================================================
-- Version corrigée et simplifiée

-- 1. COMPTER LES ENREGISTREMENTS DANS LES TABLES PRINCIPALES
SELECT 'profiles' as table_name, COUNT(*) as record_count FROM profiles
UNION ALL
SELECT 'lofts', COUNT(*) FROM lofts
UNION ALL
SELECT 'loft_owners', COUNT(*) FROM loft_owners
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'currencies', COUNT(*) FROM currencies
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'zone_areas', COUNT(*) FROM zone_areas
UNION ALL
SELECT 'auth_users', COUNT(*) FROM auth.users
ORDER BY table_name;

-- 2. VÉRIFIER LES TABLES VIDES
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'profiles' THEN (SELECT COUNT(*) FROM profiles)
        WHEN table_name = 'lofts' THEN (SELECT COUNT(*) FROM lofts)
        WHEN table_name = 'transactions' THEN (SELECT COUNT(*) FROM transactions)
        WHEN table_name = 'loft_owners' THEN (SELECT COUNT(*) FROM loft_owners)
        ELSE 0
    END as row_count,
    CASE 
        WHEN (
            CASE 
                WHEN table_name = 'profiles' THEN (SELECT COUNT(*) FROM profiles)
                WHEN table_name = 'lofts' THEN (SELECT COUNT(*) FROM lofts)
                WHEN table_name = 'transactions' THEN (SELECT COUNT(*) FROM transactions)
                WHEN table_name = 'loft_owners' THEN (SELECT COUNT(*) FROM loft_owners)
                ELSE 0
            END
        ) = 0 THEN '❌ VIDE'
        ELSE '✅ CONTIENT DES DONNÉES'
    END as status
FROM (
    VALUES ('profiles'), ('lofts'), ('transactions'), ('loft_owners')
) AS t(table_name);

-- 3. DIAGNOSTIC RAPIDE
SELECT 
    'DIAGNOSTIC' as type,
    CASE 
        WHEN (SELECT COUNT(*) FROM profiles) = 0 THEN 'PROBLÈME: Table profiles vide'
        WHEN (SELECT COUNT(*) FROM lofts) = 0 THEN 'PROBLÈME: Table lofts vide'
        WHEN (SELECT COUNT(*) FROM auth.users) = 0 THEN 'PROBLÈME: Table users vide'
        ELSE 'OK: Tables contiennent des données'
    END as message;