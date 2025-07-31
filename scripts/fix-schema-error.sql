-- Script de correction pour l'erreur user_sessions
-- Exécutez ce script dans votre éditeur SQL Supabase

-- Créer la table user_sessions manquante
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Activer RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour user_sessions
CREATE POLICY "Allow all access to authenticated users" ON user_sessions FOR ALL USING (auth.uid() IS NOT NULL);