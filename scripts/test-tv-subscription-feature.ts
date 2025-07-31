#!/usr/bin/env tsx
/**
 * Script de test pour la fonctionnalité d'abonnement TV
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testTvSubscriptionFeature() {
  console.log('📺 Test de la fonctionnalité d\'abonnement TV')
  console.log('=' .repeat(50))

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // 1. Vérifier que les colonnes TV existent
    console.log('\n🔍 Vérification des colonnes TV dans la table lofts...')
    
    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .select('id, name, frequence_paiement_tv, prochaine_echeance_tv')
      .limit(5)

    if (loftsError) {
      console.error('❌ Erreur lors de la récupération des lofts:', loftsError.message)
      if (loftsError.message.includes('column') && loftsError.message.includes('does not exist')) {
        console.log('💡 Les colonnes TV n\'existent pas encore. Appliquez le script:')
        console.log('   scripts/add-tv-subscription-fields.sql')
        return
      }
      return
    }

    console.log('✅ Colonnes TV détectées dans la table lofts')
    console.log(`📊 ${lofts?.length || 0} lofts trouvés`)

    // 2. Tester la fonction get_upcoming_bills avec TV
    console.log('\n🔍 Test de la fonction get_upcoming_bills avec TV...')
    
    const { data: upcomingBills, error: upcomingError } = await supabase
      .rpc('get_upcoming_bills', { days_ahead: 30 })

    if (upcomingError) {
      console.error('❌ Erreur get_upcoming_bills:', upcomingError.message)
    } else {
      console.log(`✅ Fonction get_upcoming_bills fonctionne`)
      const tvBills = upcomingBills?.filter(bill => bill.utility_type === 'tv') || []
      console.log(`📺 ${tvBills.length} factures TV à venir trouvées`)
      
      if (tvBills.length > 0) {
        console.log('📋 Factures TV à venir:')
        tvBills.forEach(bill => {
          console.log(`  - ${bill.loft_name}: ${bill.due_date} (${bill.frequency})`)
        })
      }
    }

    // 3. Tester la fonction get_overdue_bills avec TV
    console.log('\n🔍 Test de la fonction get_overdue_bills avec TV...')
    
    const { data: overdueBills, error: overdueError } = await supabase
      .rpc('get_overdue_bills')

    if (overdueError) {
      console.error('❌ Erreur get_overdue_bills:', overdueError.message)
    } else {
      console.log(`✅ Fonction get_overdue_bills fonctionne`)
      const tvOverdueBills = overdueBills?.filter(bill => bill.utility_type === 'tv') || []
      console.log(`📺 ${tvOverdueBills.length} factures TV en retard trouvées`)
      
      if (tvOverdueBills.length > 0) {
        console.log('📋 Factures TV en retard:')
        tvOverdueBills.forEach(bill => {
          console.log(`  - ${bill.loft_name}: ${bill.due_date} (${bill.days_overdue} jours de retard)`)
        })
      }
    }

    // 4. Créer un exemple de loft avec abonnement TV
    console.log('\n🏗️ Test de création d\'un loft avec abonnement TV...')
    
    const testLoftData = {
      name: 'Test Loft TV - ' + Date.now(),
      address: '123 Test Street',
      price_per_month: 1000,
      company_percentage: 50,
      owner_percentage: 50,
      frequence_paiement_tv: 'mensuel',
      prochaine_echeance_tv: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Dans 15 jours
    }

    const { data: newLoft, error: createError } = await supabase
      .from('lofts')
      .insert(testLoftData)
      .select()
      .single()

    if (createError) {
      console.error('❌ Erreur lors de la création du loft test:', createError.message)
    } else {
      console.log('✅ Loft test créé avec succès')
      console.log(`📺 Abonnement TV: ${newLoft.frequence_paiement_tv}`)
      console.log(`📅 Prochaine facture: ${newLoft.prochaine_echeance_tv}`)

      // Nettoyer le loft test
      await supabase.from('lofts').delete().eq('id', newLoft.id)
      console.log('🧹 Loft test supprimé')
    }

    // 5. Statistiques finales
    console.log('\n📊 Statistiques des abonnements TV:')
    console.log('-' .repeat(40))
    
    const { data: tvStats, error: statsError } = await supabase
      .from('lofts')
      .select('frequence_paiement_tv, prochaine_echeance_tv')
      .not('frequence_paiement_tv', 'is', null)

    if (!statsError && tvStats) {
      console.log(`📺 Lofts avec abonnement TV configuré: ${tvStats.length}`)
      
      const frequencies = tvStats.reduce((acc, loft) => {
        const freq = loft.frequence_paiement_tv || 'non défini'
        acc[freq] = (acc[freq] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      console.log('📋 Répartition des fréquences:')
      Object.entries(frequencies).forEach(([freq, count]) => {
        console.log(`  - ${freq}: ${count}`)
      })
    }

    console.log('\n✅ Test de la fonctionnalité TV terminé avec succès!')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

testTvSubscriptionFeature()