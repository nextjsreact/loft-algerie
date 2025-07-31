-- =====================================================
-- VÉRIFICATION DES COLONNES TV
-- =====================================================
-- Exécutez cette requête sur PROD et TEST pour comparer

-- 1. Vérifier si les colonnes TV existent
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lofts' 
AND table_schema = 'public'
AND column_name LIKE '%tv%'
ORDER BY column_name;

-- 2. Vérifier toutes les colonnes de paiement/échéance
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'lofts' 
AND table_schema = 'public'
AND (column_name LIKE '%paiement%' OR column_name LIKE '%echeance%')
ORDER BY column_name;

-- 3. Compter le nombre total de colonnes dans lofts
SELECT COUNT(*) as total_colonnes_lofts
FROM information_schema.columns 
WHERE table_name = 'lofts' 
AND table_schema = 'public';

-- 4. Lister toutes les colonnes de la table lofts
SELECT 
    ordinal_position,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'lofts' 
AND table_schema = 'public'
ORDER BY ordinal_position;