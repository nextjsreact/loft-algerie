-- =====================================================
-- DIAGNOSTIC: VÉRIFICATION DE LA SYNCHRONISATION DES PROFILS
-- =====================================================

-- Vérifier les utilisateurs sans profil
SELECT 
  'Utilisateurs sans profil:' as diagnostic,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Lister les utilisateurs sans profil
SELECT 
  au.id,
  au.email,
  au.created_at,
  'MANQUE PROFIL' as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Vérifier les profils orphelins (sans utilisateur auth)
SELECT 
  'Profils orphelins:' as diagnostic,
  COUNT(*) as count
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL;

-- Vérifier si les triggers existent
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name IN ('on_auth_user_created', 'on_auth_user_deleted');

-- Statistiques générales
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.profiles p ON au.id = p.id WHERE p.id IS NULL) as users_without_profile;