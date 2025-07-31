#!/usr/bin/env tsx
/**
 * RESTAURATION D'URGENCE DES LOFTS EN PRODUCTION
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

async function restoreEmergencyLofts() {
  console.log('🚑 RESTAURATION D\'URGENCE DES LOFTS EN PRODUCTION')
  console.log('=' .repeat(60))

  // Charger les données de récupération
  const recoveryData = JSON.parse(readFileSync('emergency-lofts-recovery.json', 'utf8'))
  
  console.log('📋 Données de récupération chargées:')
  console.log(`📅 Créées le: ${new Date(recoveryData.timestamp).toLocaleString('fr-FR')}`)
  console.log(`🏠 Nombre de lofts: ${recoveryData.lofts.length}`)
  console.log('')

  // Charger la configuration PROD
  const envContent = readFileSync('.env.prod', 'utf8')
  const envVars: any = {}
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim()
    }
  })

  const prodClient = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log('🔗 Connexion à la PRODUCTION...')
  console.log(`📡 URL: ${envVars.NEXT_PUBLIC_SUPABASE_URL}`)

  // Confirmation de sécurité
  const { createInterface } = await import('readline')
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  console.log('')
  console.log('⚠️ ATTENTION: Cette opération va restaurer les lofts en PRODUCTION!')
  console.log('📋 Lofts qui seront créés:')
  recoveryData.lofts.forEach((loft: any, index: number) => {
    console.log(`   ${index + 1}. ${loft.name} - ${loft.address}`)
  })
  console.log('')

  const confirm = await new Promise(resolve => {
    rl.question('Confirmez-vous la restauration? (tapez OUI): ', resolve)
  })
  rl.close()

  if (confirm !== 'OUI') {
    console.log('❌ Restauration annulée')
    return
  }

  try {
    console.log('\n🔄 Restauration en cours...')

    // Préparer les données pour l'insertion
    const loftsToInsert = recoveryData.lofts.map((loft: any) => ({
      ...loft,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    // Insérer les lofts
    const { data: insertedLofts, error: insertError } = await prodClient
      .from('lofts')
      .insert(loftsToInsert)
      .select()

    if (insertError) {
      console.log('❌ ERREUR lors de la restauration:', insertError.message)
      
      // Essayer une insertion individuelle pour identifier les problèmes
      console.log('\n🔍 Tentative d\'insertion individuelle...')
      let successCount = 0
      
      for (let i = 0; i < loftsToInsert.length; i++) {
        const loft = loftsToInsert[i]
        const { error: singleError } = await prodClient
          .from('lofts')
          .insert([loft])

        if (singleError) {
          console.log(`❌ Loft ${i + 1} (${loft.name}): ${singleError.message}`)
        } else {
          console.log(`✅ Loft ${i + 1} (${loft.name}): Restauré avec succès`)
          successCount++
        }
      }
      
      console.log(`\n📊 Résultat: ${successCount}/${loftsToInsert.length} lofts restaurés`)
      
    } else {
      console.log(`✅ SUCCÈS! ${loftsToInsert.length} lofts restaurés en PRODUCTION`)
      
      if (insertedLofts) {
        console.log('\n📋 Lofts restaurés:')
        insertedLofts.forEach((loft: any, index: number) => {
          console.log(`   ${index + 1}. ${loft.name} (ID: ${loft.id})`)
        })
      }
    }

    // Vérification finale
    console.log('\n🔍 Vérification finale...')
    const { count: finalCount } = await prodClient
      .from('lofts')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 Nombre total de lofts en PROD: ${finalCount || 0}`)

    if (finalCount && finalCount > 0) {
      console.log('\n🎉 RESTAURATION RÉUSSIE!')
      console.log('✅ Vos lofts sont de nouveau disponibles en production')
      console.log('🚀 Vous pouvez maintenant utiliser votre application normalement')
      
      // Créer un rapport de restauration
      const fs = await import('fs')
      const report = {
        timestamp: new Date().toISOString(),
        action: 'Emergency restoration',
        lofts_restored: finalCount,
        success: true,
        details: 'Lofts successfully restored from emergency backup'
      }
      
      fs.writeFileSync(`restoration-report-${Date.now()}.json`, JSON.stringify(report, null, 2))
      console.log('📋 Rapport de restauration créé')
      
    } else {
      console.log('\n⚠️ PROBLÈME: Aucun loft trouvé après restauration')
      console.log('🔍 Vérifiez les permissions et la configuration de la base de données')
    }

  } catch (error) {
    console.log('\n💥 ERREUR CRITIQUE:', error)
    console.log('🆘 Contactez immédiatement le support technique')
  }

  console.log('\n🎯 PROCHAINES ÉTAPES RECOMMANDÉES:')
  console.log('1. 🔍 Vérifiez que l\'application fonctionne normalement')
  console.log('2. 🔒 Mettez en place des sauvegardes automatiques')
  console.log('3. 📋 Documentez cet incident pour éviter qu\'il se reproduise')
  console.log('4. 🔧 Vérifiez les logs Supabase pour identifier la cause initiale')
}

restoreEmergencyLofts().catch(console.error)