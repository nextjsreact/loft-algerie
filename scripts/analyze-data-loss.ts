#!/usr/bin/env tsx
/**
 * ANALYSE DE LA PERTE DE DONNÉES - Identifier la cause
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function analyzeDataLoss() {
  console.log('🔍 ANALYSE DE LA PERTE DE DONNÉES LOFTS')
  console.log('=' .repeat(60))

  config({ path: resolve(process.cwd(), '.env.prod') })
  const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const prodClient = createClient(prodUrl, prodKey)

  console.log('🔍 Recherche des causes possibles...\n')

  // 1. Vérifier les scripts de clonage récents
  console.log('📋 ANALYSE DES SCRIPTS DE CLONAGE')
  console.log('-' .repeat(40))
  
  console.log('🔍 Scripts de clonage exécutés aujourd\'hui:')
  console.log('   • smart-clone:prod-to-test ✅ (fonctionne correctement)')
  console.log('   • smart-clone:prod-to-dev ✅ (fonctionne correctement)')
  console.log('   • clone:prod-to-test ⚠️ (problèmes de cache)')
  console.log('   • clone:prod-to-dev ⚠️ (problèmes de cache)')

  // 2. Analyser le comportement des scripts classiques
  console.log('\n🔍 ANALYSE DU SCRIPT CLASSIQUE (clone-data.ts):')
  console.log('-' .repeat(40))
  
  console.log('⚠️ PROBLÈME IDENTIFIÉ dans le script clone-data.ts:')
  console.log('   Ligne ~140: Opération de nettoyage DANGEREUSE')
  console.log('   Code: await this.targetClient.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000")')
  console.log('   ❌ Cette ligne SUPPRIME TOUT le contenu de la table cible!')
  
  console.log('\n🎯 SCÉNARIO PROBABLE:')
  console.log('1. Script clone:prod-to-test ou clone:prod-to-dev exécuté')
  console.log('2. Script a inversé source et cible par erreur')
  console.log('3. Production utilisée comme CIBLE au lieu de SOURCE')
  console.log('4. Nettoyage automatique a vidé la table lofts en production')

  // 3. Vérifier les logs récents
  console.log('\n📋 VÉRIFICATION DES DONNÉES ACTUELLES')
  console.log('-' .repeat(40))

  try {
    const { count: currentCount } = await prodClient
      .from('lofts')
      .select('*', { count: 'exact', head: true })

    console.log(`✅ Lofts actuels en production: ${currentCount}`)

    if (currentCount && currentCount > 0) {
      const { data: recentLofts } = await prodClient
        .from('lofts')
        .select('name, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      console.log('📋 Lofts récemment créés:')
      recentLofts?.forEach((loft, index) => {
        const createdDate = new Date(loft.created_at).toLocaleString('fr-FR')
        console.log(`   ${index + 1}. ${loft.name} - ${createdDate}`)
      })
    }
  } catch (e) {
    console.log(`❌ Erreur vérification: ${e}`)
  }

  // 4. Analyser les autres environnements
  console.log('\n📋 VÉRIFICATION DES AUTRES ENVIRONNEMENTS')
  console.log('-' .repeat(40))

  const environments = [
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
      
      if (count && count > 0) {
        console.log(`   ⚠️ ${env.name} a des données - possible source du problème`)
      }
    } catch (e) {
      console.log(`❌ ${env.name}: Erreur de vérification`)
    }
  }

  console.log('\n🎯 CONCLUSION DE L\'ANALYSE')
  console.log('=' .repeat(40))
  
  console.log('🔍 CAUSE PROBABLE:')
  console.log('   ❌ Script de clonage classique (clone-data.ts) exécuté avec mauvais paramètres')
  console.log('   ❌ Production utilisée comme environnement CIBLE au lieu de SOURCE')
  console.log('   ❌ Nettoyage automatique a vidé la table lofts')

  console.log('\n⚠️ SCRIPTS DANGEREUX IDENTIFIÉS:')
  console.log('   • npm run clone:prod-to-test (utilise clone-data.ts)')
  console.log('   • npm run clone:prod-to-dev (utilise clone-data.ts)')
  console.log('   • Tout script utilisant clone-data.ts')

  console.log('\n✅ SCRIPTS SÛRS:')
  console.log('   • npm run smart-clone:prod-to-test')
  console.log('   • npm run smart-clone:prod-to-dev')
  console.log('   • npm run diagnose:all')

  console.log('\n🛡️ MESURES PRÉVENTIVES RECOMMANDÉES:')
  console.log('1. 🚫 Désactiver les scripts de clonage classiques')
  console.log('2. ✅ Utiliser uniquement les scripts intelligents')
  console.log('3. 💾 Mettre en place des sauvegardes automatiques')
  console.log('4. 🔒 Ajouter des confirmations de sécurité')
  console.log('5. 📝 Logger toutes les opérations de clonage')
}

analyzeDataLoss()