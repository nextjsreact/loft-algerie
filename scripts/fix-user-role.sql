-- =====================================================
-- CORRECTION DU RÔLE UTILISATEUR
-- =====================================================

-- Vérifier les utilisateurs actuels et leurs rôles
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  au.email as auth_email,
  au.raw_user_meta_data->>'role' as metadata_role
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id;

-- Mettre à jour le rôle de l'utilisateur spécifique (remplacez l'email)
UPDATE public.profiles 
SET role = 'admin'
WHERE email = 'habib_fr2001@yahoo.fr';

-- Vérifier la mise à jour
SELECT 
  email,
  full_name,
  role,
  'Rôle mis à jour avec succès!' as status
FROM public.profiles 
WHERE email = 'habib_fr2001@yahoo.fr';

-- Optionnel : Mettre à jour aussi les métadonnées utilisateur pour cohérence
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'habib_fr2001@yahoo.fr';