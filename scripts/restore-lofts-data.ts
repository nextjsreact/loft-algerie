#!/usr/bin/env tsx
/**
 * Script pour restaurer les données de base des lofts
 * Crée des lofts d'exemple avec les fonctionnalités TV subscription et pricing quotidien
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function restoreLoftsData() {
  console.log('🏠 RESTAURATION DES DONNÉES LOFTS')
  console.log('=' .repeat(50))

  // Charger l'environnement de production
  config({ path: resolve(process.cwd(), '.env.prod') })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const client = createClient(url, key)

  try {
    // 1. Récupérer les données nécessaires pour les relations
    console.log('📋 Récupération des données de référence...')

    const { data: owners, error: ownersError } = await client
      .from('loft_owners')
      .select('id, name')
      .limit(3)

    const { data: zones, error: zonesError } = await client
      .from('zone_areas')
      .select('id, name')
      .limit(6)

    const { data: internetTypes, error: internetError } = await client
      .from('internet_connection_types')
      .select('id, type, speed')
      .limit(5)

    if (ownersError || zonesError || internetError) {
      console.log('❌ Erreur récupération des données de référence')
      return
    }

    console.log(`✅ ${owners?.length || 0} propriétaires trouvés`)
    console.log(`✅ ${zones?.length || 0} zones trouvées`)
    console.log(`✅ ${internetTypes?.length || 0} types internet trouvés`)

    if (!owners || owners.length === 0 || !zones || zones.length === 0) {
      console.log('❌ Données de référence insuffisantes')
      return
    }

    // 2. Créer des lofts d'exemple
    console.log('\n🏗️ Création des lofts d\'exemple...')

    const sampleLofts = [
      {
        name: 'Loft Moderne Centre-Ville',
        address: '15 Rue Didouche Mourad, Alger Centre',
        price_per_month: 8500, // Prix par jour en DA
        status: 'available',
        description: 'Magnifique loft moderne au cœur d\'Alger avec vue panoramique sur la baie. Entièrement équipé avec cuisine moderne, salon spacieux et chambre avec dressing.',
        owner_id: owners[0].id,
        zone_area_id: zones.find(z => z.name.includes('Centre'))?.id || zones[0].id,
        internet_connection_type_id: internetTypes.find(i => i.type === 'Fiber')?.id || internetTypes[0].id,
        company_percentage: 15,
        owner_percentage: 85,
        // Facturation eau
        frequence_paiement_eau: 'bimestriel',
        prochaine_echeance_eau: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Facturation énergie
        frequence_paiement_energie: 'bimestriel',
        prochaine_echeance_energie: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Facturation téléphone
        frequence_paiement_telephone: 'mensuel',
        prochaine_echeance_telephone: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Facturation internet
        frequence_paiement_internet: 'mensuel',
        prochaine_echeance_internet: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Facturation TV (nouvelle fonctionnalité)
        frequence_paiement_tv: 'mensuel',
        prochaine_echeance_tv: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Informations utilitaires
        water_customer_code: 'EAU-ALG-001',
        electricity_customer_number: 'ELEC-001-2025',
        phone_number: '+213 21 123 456'
      },
      {
        name: 'Loft Artistique Hydra',
        address: '42 Chemin des Glycines, Hydra, Alger',
        price_per_month: 12000, // Prix par jour en DA
        status: 'occupied',
        description: 'Loft artistique unique dans le quartier résidentiel d\'Hydra. Espace créatif avec atelier, terrasse privée et jardin. Idéal pour artistes et créateurs.',
        owner_id: owners[1]?.id || owners[0].id,
        zone_area_id: zones.find(z => z.name.includes('Hydra'))?.id || zones[1]?.id || zones[0].id,
        internet_connection_type_id: internetTypes.find(i => i.type === 'Fiber')?.id || internetTypes[0].id,
        company_percentage: 20,
        owner_percentage: 80,
        // Facturation eau
        frequence_paiement_eau: 'trimestriel',
        prochaine_echeance_eau: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Facturation énergie
        frequence_paiement_energie: 'bimestriel',
        prochaine_echeance_energie: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Facturation téléphone
        frequence_paiement_telephone: 'mensuel',
        prochaine_echeance_telephone: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Facturation internet
        frequence_paiement_internet: 'mensuel',
        prochaine_echeance_internet: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Facturation TV
        frequence_paiement_tv: 'trimestriel',
        prochaine_echeance_tv: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Informations utilitaires
        water_customer_code: 'EAU-HYD-002',
        electricity_customer_number: 'ELEC-002-2025',
        phone_number: '+213 21 234 567'
      },
      {
        name: 'Loft Industriel Kouba',
        address: '8 Rue des Frères Bouadou, Kouba, Alger',
        price_per_month: 6500, // Prix par jour en DA
        status: 'maintenance',
        description: 'Loft de style industriel avec poutres apparentes et grandes fenêtres. Espace ouvert parfait pour événements ou résidence moderne. En cours de rénovation.',
        owner_id: owners[2]?.id || owners[0].id,
        zone_area_id: zones.find(z => z.name.includes('Kouba'))?.id || zones[2]?.id || zones[0].id,
        internet_connection_type_id: internetTypes.find(i => i.type === 'Modem')?.id || internetTypes[0].id,
        company_percentage: 25,
        owner_percentage: 75,
        // Facturation eau
        frequence_paiement_eau: 'mensuel',
        prochaine_echeance_eau: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Facturation énergie
        frequence_paiement_energie: 'mensuel',
        prochaine_echeance_energie: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Facturation téléphone
        frequence_paiement_telephone: 'bimestriel',
        prochaine_echeance_telephone: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Facturation internet
        frequence_paiement_internet: 'mensuel',
        prochaine_echeance_internet: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Facturation TV
        frequence_paiement_tv: 'mensuel',
        prochaine_echeance_tv: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Informations utilitaires
        water_customer_code: 'EAU-KOU-003',
        electricity_customer_number: 'ELEC-003-2025',
        phone_number: '+213 21 345 678'
      }
    ]

    // 3. Insérer les lofts
    console.log(`📥 Insertion de ${sampleLofts.length} lofts...`)

    const { data: insertedLofts, error: insertError } = await client
      .from('lofts')
      .insert(sampleLofts)
      .select('id, name, price_per_month, status')

    if (insertError) {
      console.log(`❌ Erreur insertion: ${insertError.message}`)
      
      // Essayer d'insérer un par un
      console.log('🔄 Tentative d\'insertion individuelle...')
      let successCount = 0
      
      for (const loft of sampleLofts) {
        const { data: singleLoft, error: singleError } = await client
          .from('lofts')
          .insert([loft])
          .select('id, name')

        if (singleError) {
          console.log(`❌ ${loft.name}: ${singleError.message}`)
        } else {
          console.log(`✅ ${loft.name}: Créé avec succès`)
          successCount++
        }
      }
      
      console.log(`\n📊 Résultat: ${successCount}/${sampleLofts.length} lofts créés`)
    } else {
      console.log(`✅ ${insertedLofts?.length || 0} lofts créés avec succès!`)
      
      if (insertedLofts) {
        console.log('\n📋 Lofts créés:')
        insertedLofts.forEach(loft => {
          console.log(`   • ${loft.name} (${loft.price_per_month} DA/jour) - ${loft.status}`)
        })
      }
    }

    // 4. Vérification finale
    console.log('\n🔍 Vérification finale...')
    const { count: finalCount } = await client
      .from('lofts')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 Total lofts en production: ${finalCount || 0}`)

    if (finalCount && finalCount > 0) {
      console.log('\n🎉 RESTAURATION RÉUSSIE!')
      console.log('✅ Fonctionnalités incluses:')
      console.log('   • 📺 TV Subscription: Champs configurés')
      console.log('   • 💰 Pricing quotidien en DA')
      console.log('   • 🏠 Différents types de lofts')
      console.log('   • 📅 Calendrier de facturation complet')
      console.log('   • 🌐 Support multi-langue')
      
      console.log('\n💡 Prochaines étapes:')
      console.log('   • Synchronisez avec test: npm run smart-clone:prod-to-test')
      console.log('   • Synchronisez avec dev: npm run smart-clone:prod-to-dev')
      console.log('   • Vérifiez l\'interface: npm run dev')
    }

  } catch (error) {
    console.log(`💥 Erreur: ${error}`)
  }
}

restoreLoftsData().catch(console.error)