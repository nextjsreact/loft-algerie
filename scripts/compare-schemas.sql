-- =====================================================
-- COMPARAISON DES SCHÉMAS PROD vs TEST
-- =====================================================
-- Ce script génère des requêtes pour comparer les schémas

-- 1. LISTER TOUTES LES TABLES
-- Exécutez cette requête sur PROD et TEST séparément
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY schemaname, tablename;

-- 2. COMPTER LES TABLES PAR SCHÉMA
SELECT 
    schemaname,
    COUNT(*) as nombre_tables
FROM pg_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
GROUP BY schemaname
ORDER BY schemaname;

-- 3. LISTER LES COLONNES DE TOUTES LES TABLES
SELECT 
    t.table_schema,
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    c.character_maximum_length
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY t.table_schema, t.table_name, c.ordinal_position;