#!/usr/bin/env tsx
/**
 * Script pour vérifier la structure exacte des tables problématiques
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function checkTableStructure() {
  console.log('🔍 VÉRIFICATION DE LA STRUCTURE DES TABLES')
  console.log('=' .repeat(50))

  // Production
  config({ path: resolve(process.cwd(), '.env.prod') })
  const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const prodClient = createClient(prodUrl, prodKey)

  console.log('\n📋 Structure de internet_connection_types (PRODUCTION)')
  try {
    const { data, error } = await prodClient
      .from('internet_connection_types')
      .select('*')
      .limit(1)

    if (error) {
      console.log(`❌ Erreur: ${error.message}`)
    } else {
      if (data && data.length > 0) {
        const columns = Object.keys(data[0])
        console.log(`📊 Colonnes trouvées: ${columns.join(', ')}`)
        console.log(`📄 Exemple de données:`)
        console.log(JSON.stringify(data[0], null, 2))
      } else {
        console.log('⚠️ Aucune donnée trouvée')
      }
    }
  } catch (e) {
    console.log(`💥 Erreur: ${e}`)
  }

  // Test
  config({ path: resolve(process.cwd(), '.env.test') })
  const testUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const testKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const testClient = createClient(testUrl, testKey)

  console.log('\n📋 Structure de internet_connection_types (TEST)')
  try {
    const { data, error } = await testClient
      .from('internet_connection_types')
      .select('*')
      .limit(1)

    if (error) {
      console.log(`❌ Erreur: ${error.message}`)
    } else {
      if (data && data.length > 0) {
        const columns = Object.keys(data[0])
        console.log(`📊 Colonnes trouvées: ${columns.join(', ')}`)
        console.log(`📄 Exemple de données:`)
        console.log(JSON.stringify(data[0], null, 2))
      } else {
        console.log('⚠️ Aucune donnée trouvée - table vide')
        
        // Try to get structure from empty table
        try {
          const { error: structError } = await testClient
            .from('internet_connection_types')
            .select('id, type, speed, provider, status, cost')
            .limit(0)
          
          if (!structError) {
            console.log('📊 Colonnes confirmées: id, type, speed, provider, status, cost')
          }
        } catch (e2) {
          console.log('⚠️ Impossible de déterminer la structure')
        }
      }
    }
  } catch (e) {
    console.log(`💥 Erreur: ${e}`)
  }
}

checkTableStructure()