-- =====================================================
-- VÉRIFICATION DES UTILISATEURS CRÉÉS
-- =====================================================

-- 1. Compter les utilisateurs
SELECT 
    'COMPTAGE' as type,
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM auth.users WHERE email LIKE '%@test.local') as test_users;

-- 2. Lister tous les profils
SELECT 
    email,
    full_name,
    role,
    created_at
FROM profiles
ORDER BY role, email;

-- 3. Vérifier la cohérence auth.users ↔ profiles
SELECT 
    'COHÉRENCE' as check_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM profiles) 
        THEN '✅ COHÉRENT'
        ELSE '❌ INCOHÉRENT'
    END as status,
    (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM profiles) as difference;

-- 4. Utilisateurs sans profil (problème potentiel)
SELECT 
    'UTILISATEURS SANS PROFIL' as issue,
    u.email,
    u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 5. Profils sans utilisateur (problème potentiel)  
SELECT 
    'PROFILS SANS UTILISATEUR' as issue,
    p.email,
    p.full_name
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;