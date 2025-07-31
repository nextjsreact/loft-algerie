#!/usr/bin/env tsx
/**
 * Script pour corriger les tables de conversations manquantes
 * Vérifie et ajoute les tables nécessaires pour le système de conversations
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function fixConversationsTables() {
  console.log('💬 CORRECTION DES TABLES DE CONVERSATIONS')
  console.log('=' .repeat(50))

  // Charger les variables d'environnement
  config({ path: resolve(process.cwd(), '.env.local') })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Variables d\'environnement non configurées')
    console.log('💡 Vérifiez votre fichier .env.local')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Vérifier si les tables de conversations existent
    console.log('🔍 Vérification des tables de conversations...')
    
    const conversationsTables = ['conversations', 'conversation_participants', 'messages']
    const missingTables = []

    for (const table of conversationsTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1)
        
        if (error && error.message.includes('does not exist')) {
          missingTables.push(table)
          console.log(`❌ Table ${table} manquante`)
        } else {
          console.log(`✅ Table ${table} existe`)
        }
      } catch (e) {
        missingTables.push(table)
        console.log(`❌ Table ${table} manquante`)
      }
    }

    if (missingTables.length === 0) {
      console.log('\n🎉 Toutes les tables de conversations existent!')
      console.log('✅ Le système de conversations devrait fonctionner')
      return
    }

    console.log(`\n⚠️ ${missingTables.length} table(s) manquante(s) détectée(s)`)
    console.log('📝 Pour corriger le problème:')
    console.log('')
    console.log('1. Ouvrez votre dashboard Supabase')
    console.log('2. Allez dans "SQL Editor"')
    console.log('3. Copiez et exécutez le script suivant:')
    console.log('')
    console.log('-- SCRIPT DE CORRECTION DES TABLES DE CONVERSATIONS')
    console.log('-- Copiez ce script dans votre éditeur SQL Supabase')
    console.log('')
    console.log(`-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    type VARCHAR(50) DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des participants aux conversations
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(conversation_id, user_id)
);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- RLS pour les conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can view conversations they participate in" ON conversations
FOR SELECT USING (
  id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create conversations" ON conversations
FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view their own participations" ON conversation_participants
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can join conversations" ON conversation_participants
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation" ON conversation_participants
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view messages in their conversations" ON messages
FOR SELECT USING (
  conversation_id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to their conversations" ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  conversation_id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);`)

    console.log('')
    console.log('4. Après avoir exécuté le script, rafraîchissez votre application')
    console.log('5. L\'erreur "Failed to fetch" devrait disparaître')
    console.log('')
    console.log('💡 Alternative: Utilisez le schéma complet scripts/schema-supabase-safe.sql')
    console.log('   qui inclut déjà toutes les tables nécessaires')

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  }
}

fixConversationsTables()