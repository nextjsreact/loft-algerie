-- =====================================================
-- AJOUT DES CHAMPS ABONNEMENT CHAÎNES TV - VERSION SIMPLE
-- =====================================================

-- Ajouter les colonnes pour l'abonnement TV dans la table lofts
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_tv VARCHAR(20);
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_tv DATE;

-- Créer un index pour les performances sur la date d'échéance TV
CREATE INDEX IF NOT EXISTS idx_lofts_tv_due_date ON lofts(prochaine_echeance_tv) WHERE prochaine_echeance_tv IS NOT NULL;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Champs abonnement TV ajoutés avec succès!';
  RAISE NOTICE 'frequence_paiement_tv: Fréquence de paiement';
  RAISE NOTICE 'prochaine_echeance_tv: Date de prochaine facture';
  RAISE NOTICE 'Index créé pour les performances';
END $$;