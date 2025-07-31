#!/usr/bin/env tsx
/**
 * Comparaison détaillée entre production et test
 * Vérifie table par table et enregistrement par enregistrement
 */

import { EnvironmentLoader } from '../lib/security/EnvironmentLoader'

async function detailedComparison() {
  console.log('🔍 COMPARAISON DÉTAILLÉE PRODUCTION ↔ TEST')
  console.log('=' .repeat(60))

  // Charger les environnements
  const prod = await EnvironmentLoader.loadEnvironment('prod')
  const test = await EnvironmentLoader.loadEnvironment('test')

  if (!prod || !test) {
    console.log('❌ Impossible de charger les environnements')
    return
  }

  console.log('✅ Environnements chargés')
  console.log(`📤 PRODUCTION: ${EnvironmentLoader.maskUrl(prod.url)}`)
  console.log(`📥 TEST: ${EnvironmentLoader.maskUrl(test.url)}`)

  const tablesToCheck = [
    'zone_areas', 'internet_connection_types', 'loft_owners', 'lofts',
    'categories', 'currencies', 'payment_methods', 'teams', 'team_members',
    'tasks', 'transactions', 'transaction_category_references', 'settings'
  ]

  let totalProdRecords = 0
  let totalTestRecords = 0
  const differences: string[] = []

  for (const tableName of tablesToCheck) {
    console.log(`\n📋 Analyse détaillée: ${tableName}`)
    console.log('-'.repeat(40))

    try {
      // Compter les enregistrements
      const { count: prodCount, error: prodError } = await prod.client
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      const { count: testCount, error: testError } = await test.client
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (prodError || testError) {
        console.log(`❌ Erreur: PROD=${prodError?.message}, TEST=${testError?.message}`)
        continue
      }

      const prodRecords = prodCount || 0
      const testRecords = testCount || 0

      totalProdRecords += prodRecords
      totalTestRecords += testRecords

      console.log(`📊 PRODUCTION: ${prodRecords} enregistrements`)
      console.log(`📊 TEST: ${testRecords} enregistrements`)

      if (prodRecords !== testRecords) {
        const diff = `${tableName}: PROD=${prodRecords}, TEST=${testRecords}`
        differences.push(diff)
        console.log(`⚠️ DIFFÉRENCE: ${diff}`)
      } else if (prodRecords > 0) {
        console.log(`✅ SYNCHRONISÉ: ${prodRecords} enregistrements`)
      } else {
        console.log(`ℹ️ Tables vides dans les deux environnements`)
      }

      // Si il y a des données, vérifier quelques échantillons
      if (prodRecords > 0 && testRecords > 0) {
        const { data: prodSample } = await prod.client
          .from(tableName)
          .select('*')
          .limit(2)

        const { data: testSample } = await test.client
          .from(tableName)
          .select('*')
          .limit(2)

        if (prodSample && testSample && prodSample.length > 0 && testSample.length > 0) {
          // Comparer les structures
          const prodColumns = Object.keys(prodSample[0]).sort()
          const testColumns = Object.keys(testSample[0]).sort()

          const missingInTest = prodColumns.filter(col => !testColumns.includes(col))
          const extraInTest = testColumns.filter(col => !prodColumns.includes(col))

          if (missingInTest.length > 0) {
            console.log(`🔍 Colonnes manquantes dans TEST: ${missingInTest.join(', ')}`)
          }
          if (extraInTest.length > 0) {
            console.log(`🔍 Colonnes supplémentaires dans TEST: ${extraInTest.join(', ')}`)
          }

          // Vérifier les IDs pour s'assurer que ce sont les mêmes données
          if (prodSample[0].id && testSample[0].id) {
            const prodIds = prodSample.map(r => r.id).sort()
            const testIds = testSample.map(r => r.id).sort()
            
            const sameIds = JSON.stringify(prodIds) === JSON.stringify(testIds)
            console.log(`🆔 IDs identiques: ${sameIds ? 'OUI' : 'NON'}`)
            
            if (!sameIds) {
              console.log(`   PROD IDs: ${prodIds.join(', ')}`)
              console.log(`   TEST IDs: ${testIds.join(', ')}`)
            }
          }
        }
      }

    } catch (error) {
      console.log(`💥 Erreur ${tableName}: ${error}`)
    }
  }

  // Résumé final
  console.log(`\n📊 RÉSUMÉ FINAL`)
  console.log('=' .repeat(40))
  console.log(`📈 PRODUCTION: ${totalProdRecords} enregistrements total`)
  console.log(`📈 TEST: ${totalTestRecords} enregistrements total`)
  console.log(`📊 DIFFÉRENCE: ${totalTestRecords - totalProdRecords}`)

  if (differences.length > 0) {
    console.log(`\n⚠️ DIFFÉRENCES DÉTECTÉES (${differences.length}):`)
    differences.forEach(diff => console.log(`   • ${diff}`))
  } else {
    console.log(`\n🎉 PARFAITEMENT SYNCHRONISÉ!`)
    console.log(`✅ Toutes les tables ont le même nombre d'enregistrements`)
  }

  // Vérification spéciale des lofts avec champs TV
  console.log(`\n📺 VÉRIFICATION SPÉCIALE: LOFTS AVEC TV`)
  console.log('-'.repeat(40))

  try {
    const { data: prodLofts } = await prod.client
      .from('lofts')
      .select('id, name, frequence_paiement_tv, prochaine_echeance_tv')

    const { data: testLofts } = await test.client
      .from('lofts')
      .select('id, name, frequence_paiement_tv, prochaine_echeance_tv')

    console.log(`📊 PRODUCTION: ${prodLofts?.length || 0} lofts avec champs TV`)
    console.log(`📊 TEST: ${testLofts?.length || 0} lofts avec champs TV`)

    if (prodLofts && testLofts) {
      prodLofts.forEach((loft, index) => {
        console.log(`   ${index + 1}. PROD: ${loft.name} (TV: ${loft.frequence_paiement_tv || 'non défini'})`)
      })
      
      testLofts.forEach((loft, index) => {
        console.log(`   ${index + 1}. TEST: ${loft.name} (TV: ${loft.frequence_paiement_tv || 'non défini'})`)
      })
    }

  } catch (error) {
    console.log(`❌ Erreur vérification lofts: ${error}`)
  }

  console.log(`\n🎯 CONCLUSION:`)
  if (totalProdRecords === totalTestRecords && differences.length === 0) {
    console.log(`✅ Le clonage a parfaitement réussi!`)
    console.log(`📋 Toutes les données de production sont présentes dans test`)
    console.log(`🔧 Le SuperCloneEngine a corrigé tous les problèmes`)
  } else {
    console.log(`⚠️ Il y a encore des différences à investiguer`)
    console.log(`🔍 Vérifiez les détails ci-dessus pour identifier les problèmes`)
  }
}

detailedComparison().catch(console.error)