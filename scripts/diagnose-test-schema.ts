#!/usr/bin/env tsx
/**
 * Script de diagnostic du schéma de test
 * Vérifie le schéma de l'environnement de test
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function diagnoseTestSchema() {
  console.log('🔍 DIAGNOSTIC DU SCHÉMA DE TEST')
  console.log('=' .repeat(50))

  // Charger l'environnement de test
  config({ path: resolve(process.cwd(), '.env.test') })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Variables d\'environnement de test non configurées')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Tables attendues
  const expectedTables = [
    'profiles', 'user_sessions', 'zone_areas', 'internet_connection_types',
    'loft_owners', 'lofts', 'categories', 'currencies', 'payment_methods',
    'teams', 'team_members', 'tasks', 'transactions', 'notifications',
    'transaction_category_references', 'settings', 'conversations',
    'conversation_participants', 'messages'
  ]

  // Colonnes critiques pour les lofts
  const expectedLoftColumns = [
    'id', 'name', 'address', 'price_per_month', 'status',
    'frequence_paiement_eau', 'prochaine_echeance_eau',
    'frequence_paiement_energie', 'prochaine_echeance_energie',
    'frequence_paiement_telephone', 'prochaine_echeance_telephone',
    'frequence_paiement_internet', 'prochaine_echeance_internet',
    'frequence_paiement_tv', 'prochaine_echeance_tv'
  ]

  console.log('🔍 Vérification des tables de test...\n')

  const results = {
    existingTables: [],
    missingTables: [],
    missingColumns: [],
    totalRecords: 0
  }

  try {
    // Tester chaque table
    const existingTableNames = []
    
    for (const tableName of expectedTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          existingTableNames.push(tableName)
          results.existingTables.push(tableName)
          console.log(`✅ ${tableName}`)
          if (count !== null) {
            console.log(`   📊 ${count} enregistrements`)
            results.totalRecords += count
          }
        }
      } catch (e) {
        results.missingTables.push(tableName)
        console.log(`❌ ${tableName} - MANQUANTE`)
      }
    }

    // Vérifier les colonnes des lofts
    if (existingTableNames.includes('lofts')) {
      console.log('\n🏠 Vérification des colonnes de la table lofts...')
      
      const existingColumns = []
      
      for (const columnName of expectedLoftColumns) {
        try {
          const { error } = await supabase
            .from('lofts')
            .select(columnName, { head: true })
          
          if (!error) {
            existingColumns.push(columnName)
            console.log(`✅ lofts.${columnName}`)
          } else {
            results.missingColumns.push(`lofts.${columnName}`)
            console.log(`❌ lofts.${columnName} - MANQUANTE`)
          }
        } catch (e) {
          results.missingColumns.push(`lofts.${columnName}`)
          console.log(`❌ lofts.${columnName} - MANQUANTE`)
        }
      }
    }

    // Résumé
    console.log('\n📊 RÉSUMÉ DU DIAGNOSTIC TEST')
    console.log('=' .repeat(40))
    console.log(`✅ Tables existantes: ${results.existingTables.length}/${expectedTables.length}`)
    console.log(`❌ Tables manquantes: ${results.missingTables.length}`)
    console.log(`❌ Colonnes manquantes: ${results.missingColumns.length}`)
    console.log(`📊 Total des enregistrements: ${results.totalRecords}`)

    if (results.missingTables.length > 0) {
      console.log('\n📋 Tables manquantes:')
      results.missingTables.forEach(table => console.log(`   • ${table}`))
    }

    if (results.missingColumns.length > 0) {
      console.log('\n📋 Colonnes manquantes:')
      results.missingColumns.forEach(column => console.log(`   • ${column}`))
    }

  } catch (error) {
    console.error('💥 Erreur lors du diagnostic:', error)
  }
}

diagnoseTestSchema()