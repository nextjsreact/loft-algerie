-- =====================================================
-- VÉRIFICATION FINALE DE L'ENVIRONNEMENT TEST
-- =====================================================

-- Résumé complet
SELECT 
    'RÉSUMÉ FINAL' as info,
    (SELECT COUNT(*) FROM profiles) as profiles,
    (SELECT COUNT(*) FROM lofts) as lofts,
    (SELECT COUNT(*) FROM auth.users) as users,
    (SELECT COUNT(*) FROM transactions) as transactions;

-- Vérifier les colonnes TV dans lofts
SELECT 
    'COLONNES TV' as verification,
    COUNT(*) as colonnes_tv_presentes
FROM information_schema.columns 
WHERE table_name = 'lofts' 
AND column_name IN ('frequence_paiement_tv', 'prochaine_echeance_tv');

-- Status global
SELECT 
    'STATUS ENVIRONNEMENT TEST' as status,
    CASE 
        WHEN (SELECT COUNT(*) FROM profiles) > 0 
         AND (SELECT COUNT(*) FROM auth.users) > 0
         AND (SELECT COUNT(*) FROM lofts) > 0
        THEN '🎉 PRÊT POUR LE DÉVELOPPEMENT'
        ELSE '⚠️ CONFIGURATION INCOMPLÈTE'
    END as message;