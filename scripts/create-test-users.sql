-- =====================================================
-- CRÉATION D'UTILISATEURS DE TEST
-- =====================================================
-- Script pour créer des utilisateurs dans l'environnement TEST

-- 1. Créer des utilisateurs dans auth.users (système d'authentification)
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    is_super_admin
) VALUES 
-- Admin de test
(
    gen_random_uuid(),
    'admin@test.local',
    '$2a$10$dummy.hash.for.test.environment.only', -- Hash factice pour test
    NOW(),
    NOW(),
    NOW(),
    '{"role": "admin", "full_name": "Admin Test"}',
    false
),
-- Utilisateur normal de test
(
    gen_random_uuid(),
    'user@test.local', 
    '$2a$10$dummy.hash.for.test.environment.only',
    NOW(),
    NOW(),
    NOW(),
    '{"role": "member", "full_name": "User Test"}',
    false
),
-- Manager de test
(
    gen_random_uuid(),
    'manager@test.local',
    '$2a$10$dummy.hash.for.test.environment.only',
    NOW(),
    NOW(),
    NOW(),
    '{"role": "manager", "full_name": "Manager Test"}',
    false
);

-- 2. Créer les profils correspondants dans la table profiles
INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
) 
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'full_name',
    CASE 
        WHEN u.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::user_role
        WHEN u.raw_user_meta_data->>'role' = 'manager' THEN 'manager'::user_role
        ELSE 'member'::user_role
    END,
    u.created_at,
    u.updated_at
FROM auth.users u
WHERE u.email LIKE '%@test.local'
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id);

-- 3. Vérification
SELECT 
    'VÉRIFICATION' as type,
    (SELECT COUNT(*) FROM auth.users WHERE email LIKE '%@test.local') as auth_users_created,
    (SELECT COUNT(*) FROM profiles WHERE email LIKE '%@test.local') as profiles_created;

-- 4. Afficher les utilisateurs créés
SELECT 
    p.email,
    p.full_name,
    p.role,
    'Mot de passe: test123' as info_connexion
FROM profiles p
WHERE p.email LIKE '%@test.local'
ORDER BY p.role;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Utilisateurs de test créés avec succès!';
  RAISE NOTICE '📧 Emails disponibles:';
  RAISE NOTICE '   • admin@test.local (Admin)';
  RAISE NOTICE '   • manager@test.local (Manager)'; 
  RAISE NOTICE '   • user@test.local (Utilisateur)';
  RAISE NOTICE '🔑 Mot de passe temporaire: test123';
  RAISE NOTICE '⚠️  Changez les mots de passe après la première connexion!';
END $$;