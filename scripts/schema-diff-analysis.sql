-- =====================================================
-- ANALYSE DES DIFFÉRENCES DE SCHÉMAS
-- =====================================================
-- Scripts pour identifier les différences spécifiques

-- 4. LISTER LES INDEX
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY schemaname, tablename, indexname;

-- 5. LISTER LES CONTRAINTES
SELECT 
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    rc.referenced_table_name,
    rc.referenced_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY tc.table_schema, tc.table_name, tc.constraint_type;

-- 6. LISTER LES TRIGGERS
SELECT 
    event_object_schema,
    event_object_table,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY event_object_schema, event_object_table, trigger_name;