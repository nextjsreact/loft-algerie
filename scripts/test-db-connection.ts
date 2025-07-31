#!/usr/bin/env tsx
/**
 * TEST DE CONNEXION DATABASE
 * Teste la connectivité aux bases de données Supabase
 */

import { execSync } from 'child_process'
import { createClient } from '@supabase/supabase-js'

async function testSupabaseConnection() {
  console.log('🔍 TEST DE CONNEXION SUPABASE API')
  console.log('='.repeat(40))

  try {
    // Test PROD connection via Supabase client
    const prodClient = createClient(
      'https://mhngbluefyucoesgcjoy.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1obmdibHVlZnl1Y29lc2djam95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjEzMTcyMiwiZXhwIjoyMDYxNzA3NzIyfQ.GWP_COePfH8YlwuEX7zRc55U5p4XSlCJE5hJehGIurw'
    )

    const { data: prodData, error: prodError } = await prodClient
      .from('profiles')
      .select('count')
      .limit(1)

    if (prodError) {
      console.log('❌ PROD Supabase API: Erreur -', prodError.message)
    } else {
      console.log('✅ PROD Supabase API: Connexion réussie')
    }

    // Test TEST connection via Supabase client
    const testClient = createClient(
      'https://sxphlwvjxzxvbdzriziy.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhsd3ZqeHp4dmJkenJpeml5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTg2MTQxNSwiZXhwIjoyMDYxNDM3NDE1fQ.B1LD46b9U1Ai_1mlNJ-Q7JR7Ny6awL_QT9-9koMcIi4'
    )

    const { data: testData, error: testError } = await testClient
      .from('profiles')
      .select('count')
      .limit(1)

    if (testError) {
      console.log('❌ TEST Supabase API: Erreur -', testError.message)
    } else {
      console.log('✅ TEST Supabase API: Connexion réussie')
    }

  } catch (error) {
    console.log('❌ Erreur générale:', error)
  }
}

function testDNSResolution() {
  console.log('\n🌐 TEST DE RÉSOLUTION DNS')
  console.log('='.repeat(30))

  const hosts = [
    'db.mhngbluefyucoesgcjoy.supabase.co',
    'db.sxphlwvjxzxvbdzriziy.supabase.co'
  ]

  for (const host of hosts) {
    try {
      console.log(`🔍 Test DNS pour ${host}...`)
      execSync(`nslookup ${host}`, { stdio: 'pipe' })
      console.log(`✅ ${host}: Résolution DNS réussie`)
    } catch (error) {
      console.log(`❌ ${host}: Échec de résolution DNS`)
    }
  }
}

function testPing() {
  console.log('\n🏓 TEST DE PING')
  console.log('='.repeat(20))

  const hosts = [
    'mhngbluefyucoesgcjoy.supabase.co',
    'sxphlwvjxzxvbdzriziy.supabase.co'
  ]

  for (const host of hosts) {
    try {
      console.log(`🔍 Ping vers ${host}...`)
      execSync(`ping -n 1 ${host}`, { stdio: 'pipe' })
      console.log(`✅ ${host}: Ping réussi`)
    } catch (error) {
      console.log(`❌ ${host}: Ping échoué`)
    }
  }
}

function suggestAlternatives() {
  console.log('\n🔧 SOLUTIONS ALTERNATIVES')
  console.log('='.repeat(30))
  console.log('')
  console.log('1. 🌐 UTILISER SUPABASE CLI AVEC DB-URL:')
  console.log('   npx supabase db dump --db-url "postgresql://postgres:Canada!2025Mosta@db.mhngbluefyucoesgcjoy.supabase.co:5432/postgres" -f prod_backup.sql')
  console.log('')
  console.log('2. 📊 EXPORT VIA SUPABASE DASHBOARD:')
  console.log('   • Aller sur https://supabase.com/dashboard/project/mhngbluefyucoesgcjoy')
  console.log('   • Settings → Database → Database backups')
  console.log('   • Télécharger le backup')
  console.log('')
  console.log('3. 🔄 UTILISER NOTRE SCRIPT DE SYNCHRONISATION:')
  console.log('   • Continuer avec les scripts existants')
  console.log('   • Synchroniser table par table')
  console.log('')
  console.log('4. 🛠️ ENCODER LE MOT DE PASSE:')
  console.log('   • Remplacer ! par %21 dans l\'URL')
  console.log('   • Canada!2025Mosta → Canada%212025Mosta')
}

async function main() {
  console.log('🔍 DIAGNOSTIC DE CONNEXION DATABASE')
  console.log('='.repeat(50))

  await testSupabaseConnection()
  testDNSResolution()
  testPing()
  suggestAlternatives()

  console.log('\n📋 RÉSUMÉ:')
  console.log('Si les connexions Supabase API fonctionnent mais pas pg_dump,')
  console.log('le problème est probablement lié au DNS ou au firewall.')
  console.log('Essayez les solutions alternatives ci-dessus.')
}

main().catch(console.error)