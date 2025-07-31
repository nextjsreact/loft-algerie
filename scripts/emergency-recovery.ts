#!/usr/bin/env tsx
/**
 * RÉCUPÉRATION D'URGENCE - Recherche de traces de données lofts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function emergencyRecovery() {
  console.log('🚑 RÉCUPÉRATION D\'URGENCE DES DONNÉES LOFTS')
  console.log('=' .repeat(60))

  config({ path: resolve(process.cwd(), '.env.prod') })
  const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const prodClient = createClient(prodUrl, prodKey)

  console.log('🔍 Recherche de traces de données lofts...\n')

  // 1. Vérifier les transactions liées aux lofts
  console.log('📋 Vérification des transactions...')
  try {
    const { data: transactions, error: transError } = await prodClient
      .from('transactions')
      .select('*')
      .ilike('description', '%loft%')
      .limit(10)

    if (!transError && transactions && transactions.length > 0) {
      console.log(`✅ ${transactions.length} transactions mentionnant des lofts trouvées:`)
      transactions.forEach((trans, index) => {
        console.log(`   ${index + 1}. ${trans.description} - ${trans.amount}`)
      })
    } else {
      console.log('⚠️ Aucune transaction liée aux lofts')
    }
  } catch (e) {
    console.log(`❌ Erreur transactions: ${e}`)
  }

  // 2. Vérifier les tâches liées aux lofts
  console.log('\n📋 Vérification des tâches...')
  try {
    const { data: tasks, error: tasksError } = await prodClient
      .from('tasks')
      .select('*')
      .not('loft_id', 'is', null)
      .limit(10)

    if (!tasksError && tasks && tasks.length > 0) {
      console.log(`✅ ${tasks.length} tâches avec loft_id trouvées:`)
      tasks.forEach((task, index) => {
        console.log(`   ${index + 1}. ${task.title} - Loft ID: ${task.loft_id}`)
      })
    } else {
      console.log('⚠️ Aucune tâche liée aux lofts')
    }
  } catch (e) {
    console.log(`❌ Erreur tâches: ${e}`)
  }

  // 3. Créer des données de test pour récupération immédiate
  console.log('\n🏗️ Création de données de récupération d\'urgence...')
  
  const emergencyLofts = [
    {
      name: 'Loft Centre Alger',
      address: '123 Rue Didouche Mourad, Alger Centre',
      price_per_month: 15000,
      status: 'available',
      description: 'Loft moderne au centre d\'Alger avec vue sur la mer',
      company_percentage: 20,
      owner_percentage: 80,
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
      // Champs TV subscription
      frequence_paiement_tv: 'trimestriel',
      prochaine_echeance_tv: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  ]

  // Récupérer les IDs des propriétaires et zones pour les assigner
  const { data: owners } = await prodClient.from('loft_owners').select('id, name').limit(3)
  const { data: zones } = await prodClient.from('zone_areas').select('id, name').limit(3)
  const { data: internetTypes } = await prodClient.from('internet_connection_types').select('id').limit(1)

  if (owners && zones && internetTypes) {
    // Assigner les relations
    emergencyLofts.forEach((loft, index) => {
      (loft as any).owner_id = owners[index % owners.length].id
      ;(loft as any).zone_area_id = zones[index % zones.length].id
      ;(loft as any).internet_connection_type_id = internetTypes[0].id
    })

    console.log('✅ Données d\'urgence préparées avec relations:')
    emergencyLofts.forEach((loft, index) => {
      console.log(`   ${index + 1}. ${loft.name} - ${loft.price_per_month} DA/jour`)
    })

    // Sauvegarder les données d'urgence
    const fs = await import('fs')
    const emergencyBackup = {
      timestamp: new Date().toISOString(),
      purpose: 'Emergency recovery data',
      lofts: emergencyLofts,
      owners: owners,
      zones: zones
    }
    
    fs.writeFileSync('emergency-lofts-recovery.json', JSON.stringify(emergencyBackup, null, 2))
    console.log('💾 Données d\'urgence sauvegardées: emergency-lofts-recovery.json')

  } else {
    console.log('❌ Impossible de récupérer les données de référence')
  }

  console.log('\n🎯 RECOMMANDATIONS IMMÉDIATES:')
  console.log('1. ⚠️ NE PAS exécuter de scripts de clonage')
  console.log('2. 🔍 Vérifier les logs Supabase pour identifier la cause')
  console.log('3. 💾 Utiliser les données d\'urgence pour restaurer')
  console.log('4. 🔒 Mettre en place des sauvegardes automatiques')
  
  console.log('\n🚑 PROCHAINES ÉTAPES:')
  console.log('• Voulez-vous restaurer les données d\'urgence en production?')
  console.log('• Cela créera 3 lofts de base pour redémarrer le système')
}

emergencyRecovery()