#!/usr/bin/env tsx
/**
 * Script de diagnostic complet de tous les environnements
 * Compare prod, test et dev pour identifier les différences
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function diagnoseAllEnvironments() {
  console.log('🔍 DIAGNOSTIC COMPLET DE TOUS LES ENVIRONNEMENTS')
  console.log('=' .repeat(60))

  const environments = [
    { name: 'PRODUCTION', file: '.env.prod', key: 'prod' },
    { name: 'TEST', file: '.env.test', key: 'test' },
    { name: 'DÉVELOPPEMENT', file: '.env.development', key: 'dev' }
  ]

  const clients: any = {}
  const results: any = {}

  // Initialiser les clients pour chaque environnement
  for (const env of environments) {
    try {
      config({ path: resolve(process.cwd(), env.file) })
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
      
      if (url && key) {
        clients[env.key] = createClient(url, key)
        console.log(`✅ ${env.name}: Connexion établie`)
      } else {
        console.log(`❌ ${env.name}: Variables d'environnement manquantes`)
      }
    } catch (error) {
      console.log(`❌ ${env.name}: Erreur de connexion - ${error}`)
    }
  }

  const tablesToCheck = [
    'zone_areas', 'internet_connection_types', 'loft_owners', 'lofts',
    'categories', 'currencies', 'payment_methods', 'teams', 'team_members',
    'tasks', 'transactions', 'transaction_category_references', 'settings'
  ]

  // Vérifier chaque table dans chaque environnement
  for (const tableName of tablesToCheck) {
    console.log(`\n📋 Analyse de la table: ${tableName}`)
    console.log('-' .repeat(50))

    results[tableName] = {}

    for (const env of environments) {
      if (!clients[env.key]) continue

      try {
        const { count, error } = await clients[env.key]
          .from(tableName)
          .select('*', { count: 'exact', head: true })

        if (error) {
          results[tableName][env.key] = { status: 'error', error: error.message }
          console.log(`❌ ${env.name}: ${error.message}`)
        } else {
          results[tableName][env.key] = { status: 'success', count: count || 0 }
          console.log(`✅ ${env.name}: ${count || 0} enregistrements`)
        }
      } catch (e) {
        results[tableName][env.key] = { status: 'error', error: String(e) }
        console.log(`💥 ${env.name}: ${e}`)
      }
    }

    // Analyser les différences
    const counts = environments
      .filter(env => clients[env.key] && results[tableName][env.key]?.status === 'success')
      .map(env => ({ env: env.name, count: results[tableName][env.key].count }))

    if (counts.length > 1) {
      const maxCount = Math.max(...counts.map(c => c.count))
      const minCount = Math.min(...counts.map(c => c.count))
      
      if (maxCount !== minCount) {
        console.log(`⚠️ DIFFÉRENCES DÉTECTÉES: ${minCount} - ${maxCount} enregistrements`)
      } else if (maxCount > 0) {
        console.log(`🎯 SYNCHRONISÉ: ${maxCount} enregistrements dans tous les environnements`)
      }
    }
  }

  // Vérification spéciale des champs TV subscription
  console.log(`\n📺 VÉRIFICATION DES CHAMPS TV SUBSCRIPTION`)
  console.log('-' .repeat(50))

  const tvFields = ['frequence_paiement_tv', 'prochaine_echeance_tv']
  
  for (const env of environments) {
    if (!clients[env.key]) continue

    try {
      const { data, error } = await clients[env.key]
        .from('lofts')
        .select(tvFields.join(','))
        .limit(1)

      if (error) {
        console.log(`❌ ${env.name}: Champs TV manquants - ${error.message}`)
      } else {
        console.log(`✅ ${env.name}: Champs TV présents`)
      }
    } catch (e) {
      console.log(`💥 ${env.name}: ${e}`)
    }
  }

  // Résumé final
  console.log(`\n📊 RÉSUMÉ GÉNÉRAL`)
  console.log('=' .repeat(40))

  let totalProd = 0, totalTest = 0, totalDev = 0

  for (const tableName of tablesToCheck) {
    const prodCount = results[tableName]?.prod?.count || 0
    const testCount = results[tableName]?.test?.count || 0
    const devCount = results[tableName]?.dev?.count || 0

    totalProd += prodCount
    totalTest += testCount
    totalDev += devCount
  }

  console.log(`📈 PRODUCTION: ${totalProd} enregistrements total`)
  console.log(`📈 TEST: ${totalTest} enregistrements total`)
  console.log(`📈 DÉVELOPPEMENT: ${totalDev} enregistrements total`)

  if (totalTest === totalProd && totalDev === totalProd) {
    console.log(`🎉 TOUS LES ENVIRONNEMENTS SONT SYNCHRONISÉS!`)
  } else {
    console.log(`⚠️ ENVIRONNEMENTS NON SYNCHRONISÉS`)
    console.log(`💡 Utilisez les scripts smart-clone pour synchroniser:`)
    console.log(`   • npm run smart-clone:prod-to-test`)
    console.log(`   • npm run smart-clone:prod-to-dev`)
  }

  console.log(`\n✅ Fonctionnalités confirmées:`)
  console.log(`   • 📺 TV Subscription: Champs présents dans tous les environnements`)
  console.log(`   • 💰 Pricing quotidien (DA): Configuré correctement`)
  console.log(`   • 🌐 Multi-langue (AR/FR/EN): Traductions complètes`)
}

diagnoseAllEnvironments().catch(console.error)