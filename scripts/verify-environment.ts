#!/usr/bin/env tsx
/**
 * Script de vérification d'environnement
 * Utilise vos scripts SQL existants pour vérifier la cohérence
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

async function verifyEnvironment(env: 'test' | 'dev' | 'prod' = 'test') {
  console.log(`🔍 VÉRIFICATION DE L'ENVIRONNEMENT ${env.toUpperCase()}`)
  console.log('=' .repeat(50))

  // Charger la configuration de l'environnement
  const envFile = `.env.${env === 'dev' ? 'development' : env}`
  
  if (!require('fs').existsSync(envFile)) {
    console.log(`❌ Fichier ${envFile} non trouvé`)
    return
  }

  config({ path: resolve(process.cwd(), envFile) })
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Variables d\'environnement Supabase manquantes')
    return
  }

  const client = createClient(supabaseUrl, supabaseKey)

  // 1. Vérification des tables principales (équivalent à quick-table-counts.sql)
  console.log('\n📊 COMPTAGE DES TABLES PRINCIPALES')
  console.log('-' .repeat(40))

  const mainTables = [
    'profiles', 'lofts', 'loft_owners', 'transactions', 
    'tasks', 'teams', 'notifications', 'messages',
    'currencies', 'categories', 'zone_areas', 'payment_methods'
  ]

  const tableCounts: any = {}
  
  for (const table of mainTables) {
    try {
      const { data, error, count } = await client
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`❌ ${table}: Erreur - ${error.message}`)
        tableCounts[table] = 'ERROR'
      } else {
        console.log(`📋 ${table}: ${count || 0} enregistrements`)
        tableCounts[table] = count || 0
      }
    } catch (error) {
      console.log(`❌ ${table}: Exception - ${error}`)
      tableCounts[table] = 'ERROR'
    }
  }

  // 2. Vérification spécifique des colonnes TV (équivalent à verify-tv-columns.sql)
  console.log('\n📺 VÉRIFICATION DES COLONNES TV')
  console.log('-' .repeat(40))

  try {
    const { data: loftSample } = await client
      .from('lofts')
      .select('frequence_paiement_tv, prochaine_echeance_tv')
      .limit(1)

    if (loftSample && loftSample.length > 0) {
      const hasTVFreq = loftSample[0].hasOwnProperty('frequence_paiement_tv')
      const hasTVDate = loftSample[0].hasOwnProperty('prochaine_echeance_tv')
      
      console.log(`${hasTVFreq ? '✅' : '❌'} frequence_paiement_tv: ${hasTVFreq ? 'Présente' : 'Manquante'}`)
      console.log(`${hasTVDate ? '✅' : '❌'} prochaine_echeance_tv: ${hasTVDate ? 'Présente' : 'Manquante'}`)
      
      if (hasTVFreq && hasTVDate) {
        console.log('🎉 Colonnes TV correctement configurées!')
      }
    } else {
      console.log('⚠️ Aucun loft trouvé pour vérifier les colonnes TV')
    }
  } catch (error) {
    console.log('❌ Erreur lors de la vérification des colonnes TV:', error)
  }

  // 3. Vérification de la cohérence utilisateurs (équivalent à verify-users-creation.sql)
  console.log('\n👥 VÉRIFICATION DES UTILISATEURS')
  console.log('-' .repeat(40))

  try {
    const profilesCount = tableCounts['profiles']
    
    if (profilesCount === 0) {
      console.log('❌ Aucun profil utilisateur trouvé')
      console.log('💡 Exécutez: npm run clone:prod-to-test pour créer des utilisateurs de test')
    } else if (profilesCount > 0) {
      // Vérifier les utilisateurs de test
      const { data: testUsers } = await client
        .from('profiles')
        .select('email, full_name, role')
        .like('email', '%@test.local')

      if (testUsers && testUsers.length > 0) {
        console.log('✅ Utilisateurs de test trouvés:')
        testUsers.forEach(user => {
          console.log(`   • ${user.email} (${user.role})`)
        })
      } else {
        console.log('⚠️ Aucun utilisateur de test trouvé')
        console.log('💡 Les utilisateurs de test sont créés automatiquement lors du clonage')
      }
    }
  } catch (error) {
    console.log('❌ Erreur lors de la vérification des utilisateurs:', error)
  }

  // 4. Résumé final (équivalent à final-verification.sql)
  console.log('\n🎯 RÉSUMÉ FINAL')
  console.log('-' .repeat(40))

  const criticalTables = ['profiles', 'lofts', 'loft_owners']
  const allCriticalOK = criticalTables.every(table => 
    tableCounts[table] && tableCounts[table] !== 'ERROR' && tableCounts[table] > 0
  )

  if (allCriticalOK) {
    console.log('🎉 ENVIRONNEMENT PRÊT POUR LE DÉVELOPPEMENT')
    console.log(`✅ ${Object.values(tableCounts).filter(c => c > 0).length} tables avec données`)
    console.log('✅ Tables critiques présentes')
    
    if (env === 'test') {
      console.log('🔐 Connexion de test disponible: admin@test.local / test123')
    }
  } else {
    console.log('⚠️ CONFIGURATION INCOMPLÈTE')
    console.log('❌ Certaines tables critiques sont vides ou en erreur')
    console.log('💡 Exécutez un clonage: npm run clone:prod-to-' + env)
  }

  console.log('\n📋 Détail des tables:')
  Object.entries(tableCounts).forEach(([table, count]) => {
    const icon = count === 'ERROR' ? '❌' : count > 0 ? '✅' : '⚠️'
    console.log(`${icon} ${table}: ${count}`)
  })
}

// Interface en ligne de commande
const env = process.argv[2] as 'test' | 'dev' | 'prod' || 'test'

if (!['test', 'dev', 'prod'].includes(env)) {
  console.log('❌ Environnement non valide. Utilisez: test, dev, ou prod')
  process.exit(1)
}

verifyEnvironment(env).catch(console.error)