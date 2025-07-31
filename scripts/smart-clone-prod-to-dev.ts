#!/usr/bin/env tsx
/**
 * Script de clonage intelligent PRODUCTION → DÉVELOPPEMENT
 * Clone les données de production vers l'environnement de développement avec adaptation de schéma
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function smartCloneProdToDev() {
  console.log('🧠 CLONAGE INTELLIGENT PRODUCTION → DÉVELOPPEMENT')
  console.log('=' .repeat(60))
  console.log('Ce script clone les données de production vers l\'environnement de développement.')
  console.log('⚠️ Les données existantes en développement seront remplacées.\n')

  // Confirmation de sécurité
  const { createInterface } = await import('readline')
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const confirm = await new Promise(resolve => {
    rl.question('Êtes-vous sûr de vouloir remplacer les données de développement? (tapez OUI): ', resolve)
  })

  rl.close()

  if (confirm !== 'OUI') {
    console.log('❌ Opération annulée')
    return
  }

  // Charger les environnements
  config({ path: resolve(process.cwd(), '.env.prod') })
  const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const prodClient = createClient(prodUrl, prodKey)

  config({ path: resolve(process.cwd(), '.env.development') })
  const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const devKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const devClient = createClient(devUrl, devKey)

  const tablesToClone = [
    'zone_areas',
    'internet_connection_types', 
    'loft_owners',
    'lofts',
    'categories',
    'currencies',
    'payment_methods',
    'teams',
    'team_members',
    'tasks',
    'transaction_category_references',
    'settings'
  ]

  let totalCloned = 0
  const results: any = {}

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
        results[tableName] = { status: 'error', error: sourceError.message }
        continue
      }

      if (!sourceData || sourceData.length === 0) {
        console.log(`ℹ️ Table ${tableName} vide`)
        results[tableName] = { status: 'empty', records: 0 }
        continue
      }

      console.log(`📊 ${sourceData.length} enregistrements source`)

      // 2. Déterminer la structure de la table cible
      const { data: targetSample, error: targetError } = await devClient
        .from(tableName)
        .select('*')
        .limit(1)

      let targetColumns: string[] = []
      
      if (!targetError && targetSample && targetSample.length > 0) {
        targetColumns = Object.keys(targetSample[0])
      } else {
        // Table vide, essayer de déterminer les colonnes autrement
        if (tableName === 'internet_connection_types') {
          targetColumns = ['id', 'type', 'speed', 'provider', 'status', 'cost', 'created_at']
        } else if (tableName === 'lofts') {
          // Inclure les champs TV subscription
          targetColumns = ['id', 'name', 'address', 'price_per_month', 'status', 'owner_id', 
                          'zone_area_id', 'internet_connection_type_id', 'description',
                          'company_percentage', 'owner_percentage',
                          'frequence_paiement_eau', 'prochaine_echeance_eau',
                          'frequence_paiement_energie', 'prochaine_echeance_energie',
                          'frequence_paiement_telephone', 'prochaine_echeance_telephone',
                          'frequence_paiement_internet', 'prochaine_echeance_internet',
                          'frequence_paiement_tv', 'prochaine_echeance_tv',
                          'created_at', 'updated_at']
        } else {
          // Utiliser les colonnes de la source comme fallback
          targetColumns = sourceData.length > 0 ? Object.keys(sourceData[0]) : []
        }
      }

      console.log(`🎯 Colonnes cible: ${targetColumns.length} colonnes`)

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
            }
            // Laisser undefined pour les autres colonnes pour que Supabase utilise la valeur par défaut
          }
        }
        
        return adaptedRecord
      })

      console.log(`🔄 Données adaptées: ${adaptedData.length} enregistrements`)

      // 4. Vider la table cible (sauf pour les tables sensibles)
      const sensitiveTables = ['profiles', 'user_sessions']
      if (!sensitiveTables.includes(tableName)) {
        const { error: deleteError } = await devClient
          .from(tableName)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (deleteError && !deleteError.message.includes('No rows found')) {
          console.log(`⚠️ Nettoyage: ${deleteError.message}`)
        }
      }

      // 5. Insérer les données adaptées par lots
      const batchSize = 50
      let insertedCount = 0

      for (let i = 0; i < adaptedData.length; i += batchSize) {
        const batch = adaptedData.slice(i, i + batchSize)
        
        const { data: insertedData, error: insertError } = await devClient
          .from(tableName)
          .insert(batch)

        if (insertError) {
          console.log(`❌ Erreur lot ${Math.floor(i/batchSize) + 1}: ${insertError.message}`)
          
          // Essayer d'insérer un par un pour ce lot
          for (const record of batch) {
            const { error: singleError } = await devClient
              .from(tableName)
              .insert([record])
            
            if (!singleError) {
              insertedCount++
            }
          }
        } else {
          insertedCount += batch.length
          console.log(`📥 Lot ${Math.floor(i/batchSize) + 1}: ${batch.length} enregistrements`)
        }
      }

      console.log(`✅ ${insertedCount}/${adaptedData.length} enregistrements insérés`)
      results[tableName] = { status: 'success', records: insertedCount }
      totalCloned += insertedCount

    } catch (error) {
      console.log(`💥 Erreur: ${error}`)
      results[tableName] = { status: 'error', error: String(error) }
    }
  }

  // Résumé final
  console.log('\n📊 RÉSUMÉ DU CLONAGE INTELLIGENT')
  console.log('=' .repeat(50))
  console.log(`📈 Total des enregistrements clonés: ${totalCloned}`)
  
  const successTables = Object.keys(results).filter(t => results[t].status === 'success')
  const errorTables = Object.keys(results).filter(t => results[t].status === 'error')
  const emptyTables = Object.keys(results).filter(t => results[t].status === 'empty')
  
  console.log(`✅ Tables réussies: ${successTables.length}`)
  console.log(`❌ Tables en erreur: ${errorTables.length}`)
  console.log(`ℹ️ Tables vides: ${emptyTables.length}`)

  if (successTables.length > 0) {
    console.log('\n📋 Détail des succès:')
    successTables.forEach(table => {
      console.log(`✅ ${table}: ${results[table].records} enregistrements`)
    })
  }

  if (errorTables.length > 0) {
    console.log('\n📋 Tables avec erreurs:')
    errorTables.forEach(table => {
      console.log(`❌ ${table}: ${results[table].error}`)
    })
  }

  console.log('\n🎉 Clonage intelligent terminé: PROD → DEV')
  console.log('💡 Vous pouvez maintenant tester avec: npm run env:switch:dev')
  
  console.log('\n🎯 RECOMMANDATIONS POST-CLONAGE:')
  console.log('• Testez la connexion: npm run env:switch:dev && npm run test-env')
  console.log('• Vérifiez les données: npm run env:switch:dev && npm run dev')
  console.log('• Les champs TV subscription sont inclus dans le clonage')
  console.log('• Le pricing quotidien (DA) est préservé')
}

smartCloneProdToDev().catch(console.error)