#!/usr/bin/env tsx
/**
 * Script de test des mots de passe anonymisés
 * Vérifie que tous les utilisateurs peuvent se connecter avec le mot de passe universel
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function testPasswords(env: 'test' | 'dev' = 'test') {
  console.log(`🔐 TEST DES MOTS DE PASSE - ${env.toUpperCase()}`)
  console.log('=' .repeat(50))

  // Charger la configuration
  const envFile = `.env.${env === 'dev' ? 'development' : env}`
  config({ path: resolve(process.cwd(), envFile) })
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const client = createClient(supabaseUrl, supabaseKey)

  const expectedPassword = env === 'test' ? 'test123' : 'dev123'
  
  try {
    // Récupérer tous les utilisateurs
    const { data: users, error } = await client
      .from('users')
      .select('id, email, encrypted_password')
      .limit(10) // Limiter pour le test

    if (error) {
      console.log('❌ Erreur récupération utilisateurs:', error.message)
      return
    }

    if (!users || users.length === 0) {
      console.log('⚠️ Aucun utilisateur trouvé')
      return
    }

    console.log(`👥 ${users.length} utilisateurs trouvés`)
    console.log(`🔑 Mot de passe attendu: ${expectedPassword}`)
    console.log('')

    // Vérifier les mots de passe
    let successCount = 0
    let errorCount = 0

    for (const user of users) {
      try {
        // Tenter une connexion avec le mot de passe universel
        const { data: authData, error: authError } = await client.auth.signInWithPassword({
          email: user.email,
          password: expectedPassword
        })

        if (authError) {
          console.log(`❌ ${user.email}: ${authError.message}`)
          errorCount++
        } else {
          console.log(`✅ ${user.email}: Connexion réussie`)
          successCount++
          
          // Se déconnecter immédiatement
          await client.auth.signOut()
        }
      } catch (error) {
        console.log(`❌ ${user.email}: Erreur de test - ${error}`)
        errorCount++
      }
    }

    console.log('')
    console.log('📊 RÉSULTATS:')
    console.log(`✅ Connexions réussies: ${successCount}`)
    console.log(`❌ Connexions échouées: ${errorCount}`)
    console.log(`📈 Taux de réussite: ${Math.round((successCount / users.length) * 100)}%`)

    if (successCount === users.length) {
      console.log('🎉 PARFAIT! Tous les utilisateurs peuvent se connecter avec le mot de passe universel')
    } else if (successCount > 0) {
      console.log('⚠️ Certains utilisateurs ont des problèmes de connexion')
    } else {
      console.log('❌ PROBLÈME: Aucun utilisateur ne peut se connecter')
      console.log('💡 Vérifiez que le clonage avec anonymisation a bien fonctionné')
    }

  } catch (error) {
    console.log('💥 Erreur durant le test:', error)
  }
}

// Interface en ligne de commande
const env = process.argv[2] as 'test' | 'dev' || 'test'

if (!['test', 'dev'].includes(env)) {
  console.log('❌ Environnement non valide. Utilisez: test ou dev')
  process.exit(1)
}

testPasswords(env).catch(console.error)