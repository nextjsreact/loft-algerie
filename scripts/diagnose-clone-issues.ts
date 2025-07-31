#!/usr/bin/env tsx
/**
 * Diagnostic des problèmes de clonage
 * Identifie les différences de schéma entre PROD et TEST
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

async function diagnoseCloneIssues() {
  console.log('🔍 DIAGNOSTIC DES PROBLÈMES DE CLONAGE')
  console.log('=' .repeat(50))

  // Charger les environnements
  const loadEnvironment = async (env: string) => {
    const envFile = `.env.${env === 'dev' ? 'development' : env}`
    const envContent = readFileSync(envFile, 'utf8')
    const envVars: any = {}
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim()
      }
    })
    return envVars
  }

  const prodEnv = await loadEnvironment('prod')
  const testEnv = await loadEnvironment('test')

  const prodClient = createClient(prodEnv.NEXT_PUBLIC_SUPABASE_URL, prodEnv.SUPABASE_SERVICE_ROLE_KEY)
  const testClient = createClient(testEnv.NEXT_PUBLIC_SUPABASE_URL, testEnv.SUPABASE_SERVICE_ROLE_KEY)

  // Tables problématiques identifiées
  const problematicTables = [
    'currencies', 'categories', 'zone_areas', 'internet_connection_types',
    'payment_methods', 'lofts', 'teams', 'tasks', 'profiles', 'messages'
  ]

  for (const tableName of problematicTables) {
    console.log(`\n📋 DIAGNOSTIC: ${tableName}`)
    console.log('-' .repeat(40))

    try {
      // Récupérer un échantillon de PROD
      const { data: prodSample, error: prodError } = await prodClient
        .from(tableName)
        .select('*')
        .limit(1)

      if (prodError) {
        console.log(`❌ PROD: ${prodError.message}`)
        continue
      }

      // Récupérer un échantillon de TEST
      const { data: testSample, error: testError } = await testClient
        .from(tableName)
        .select('*')
        .limit(1)

      if (testError) {
        console.log(`❌ TEST: ${testError.message}`)
        continue
      }

      // Comparer les colonnes
      const prodColumns = prodSample && prodSample.length > 0 ? Object.keys(prodSample[0]) : []
      const testColumns = testSample && testSample.length > 0 ? Object.keys(testSample[0]) : []

      console.log(`📊 PROD: ${prodColumns.length} colonnes`)
      console.log(`📊 TEST: ${testColumns.length} colonnes`)

      // Colonnes manquantes dans TEST
      const missingInTest = prodColumns.filter(col => !testColumns.includes(col))
      if (missingInTest.length > 0) {
        console.log(`❌ Manquantes dans TEST: ${missingInTest.join(', ')}`)
      }

      // Colonnes en plus dans TEST
      const extraInTest = testColumns.filter(col => !prodColumns.includes(col))
      if (extraInTest.length > 0) {
        console.log(`➕ En plus dans TEST: ${extraInTest.join(', ')}`)
      }

      if (missingInTest.length === 0 && extraInTest.length === 0) {
        console.log(`✅ Schémas identiques`)
      }

    } catch (error) {
      console.log(`💥 Erreur: ${error}`)
    }
  }

  // Vérifier auth.users spécifiquement
  console.log(`\n🔐 DIAGNOSTIC SPÉCIAL: auth.users`)
  console.log('-' .repeat(40))

  try {
    // Tester différents schémas pour auth.users
    const authSchemas = ['auth.users', 'public.users', 'users']
    
    for (const schema of authSchemas) {
      try {
        const { data, error } = await testClient
          .from(schema.replace('auth.', '').replace('public.', ''))
          .select('*')
          .limit(1)

        if (!error) {
          console.log(`✅ Trouvé: ${schema}`)
        }
      } catch (e) {
        // Ignorer les erreurs
      }
    }

    // Vérifier avec une requête SQL directe
    const { data: authCheck, error: authError } = await testClient
      .rpc('sql', { query: "SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%user%'" })

    if (!authError && authCheck) {
      console.log(`📋 Tables contenant 'user': ${JSON.stringify(authCheck)}`)
    }

  } catch (error) {
    console.log(`⚠️ Impossible de diagnostiquer auth.users`)
  }

  console.log(`\n💡 RECOMMANDATIONS:`)
  console.log(`1. Synchronisez les schémas entre PROD et TEST`)
  console.log(`2. Vérifiez les migrations manquantes`)
  console.log(`3. Utilisez le script smart-clone pour adaptation automatique`)
  console.log(`4. Vérifiez la configuration auth.users`)
}

diagnoseCloneIssues().catch(console.error)