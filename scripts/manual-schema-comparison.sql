-- =====================================================
-- COMPARAISON MANUELLE RAPIDE
-- =====================================================
-- Exécutez ces requêtes sur PROD et TEST pour comparaison rapide

-- ÉTAPE 1: Nombre total de tables par environnement
SELECT 'TOTAL_TABLES' as metric, COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast');

-- ÉTAPE 2: Liste des tables principales (à exécuter sur les 2 environnements)
SELECT table_schema, table_name
FROM information_schema.tables 
WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY table_schema, table_name;

-- ÉTAPE 3: Vérification spécifique de la table lofts (pour votre script TV)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lofts'
ORDER BY ordinal_position;

-- ÉTAPE 4: Recherche de tables contenant 'tv' ou 'subscription'
SELECT table_schema, table_name
FROM information_schema.tables 
WHERE (table_name ILIKE '%tv%' OR table_name ILIKE '%subscription%' OR table_name ILIKE '%abonnement%')
AND table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast');

-- ÉTAPE 5: Vérification des colonnes TV récemment ajoutées
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE column_name ILIKE '%tv%' OR column_name ILIKE '%abonnement%'
ORDER BY table_name, column_name;