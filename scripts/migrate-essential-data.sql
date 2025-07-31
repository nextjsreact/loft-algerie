-- =====================================================
-- MIGRATION DES DONNÉES ESSENTIELLES VERS TEST
-- =====================================================
-- À exécuter après avoir exporté depuis PROD

-- 1. DONNÉES DE CONFIGURATION (à copier en premier)
-- Currencies
INSERT INTO currencies (id, code, name, symbol, is_default, ratio, created_at)
SELECT id, code, name, symbol, is_default, ratio, created_at 
FROM prod_currencies_export;

-- Categories  
INSERT INTO categories (id, name, description, type, created_at)
SELECT id, name, description, type, created_at
FROM prod_categories_export;

-- Zone Areas
INSERT INTO zone_areas (id, name, description, created_at)
SELECT id, name, description, created_at
FROM prod_zone_areas_export;

-- 2. DONNÉES DE BASE
-- Loft Owners (anonymisés)
INSERT INTO loft_owners (id, name, email, phone, address, ownership_type, created_at, updated_at)
SELECT 
    id, 
    'Test Owner ' || ROW_NUMBER() OVER(), -- Anonymiser le nom
    'test' || ROW_NUMBER() OVER() || '@example.com', -- Email de test
    NULL, -- Supprimer le téléphone
    'Test Address', -- Adresse générique
    ownership_type,
    created_at,
    updated_at
FROM prod_loft_owners_export;

-- Lofts (avec données anonymisées)
INSERT INTO lofts (id, name, description, address, price_per_month, status, owner_id, 
                   company_percentage, owner_percentage, zone_area_id, created_at, updated_at)
SELECT 
    id,
    'Test Loft ' || ROW_NUMBER() OVER(),
    'Description de test',
    'Adresse de test ' || ROW_NUMBER() OVER(),
    price_per_month,
    status,
    owner_id,
    company_percentage,
    owner_percentage,
    zone_area_id,
    created_at,
    updated_at
FROM prod_lofts_export;

-- 3. UTILISATEURS DE TEST (créer de nouveaux, ne pas copier les vrais)
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'admin@test.com', 'Admin Test', 'admin', NOW(), NOW()),
    (gen_random_uuid(), 'user@test.com', 'User Test', 'member', NOW(), NOW()),
    (gen_random_uuid(), 'manager@test.com', 'Manager Test', 'manager', NOW(), NOW());

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Migration des données essentielles terminée!';
  RAISE NOTICE 'Vérifiez les comptages avec check-data-differences.sql';
END $$;