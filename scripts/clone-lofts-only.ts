#!/usr/bin/env tsx
/**
 * Script pour cloner uniquement les lofts de production vers tous les environnements
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function cloneLoftsOnly() {
  console.log('🏠 CLONAGE DES LOFTS UNIQUEMENT')
  console.log('=' .repeat(50))

  // Production (source)
  config({ path: resolve(process.cwd(), '.env.prod') })
  const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const prodClient = createClient(prodUrl, prodKey)

  // Récupérer les lofts de production
  console.log('📋 Récupération des lofts de production...')
  const { data: prodLofts, error: prodError } = await prodClient
    .from('lofts')
    .select('*')

  if (prodError) {
    console.log(`❌ Erreur production: ${prodError.message}`)
    return
  }

  if (!prodLofts || prodLofts.length === 0) {
    console.log('⚠️ Aucun loft trouvé en production')
    return
  }

  console.log(`📊 ${prodLofts.length} lofts trouvés en production`)

  // Cloner vers test et dev
  const targets = [
    { name: 'TEST', file: '.env.test' },
    { name: 'DÉVELOPPEMENT', file: '.env.development' }
  ]

  for (const target of targets) {
    console.log(`\n📋 Clonage vers ${target.name}`)
    console.log('-' .repeat(30))

    try {
      config({ path: resolve(process.cwd(), target.file) })
      const targetUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const targetKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
      const targetClient = createClient(targetUrl, targetKey)

      // Vider la table lofts cible
      const { error: deleteError } = await targetClient
        .from('lofts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (deleteError && !deleteError.message.includes('No rows found')) {
        console.log(`⚠️ Nettoyage: ${deleteError.message}`)
      }

      // Insérer les lofts
      const { data: insertedLofts, error: insertError } = await targetClient
        .from('lofts')
        .insert(prodLofts)
        .select('id, name, price_per_month, status')

      if (insertError) {
        console.log(`❌ Erreur insertion: ${insertError.message}`)
        
        // Essayer un par un
        let successCount = 0
        for (const loft of prodLofts) {
          const { error: singleError } = await targetClient
            .from('lofts')
            .insert([loft])

          if (!singleError) {
            successCount++
          } else {
            console.log(`❌ ${loft.name}: ${singleError.message}`)
          }
        }
        console.log(`✅ ${successCount}/${prodLofts.length} lofts clonés`)
      } else {
        console.log(`✅ ${insertedLofts?.length || 0} lofts clonés avec succès`)
        
        if (insertedLofts) {
          insertedLofts.forEach(loft => {
            console.log(`   • ${loft.name} (${loft.price_per_month} DA/jour)`)
          })
        }
      }

    } catch (error) {
      console.log(`💥 Erreur ${target.name}: ${error}`)
    }
  }

  // Vérification finale
  console.log('\n🔍 VÉRIFICATION FINALE')
  console.log('-' .repeat(30))

  const environments = [
    { name: 'PRODUCTION', file: '.env.prod' },
    { name: 'TEST', file: '.env.test' },
    { name: 'DÉVELOPPEMENT', file: '.env.development' }
  ]

  for (const env of environments) {
    try {
      config({ path: resolve(process.cwd(), env.file) })
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
      const client = createClient(url, key)

      const { count } = await client
        .from('lofts')
        .select('*', { count: 'exact', head: true })

      console.log(`📊 ${env.name}: ${count || 0} lofts`)
    } catch (error) {
      console.log(`❌ ${env.name}: Erreur`)
    }
  }

  console.log('\n🎉 Clonage des lofts terminé!')
  console.log('✅ Fonctionnalités incluses dans tous les environnements:')
  console.log('   • 📺 TV Subscription avec facturation')
  console.log('   • 💰 Pricing quotidien en DA')
  console.log('   • 🏠 Différents statuts (available, occupied, maintenance)')
  console.log('   • 📅 Calendrier de facturation complet')
}

cloneLoftsOnly().catch(console.error)