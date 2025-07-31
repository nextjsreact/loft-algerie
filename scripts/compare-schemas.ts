#!/usr/bin/env tsx
/**
 * Script de comparaison détaillée des schémas prod vs test
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function compareSchemas() {
  console.log('🔍 COMPARAISON DÉTAILLÉE DES SCHÉMAS')
  console.log('=' .repeat(60))

  // Charger les environnements
  config({ path: resolve(process.cwd(), '.env.prod') })
  const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const prodClient = createClient(prodUrl, prodKey)

  config({ path: resolve(process.cwd(), '.env.test') })
  const testUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const testKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const testClient = createClient(testUrl, testKey)

  const tablesToCheck = ['zone_areas', 'lofts', 'categories', 'currencies', 'payment_methods', 'tasks', 'team_members']

  for (const tableName of tablesToCheck) {
    console.log(`\n📋 Analyse de la table: ${tableName}`)
    console.log('-'.repeat(40))

    try {
      // Récupérer un échantillon de chaque environnement
      const { data: prodData, error: prodError } = await prodClient
        .from(tableName)
        .select('*')
        .limit(1)

      const { data: testData, error: testError } = await testClient
        .from(tableName)
        .select('*')
        .limit(1)

      if (prodError) {
        console.log(`❌ PROD: ${prodError.message}`)
        continue
      }

      if (testError) {
        console.log(`❌ TEST: ${testError.message}`)
        continue
      }

      // Comparer les colonnes
      const prodColumns = prodData && prodData.length > 0 ? Object.keys(prodData[0]) : []
      const testColumns = testData && testData.length > 0 ? Object.keys(testData[0]) : []

      // Si pas de données, essayer de récupérer la structure autrement
      if (prodColumns.length === 0) {
        try {
          const { data: emptyProd } = await prodClient
            .from(tableName)
            .select('*')
            .limit(0)
          // Cette requête nous donnera la structure même sans données
        } catch (e) {
          console.log(`⚠️ PROD: Pas de données pour analyser la structure`)
        }
      }

      if (testColumns.length === 0) {
        try {
          const { data: emptyTest } = await testClient
            .from(tableName)
            .select('*')
            .limit(0)
        } catch (e) {
          console.log(`⚠️ TEST: Pas de données pour analyser la structure`)
        }
      }

      console.log(`📊 PROD: ${prodColumns.length} colonnes`)
      console.log(`📊 TEST: ${testColumns.length} colonnes`)

      // Colonnes manquantes dans TEST
      const missingInTest = prodColumns.filter(col => !testColumns.includes(col))
      if (missingInTest.length > 0) {
        console.log(`❌ Manquantes dans TEST: ${missingInTest.join(', ')}`)
      }

      // Colonnes manquantes dans PROD
      const missingInProd = testColumns.filter(col => !prodColumns.includes(col))
      if (missingInProd.length > 0) {
        console.log(`❌ Manquantes dans PROD: ${missingInProd.join(', ')}`)
      }

      if (missingInTest.length === 0 && missingInProd.length === 0) {
        console.log(`✅ Structures identiques`)
      }

    } catch (error) {
      console.log(`💥 Erreur: ${error}`)
    }
  }
}

compareSchemas()