-- =====================================================
-- SYNCHRONISATION COLONNE MANQUANTE
-- =====================================================
-- Script pour ajouter la colonne manquante dans TEST

-- Ajouter la colonne price_per_night manquante
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS price_per_night NUMERIC;

-- Ajouter un commentaire pour documenter
COMMENT ON COLUMN lofts.price_per_night IS 'Prix par nuit pour la location courte durée';

-- Vérification après ajout
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lofts' 
AND table_schema = 'public'
AND column_name = 'price_per_night';

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Colonne price_per_night ajoutée avec succès!';
  RAISE NOTICE 'Votre environnement TEST est maintenant synchronisé avec PROD';
END $$;