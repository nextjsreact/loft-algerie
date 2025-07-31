#!/usr/bin/env tsx
/**
 * Test simple des données clonées
 */

import { createClient } from '@supabase/supabase-js'

async function testClonedData() {
  console.log('🔍 TEST DES DONNÉES CLONÉES DANS TEST')
  console.log('=' .repeat(50))

  // Utiliser les variables d'environnement TEST
  const supabaseUrl = 'https://sxphlwvjxzxvbdzriziy.supabase.co'
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhsd3ZqeHp4dmJkenJpeml5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTg2MTQxNSwiZXhwIjoyMDYxNDM3NDE1fQ.B1LD46b9U1Ai_1mlNJ-Q7JR7Ny6awL_QT9-9koMcIi4'
  
  const client = createClient(supabaseUrl, supabaseKey)

  // Tables à vérifier
  const tables = [
    'zone_areas', 'internet_connection_types', 'loft_owners', 
    'categories', 'currencies', 'payment_methods', 'lofts'
  ]

  console.log('📊 COMPTAGE DES DONNÉES CLONÉES:')
  console.log('-' .repeat(40))

  let totalRecords = 0

  for (const table of tables) {
    try {
      const { data, error, count } = await client
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        const recordCount = count || 0
        totalRecords += recordCount
        const icon = recordCount > 0 ? '✅' : '⚠️'
        console.log(`${icon} ${table}: ${recordCount} enregistrements`)
      }
    } catch (error) {
      console.log(`❌ ${table}: Erreur - ${error}`)
    }
  }

  console.log('')
  console.log(`📈 TOTAL: ${totalRecords} enregistrements clonés`)

  // Test spécifique des colonnes TV
  console.log('')
  console.log('📺 VÉRIFICATION DES COLONNES TV:')
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
    } else {
      console.log('⚠️ Aucun loft trouvé pour vérifier les colonnes TV')
    }
  } catch (error) {
    console.log('❌ Erreur vérification colonnes TV:', error)
  }

  // Résumé final
  console.log('')
  console.log('🎯 RÉSUMÉ:')
  console.log('-' .repeat(40))
  
  if (totalRecords > 0) {
    console.log('🎉 CLONAGE RÉUSSI!')
    console.log(`✅ ${totalRecords} enregistrements disponibles pour les tests`)
    console.log('🚀 Vous pouvez maintenant développer avec des données réalistes')
  } else {
    console.log('⚠️ Aucune donnée trouvée')
    console.log('💡 Relancez le clonage intelligent: npm run smart-clone:prod-to-test')
  }
}

testClonedData().catch(console.error)