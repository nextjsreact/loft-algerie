#!/usr/bin/env tsx
/**
 * Script de diagnostic de compatibilité de schéma
 * Vérifie si votre production existante est compatible avec le nouveau schéma
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function diagnoseSchemaCompatibility() {
  console.log('🔍 DIAGNOSTIC DE COMPATIBILITÉ DU SCHÉMA')
  console.log('=' .repeat(60))

  // Charger l'environnement de production
  config({ path: resolve(process.cwd(), '.env.production') })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Variables d\'environnement de production non configurées')
    console.log('💡 Exécutez d\'abord: npm run integrate:prod')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Tables attendues dans le nouveau schéma
  const expectedTables = [
    'profiles',
    'user_sessions',
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
    'transactions',
    'notifications',
    'transaction_category_references',
    'settings',
    'conversations',
    'conversation_participants',
    'messages'
  ]

  // Colonnes critiques pour les lofts (incluant TV)
  const expectedLoftColumns = [
    'id', 'name', 'address', 'price_per_month', 'status',
    'frequence_paiement_eau', 'prochaine_echeance_eau',
    'frequence_paiement_energie', 'prochaine_echeance_energie',
    'frequence_paiement_telephone', 'prochaine_echeance_telephone',
    'frequence_paiement_internet', 'prochaine_echeance_internet',
    'frequence_paiement_tv', 'prochaine_echeance_tv' // Nouveaux champs TV
  ]

  console.log('🔍 Vérification des tables...\n')

  const results = {
    existingTables: [],
    missingTables: [],
    missingColumns: [],
    extraTables: [],
    totalRecords: 0
  }

  try {
    // Récupérer la liste des tables existantes en testant chaque table
    const existingTableNames = []
    
    for (const tableName of expectedTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          existingTableNames.push(tableName)
        }
      } catch (e) {
        // Table doesn't exist
      }
    }

    // existingTableNames is already populated above
    
    // Vérifier chaque table attendue
    for (const expectedTable of expectedTables) {
      if (existingTableNames.includes(expectedTable)) {
        results.existingTables.push(expectedTable)
        console.log(`✅ ${expectedTable}`)
        
        // Compter les enregistrements
        try {
          const { count } = await supabase
            .from(expectedTable)
            .select('*', { count: 'exact', head: true })
          
          if (count !== null) {
            console.log(`   📊 ${count} enregistrements`)
            results.totalRecords += count
          }
        } catch (e) {
          console.log(`   ⚠️ Impossible de compter les enregistrements`)
        }
      } else {
        results.missingTables.push(expectedTable)
        console.log(`❌ ${expectedTable} - MANQUANTE`)
      }
    }

    // Vérifier les colonnes spécifiques des lofts (incluant TV)
    if (existingTableNames.includes('lofts')) {
      console.log('\n🏠 Vérification des colonnes de la table lofts...')
      
      // Test each expected column by trying to select it
      const existingColumns = []
      
      for (const columnName of expectedLoftColumns) {
        try {
          const { error } = await supabase
            .from('lofts')
            .select(columnName, { head: true })
          
          if (!error) {
            existingColumns.push(columnName)
          }
        } catch (e) {
          // Column doesn't exist
        }
      }

      for (const expectedColumn of expectedLoftColumns) {
        if (existingColumns.includes(expectedColumn)) {
          console.log(`✅ lofts.${expectedColumn}`)
        } else {
          results.missingColumns.push(`lofts.${expectedColumn}`)
          console.log(`❌ lofts.${expectedColumn} - MANQUANTE`)
        }
      }
    }

    // Tables supplémentaires non attendues
    const extraTables = existingTableNames.filter(table => 
      !expectedTables.includes(table) && 
      !table.startsWith('_') && 
      table !== 'schema_migrations'
    )
    
    if (extraTables.length > 0) {
      console.log('\n📋 Tables supplémentaires détectées:')
      extraTables.forEach(table => {
        console.log(`ℹ️ ${table}`)
        results.extraTables.push(table)
      })
    }

    // Résumé final
    console.log('\n📊 RÉSUMÉ DU DIAGNOSTIC')
    console.log('=' .repeat(40))
    console.log(`✅ Tables existantes: ${results.existingTables.length}/${expectedTables.length}`)
    console.log(`❌ Tables manquantes: ${results.missingTables.length}`)
    console.log(`❌ Colonnes manquantes: ${results.missingColumns.length}`)
    console.log(`📊 Total des enregistrements: ${results.totalRecords}`)

    // Recommandations
    console.log('\n🎯 RECOMMANDATIONS:')
    
    if (results.missingTables.length === 0 && results.missingColumns.length === 0) {
      console.log('🎉 Votre production est COMPATIBLE avec le nouveau schéma!')
      console.log('✅ Vous pouvez utiliser les scripts de clonage sans problème')
    } else {
      console.log('⚠️ Votre production nécessite des mises à jour:')
      
      if (results.missingTables.length > 0) {
        console.log('📋 Tables à créer:')
        results.missingTables.forEach(table => console.log(`   • ${table}`))
      }
      
      if (results.missingColumns.length > 0) {
        console.log('📋 Colonnes à ajouter:')
        results.missingColumns.forEach(column => console.log(`   • ${column}`))
        
        if (results.missingColumns.some(col => col.includes('tv'))) {
          console.log('💡 Pour ajouter les champs TV: scripts/add-tv-subscription-fields.sql')
        }
      }
      
      console.log('\n🔧 Actions recommandées:')
      console.log('1. Sauvegardez votre production avant toute modification')
      console.log('2. Appliquez les migrations nécessaires')
      console.log('3. Relancez ce diagnostic pour vérifier')
    }

    // Sauvegarder le rapport
    const report = {
      timestamp: new Date().toISOString(),
      environment: 'production',
      results: results
    }
    
    const fs = await import('fs')
    fs.writeFileSync(
      'schema-compatibility-report.json', 
      JSON.stringify(report, null, 2)
    )
    
    console.log('\n📄 Rapport sauvegardé: schema-compatibility-report.json')

  } catch (error) {
    console.error('💥 Erreur lors du diagnostic:', error)
  }
}

diagnoseSchemaCompatibility()