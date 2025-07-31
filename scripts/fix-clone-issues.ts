#!/usr/bin/env tsx
/**
 * Script pour corriger tous les problèmes de clonage identifiés
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function fixCloneIssues() {
  console.log('🔧 CORRECTION DES PROBLÈMES DE CLONAGE')
  console.log('=' .repeat(50))

  // 1. Fix production data issues
  console.log('\n📋 Étape 1: Correction des données de production')
  config({ path: resolve(process.cwd(), '.env.prod') })
  const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const prodClient = createClient(prodUrl, prodKey)

  try {
    // Fix internet_connection_types names
    console.log('🔧 Correction des noms internet_connection_types...')
    
    const { data: internetTypes, error: fetchError } = await prodClient
      .from('internet_connection_types')
      .select('*')
      .eq('name', 'undefined')

    if (fetchError) {
      console.log(`❌ Erreur lors de la récupération: ${fetchError.message}`)
    } else if (internetTypes && internetTypes.length > 0) {
      console.log(`📊 ${internetTypes.length} enregistrements à corriger`)

      for (const item of internetTypes) {
        let newName = item.type
        if (item.speed) {
          newName = `${item.type} - ${item.speed}`
        }

        const { error: updateError } = await prodClient
          .from('internet_connection_types')
          .update({ name: newName })
          .eq('id', item.id)

        if (updateError) {
          console.log(`❌ Erreur mise à jour ${item.id}: ${updateError.message}`)
        } else {
          console.log(`✅ Mis à jour: ${item.id} -> "${newName}"`)
        }
      }
    } else {
      console.log('✅ Aucun enregistrement "undefined" trouvé')
    }

  } catch (error) {
    console.log(`💥 Erreur: ${error}`)
  }

  // 2. Sync test schema
  console.log('\n📋 Étape 2: Synchronisation du schéma de test')
  config({ path: resolve(process.cwd(), '.env.test') })
  const testUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const testKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const testClient = createClient(testUrl, testKey)

  try {
    // Check and add missing columns
    const columnsToAdd = [
      { table: 'team_members', column: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()' },
      { table: 'lofts', column: 'price_per_night', type: 'DECIMAL(10,2)' },
      { table: 'currencies', column: 'decimal_digits', type: 'INTEGER DEFAULT 2' }
    ]

    for (const { table, column, type } of columnsToAdd) {
      try {
        // Try to select the column to see if it exists
        const { error } = await testClient
          .from(table)
          .select(column, { head: true })

        if (error && error.message.includes('column')) {
          console.log(`🔧 Ajout de ${table}.${column}...`)
          
          // Use RPC to execute ALTER TABLE
          const { error: alterError } = await testClient
            .rpc('execute_sql', { 
              sql: `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${type}` 
            })

          if (alterError) {
            console.log(`❌ Erreur ajout ${table}.${column}: ${alterError.message}`)
          } else {
            console.log(`✅ Ajouté: ${table}.${column}`)
          }
        } else {
          console.log(`✅ ${table}.${column} existe déjà`)
        }
      } catch (e) {
        console.log(`⚠️ Vérification ${table}.${column}: ${e}`)
      }
    }

  } catch (error) {
    console.log(`💥 Erreur synchronisation: ${error}`)
  }

  console.log('\n🎉 Correction terminée!')
  console.log('💡 Vous pouvez maintenant relancer: npm run clone:prod-to-test')
}

fixCloneIssues()