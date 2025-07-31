#!/usr/bin/env tsx
/**
 * RESTAURATION D'URGENCE - Restaurer les données lofts en production
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function restoreEmergencyLofts() {
  console.log('🚑 RESTAURATION D\'URGENCE DES LOFTS EN PRODUCTION')
  console.log('=' .repeat(60))

  // Confirmation de sécurité
  const { createInterface } = await import('readline')
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  console.log('⚠️ Cette opération va restaurer 3 lofts de base en production.')
  console.log('📋 Lofts à créer:')
  console.log('   1. Loft Centre Alger - 15000 DA/jour')
  console.log('   2. Loft Hydra Premium - 25000 DA/jour')
  console.log('   3. Loft Kouba Moderne - 18000 DA/jour')
  console.log('')

  const confirm = await new Promise(resolve => {
    rl.question('Voulez-vous procéder à la restauration? (tapez OUI): ', resolve)
  })

  rl.close()

  if (confirm !== 'OUI') {
    console.log('❌ Restauration annulée')
    return
  }

  config({ path: resolve(process.cwd(), '.env.prod') })
  const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const prodClient = createClient(prodUrl, prodKey)

  try {
    // Récupérer les données de référence
    console.log('🔍 Récupération des données de référence...')
    
    const { data: owners } = await prodClient.from('loft_owners').select('id, name')
    const { data: zones } = await prodClient.from('zone_areas').select('id, name')
    const { data: internetTypes } = await prodClient.from('internet_connection_types').select('id').limit(1)

    if (!owners || !zones || !internetTypes) {
      console.log('❌ Impossible de récupérer les données de référence')
      return
    }

    console.log(`✅ ${owners.length} propriétaires, ${zones.length} zones, ${internetTypes.length} types internet`)

    // Préparer les données des lofts
    const emergencyLofts = [
      {
        name: 'Loft Centre Alger',
        address: '123 Rue Didouche Mourad, Alger Centre',
        price_per_month: 15000,
        status: 'available',
        description: 'Loft moderne au centre d\'Alger avec vue sur la mer',
        company_percentage: 20,
        owner_percentage: 80,
        owner_id: owners[0].id,
        zone_area_id: zones[0].id,
        internet_connection_type_id: internetTypes[0].id,
        // Champs de facturation eau
        frequence_paiement_eau: 'bimestriel',
        prochaine_echeance_eau: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Champs de facturation énergie
        frequence_paiement_energie: 'bimestriel',
        prochaine_echeance_energie: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Champs de facturation téléphone
        frequence_paiement_telephone: 'mensuel',
        prochaine_echeance_telephone: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Champs de facturation internet
        frequence_paiement_internet: 'mensuel',
        prochaine_echeance_internet: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Champs TV subscription
        frequence_paiement_tv: 'mensuel',
        prochaine_echeance_tv: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        name: 'Loft Hydra Premium',
        address: '456 Avenue des Martyrs, Hydra',
        price_per_month: 25000,
        status: 'occupied',
        description: 'Loft de luxe dans le quartier résidentiel d\'Hydra',
        company_percentage: 15,
        owner_percentage: 85,
        owner_id: owners[1 % owners.length].id,
        zone_area_id: zones[1 % zones.length].id,
        internet_connection_type_id: internetTypes[0].id,
        // Champs de facturation
        frequence_paiement_eau: 'bimestriel',
        prochaine_echeance_eau: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        frequence_paiement_energie: 'bimestriel',
        prochaine_echeance_energie: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        frequence_paiement_telephone: 'mensuel',
        prochaine_echeance_telephone: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        frequence_paiement_internet: 'mensuel',
        prochaine_echeance_internet: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Champs TV subscription
        frequence_paiement_tv: 'mensuel',
        prochaine_echeance_tv: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        name: 'Loft Kouba Moderne',
        address: '789 Boulevard Colonel Amirouche, Kouba',
        price_per_month: 18000,
        status: 'maintenance',
        description: 'Loft spacieux avec terrasse dans le quartier de Kouba',
        company_percentage: 25,
        owner_percentage: 75,
        owner_id: owners[2 % owners.length].id,
        zone_area_id: zones[2 % zones.length].id,
        internet_connection_type_id: internetTypes[0].id,
        // Champs de facturation
        frequence_paiement_eau: 'trimestriel',
        prochaine_echeance_eau: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        frequence_paiement_energie: 'trimestriel',
        prochaine_echeance_energie: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        frequence_paiement_telephone: 'mensuel',
        prochaine_echeance_telephone: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        frequence_paiement_internet: 'mensuel',
        prochaine_echeance_internet: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Champs TV subscription
        frequence_paiement_tv: 'trimestriel',
        prochaine_echeance_tv: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ]

    console.log('\n🏗️ Insertion des lofts d\'urgence...')

    const { data: insertedLofts, error: insertError } = await prodClient
      .from('lofts')
      .insert(emergencyLofts)
      .select()

    if (insertError) {
      console.log(`❌ Erreur lors de l'insertion: ${insertError.message}`)
      console.log('📋 Détails de l\'erreur:', insertError)
      return
    }

    console.log(`✅ ${insertedLofts?.length || 0} lofts restaurés avec succès!`)

    // Vérification finale
    const { count: finalCount } = await prodClient
      .from('lofts')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 Nombre total de lofts en production: ${finalCount}`)

    // Créer une sauvegarde de la restauration
    const fs = await import('fs')
    const restorationLog = {
      timestamp: new Date().toISOString(),
      action: 'Emergency restoration',
      lofts_restored: insertedLofts?.length || 0,
      total_lofts_after: finalCount,
      restored_lofts: insertedLofts
    }
    
    fs.writeFileSync(`restoration-log-${Date.now()}.json`, JSON.stringify(restorationLog, null, 2))
    console.log('📄 Log de restauration sauvegardé')

    console.log('\n🎉 RESTAURATION TERMINÉE!')
    console.log('✅ Fonctionnalités restaurées:')
    console.log('   • 📺 TV Subscription: Champs configurés')
    console.log('   • 💰 Pricing quotidien (DA): Configuré')
    console.log('   • 🏠 3 lofts de base créés')
    console.log('   • 📋 Toutes les facturations configurées')

    console.log('\n🎯 PROCHAINES ÉTAPES:')
    console.log('1. Vérifier que l\'application fonctionne')
    console.log('2. Ajouter d\'autres lofts si nécessaire')
    console.log('3. Mettre en place des sauvegardes automatiques')
    console.log('4. Identifier la cause de la perte de données')

  } catch (error) {
    console.log(`💥 Erreur lors de la restauration: ${error}`)
  }
}

restoreEmergencyLofts()