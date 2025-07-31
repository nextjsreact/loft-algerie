#!/usr/bin/env tsx
/**
 * Script de clonage intelligent qui gère les différences de schéma
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function smartClone() {
  console.log('🧠 CLONAGE INTELLIGENT AVEC ADAPTATION DE SCHÉMA')
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

  const tablesToClone = ['zone_areas', 'internet_connection_types', 'loft_owners', 'categories', 'currencies', 'payment_methods']

  for (const tableName of tablesToClone) {
    console.log(`\n📋 Clonage intelligent: ${tableName}`)
    console.log('-' .repeat(40))

    try {
      // 1. Récupérer les données source
      const { data: sourceData, error: sourceError } = await prodClient
        .from(tableName)
        .select('*')

      if (sourceError) {
        console.log(`❌ Erreur source: ${sourceError.message}`)
        continue
      }

      if (!sourceData || sourceData.length === 0) {
        console.log(`ℹ️ Table ${tableName} vide`)
        continue
      }

      console.log(`📊 ${sourceData.length} enregistrements source`)

      // 2. Déterminer la structure de la table cible
      const { data: targetSample, error: targetError } = await testClient
        .from(tableName)
        .select('*')
        .limit(1)

      let targetColumns: string[] = []
      
      if (!targetError && targetSample && targetSample.length > 0) {
        targetColumns = Object.keys(targetSample[0])
      } else {
        // Table vide, essayer de déterminer les colonnes autrement
        // Pour internet_connection_types, on sait qu'elle a ces colonnes
        if (tableName === 'internet_connection_types') {
          targetColumns = ['id', 'type', 'speed', 'provider', 'status', 'cost', 'created_at']
        } else {
          // Utiliser les colonnes de la source comme fallback
          targetColumns = sourceData.length > 0 ? Object.keys(sourceData[0]) : []
        }
      }

      console.log(`🎯 Colonnes cible: ${targetColumns.join(', ')}`)

      // 3. Adapter les données source aux colonnes cible
      const adaptedData = sourceData.map(record => {
        const adaptedRecord: any = {}
        
        for (const column of targetColumns) {
          if (record.hasOwnProperty(column)) {
            adaptedRecord[column] = record[column]
          } else {
            // Colonne manquante dans la source, utiliser une valeur par défaut
            if (column === 'created_at') {
              adaptedRecord[column] = new Date().toISOString()
            } else if (column === 'updated_at') {
              adaptedRecord[column] = new Date().toISOString()
            } else {
              // Laisser undefined pour que Supabase utilise la valeur par défaut
            }
          }
        }
        
        return adaptedRecord
      })

      console.log(`🔄 Données adaptées: ${adaptedData.length} enregistrements`)

      // 4. Vider la table cible
      const { error: deleteError } = await testClient
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (deleteError && !deleteError.message.includes('No rows found')) {
        console.log(`⚠️ Nettoyage: ${deleteError.message}`)
      }

      // 5. Insérer les données adaptées
      const { data: insertedData, error: insertError } = await testClient
        .from(tableName)
        .insert(adaptedData)

      if (insertError) {
        console.log(`❌ Erreur insertion: ${insertError.message}`)
        
        // Essayer d'insérer un par un pour identifier les problèmes
        console.log('🔍 Tentative d\'insertion individuelle...')
        let successCount = 0
        
        for (let i = 0; i < Math.min(adaptedData.length, 5); i++) {
          const { error: singleError } = await testClient
            .from(tableName)
            .insert([adaptedData[i]])
          
          if (singleError) {
            console.log(`❌ Enregistrement ${i + 1}: ${singleError.message}`)
            console.log(`📄 Données: ${JSON.stringify(adaptedData[i], null, 2)}`)
          } else {
            successCount++
          }
        }
        
        console.log(`✅ ${successCount}/${Math.min(adaptedData.length, 5)} insertions réussies`)
      } else {
        console.log(`✅ ${adaptedData.length} enregistrements insérés`)
      }

    } catch (error) {
      console.log(`💥 Erreur: ${error}`)
    }
  }

  console.log('\n🎉 Clonage intelligent terminé!')
}

smartClone()