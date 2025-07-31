#!/usr/bin/env tsx
/**
 * Script pour vérifier spécifiquement les données de la table lofts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function checkLoftsData() {
  console.log('🏠 VÉRIFICATION DES DONNÉES LOFTS')
  console.log('=' .repeat(50))

  // Charger l'environnement de production
  config({ path: resolve(process.cwd(), '.env.prod') })
  const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const prodClient = createClient(prodUrl, prodKey)

  console.log('🔍 Vérification de la table lofts en production...\n')

  try {
    // 1. Compter les enregistrements
    const { count, error: countError } = await prodClient
      .from('lofts')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.log(`❌ Erreur lors du comptage: ${countError.message}`)
      return
    }

    console.log(`📊 Nombre total d'enregistrements: ${count || 0}`)

    if (count === 0) {
      console.log('⚠️ LA TABLE LOFTS EST VIDE!')
      
      // Vérifier s'il y a des données supprimées récemment
      console.log('\n🔍 Recherche de traces de suppression...')
      
      // Vérifier les logs d'audit si disponibles
      try {
        const { data: auditLogs, error: auditError } = await prodClient
          .from('audit_logs')
          .select('*')
          .eq('table_name', 'lofts')
          .order('created_at', { ascending: false })
          .limit(10)

        if (!auditError && auditLogs && auditLogs.length > 0) {
          console.log('📋 Logs d\'audit trouvés:')
          auditLogs.forEach((log, index) => {
            console.log(`   ${index + 1}. ${log.action} - ${log.created_at}`)
          })
        } else {
          console.log('ℹ️ Aucun log d\'audit disponible')
        }
      } catch (e) {
        console.log('ℹ️ Table audit_logs non disponible')
      }

    } else {
      // Afficher quelques enregistrements
      const { data: lofts, error: dataError } = await prodClient
        .from('lofts')
        .select('*')
        .limit(5)

      if (dataError) {
        console.log(`❌ Erreur lors de la récupération: ${dataError.message}`)
      } else {
        console.log('\n📋 Échantillon des données:')
        lofts?.forEach((loft, index) => {
          console.log(`   ${index + 1}. ${loft.name} - ${loft.address}`)
        })
      }
    }

    // 2. Vérifier la structure de la table
    console.log('\n🔍 Vérification de la structure de la table...')
    
    const { data: sampleData, error: structError } = await prodClient
      .from('lofts')
      .select('*')
      .limit(1)

    if (!structError) {
      if (sampleData && sampleData.length > 0) {
        const columns = Object.keys(sampleData[0])
        console.log(`📊 Colonnes disponibles (${columns.length}): ${columns.join(', ')}`)
      } else {
        // Table vide, essayer de déterminer la structure autrement
        console.log('⚠️ Impossible de déterminer la structure - table vide')
      }
    }

    // 3. Vérifier les contraintes et relations
    console.log('\n🔍 Vérification des relations...')
    
    // Vérifier les owners
    const { count: ownersCount } = await prodClient
      .from('loft_owners')
      .select('*', { count: 'exact', head: true })
    
    console.log(`👥 Propriétaires disponibles: ${ownersCount || 0}`)

    // Vérifier les zones
    const { count: zonesCount } = await prodClient
      .from('zone_areas')
      .select('*', { count: 'exact', head: true })
    
    console.log(`🗺️ Zones disponibles: ${zonesCount || 0}`)

  } catch (error) {
    console.log(`💥 Erreur générale: ${error}`)
  }

  // 4. Suggestions de récupération
  console.log('\n🎯 ANALYSE ET RECOMMANDATIONS:')
  
  if (count === 0) {
    console.log('❌ PROBLÈME CONFIRMÉ: Table lofts vide en production')
    console.log('\n🔧 Options de récupération:')
    console.log('1. Vérifier s\'il y a une sauvegarde récente')
    console.log('2. Vérifier les environnements test/dev pour des données')
    console.log('3. Recréer les lofts manuellement si nécessaire')
    console.log('4. Vérifier les logs Supabase pour identifier la cause')
    
    console.log('\n⚠️ ACTIONS IMMÉDIATES:')
    console.log('• NE PAS exécuter de scripts de clonage pour le moment')
    console.log('• Vérifier les autres environnements')
    console.log('• Identifier la cause de la suppression')
  } else {
    console.log('✅ Données présentes - pas de problème détecté')
  }
}

checkLoftsData()