#!/usr/bin/env tsx
/**
 * Script pour identifier les problèmes de données lors du clonage
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function checkDataIssues() {
  console.log('🔍 VÉRIFICATION DES PROBLÈMES DE DONNÉES')
  console.log('=' .repeat(50))

  // Charger l'environnement de production
  config({ path: resolve(process.cwd(), '.env.prod') })
  const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const prodClient = createClient(prodUrl, prodKey)

  console.log('🔍 Vérification des données problématiques...\n')

  // 1. Vérifier internet_connection_types pour les valeurs NULL
  console.log('📋 internet_connection_types - Vérification des valeurs NULL')
  try {
    const { data: internetTypes, error } = await prodClient
      .from('internet_connection_types')
      .select('*')

    if (error) {
      console.log(`❌ Erreur: ${error.message}`)
    } else {
      console.log(`📊 ${internetTypes?.length} enregistrements trouvés`)
      
      const nullNames = internetTypes?.filter(item => !item.name || item.name.trim() === '') || []
      if (nullNames.length > 0) {
        console.log(`❌ ${nullNames.length} enregistrements avec nom NULL/vide:`)
        nullNames.forEach((item, index) => {
          console.log(`   ${index + 1}. ID: ${item.id}, Name: "${item.name}", Type: "${item.type}"`)
        })
      } else {
        console.log(`✅ Aucun nom NULL/vide trouvé`)
      }
    }
  } catch (e) {
    console.log(`💥 Erreur: ${e}`)
  }

  // 2. Vérifier les colonnes updated_at
  console.log('\n📋 Vérification des colonnes updated_at')
  const tablesWithUpdatedAt = ['zone_areas', 'categories', 'payment_methods', 'team_members']
  
  for (const tableName of tablesWithUpdatedAt) {
    try {
      const { data, error } = await prodClient
        .from(tableName)
        .select('*')
        .limit(1)

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`)
      } else {
        const columns = data && data.length > 0 ? Object.keys(data[0]) : []
        const hasUpdatedAt = columns.includes('updated_at')
        console.log(`${hasUpdatedAt ? '✅' : '❌'} ${tableName}: ${hasUpdatedAt ? 'HAS' : 'NO'} updated_at`)
        
        if (hasUpdatedAt && data && data.length > 0) {
          console.log(`   Exemple: updated_at = ${data[0].updated_at}`)
        }
      }
    } catch (e) {
      console.log(`💥 ${tableName}: ${e}`)
    }
  }

  // 3. Vérifier la table lofts pour price_per_night
  console.log('\n📋 Vérification de lofts.price_per_night')
  try {
    const { data: lofts, error } = await prodClient
      .from('lofts')
      .select('*')
      .limit(1)

    if (error) {
      console.log(`❌ Erreur: ${error.message}`)
    } else {
      const columns = lofts && lofts.length > 0 ? Object.keys(lofts[0]) : []
      const hasPricePerNight = columns.includes('price_per_night')
      console.log(`${hasPricePerNight ? '✅' : '❌'} lofts: ${hasPricePerNight ? 'HAS' : 'NO'} price_per_night`)
      
      if (hasPricePerNight && lofts && lofts.length > 0) {
        console.log(`   Exemple: price_per_night = ${lofts[0].price_per_night}`)
      }
    }
  } catch (e) {
    console.log(`💥 lofts: ${e}`)
  }

  // 4. Vérifier currencies.decimal_digits
  console.log('\n📋 Vérification de currencies.decimal_digits')
  try {
    const { data: currencies, error } = await prodClient
      .from('currencies')
      .select('*')
      .limit(1)

    if (error) {
      console.log(`❌ Erreur: ${error.message}`)
    } else {
      const columns = currencies && currencies.length > 0 ? Object.keys(currencies[0]) : []
      const hasDecimalDigits = columns.includes('decimal_digits')
      console.log(`${hasDecimalDigits ? '✅' : '❌'} currencies: ${hasDecimalDigits ? 'HAS' : 'NO'} decimal_digits`)
      
      if (hasDecimalDigits && currencies && currencies.length > 0) {
        console.log(`   Exemple: decimal_digits = ${currencies[0].decimal_digits}`)
      }
    }
  } catch (e) {
    console.log(`💥 currencies: ${e}`)
  }

  console.log('\n🎯 RECOMMANDATIONS:')
  console.log('1. Les erreurs de clonage semblent être dues à des différences de cache Supabase')
  console.log('2. Essayez de vider le cache ou redémarrer les services')
  console.log('3. Vérifiez les politiques RLS qui pourraient bloquer les insertions')
}

checkDataIssues()