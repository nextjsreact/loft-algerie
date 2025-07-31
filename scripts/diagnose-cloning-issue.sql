-- =====================================================
-- DIAGNOSTIC DU PROBLÈME DE CLONAGE
-- =====================================================
-- Identifier exactement ce qui manque dans TEST

-- 1. DIAGNOSTIC RAPIDE - Tables vides vs pleines
SELECT 
    schemaname,
    relname as tablename,
    n_tup_ins as total_inserts,
    n_tup_upd as total_updates,
    n_tup_del as total_deletes,
    n_live_tup as current_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY current_rows DESC;

-- 2. FOCUS SUR LES TABLES CRITIQUES
-- Exécutez ceci sur PROD et TEST pour comparer
SELECT 
    'CRITICAL_TABLES_COUNT' as check_type,
    json_build_object(
        'profiles', (SELECT COUNT(*) FROM profiles),
        'lofts', (SELECT COUNT(*) FROM lofts),
        'users', (SELECT COUNT(*) FROM auth.users),
        'transactions', (SELECT COUNT(*) FROM transactions),
        'loft_owners', (SELECT COUNT(*) FROM loft_owners)
    ) as counts;

-- 3. VÉRIFIER LES SÉQUENCES (IDs auto-générés)
SELECT 
    schemaname,
    sequencename,
    last_value,
    start_value,
    increment_by,
    is_called
FROM pg_sequences 
WHERE schemaname IN ('public', 'auth')
ORDER BY schemaname, sequencename;

-- 4. VÉRIFIER LES CONTRAINTES ET INDEX
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'lofts', 'transactions')
ORDER BY tablename, indexname;