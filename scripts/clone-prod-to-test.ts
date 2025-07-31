#!/usr/bin/env tsx
/**
 * Script spécialisé: Clonage Production → Test
 * Clone les données de production vers l'environnement de test
 */

import { DataCloner } from './clone-data'

async function cloneProdToTest() {
  console.log('🚀 CLONAGE PRODUCTION → TEST')
  console.log('=' .repeat(50))
  console.log('Ce script clone les données de production vers l\'environnement de test.')
  console.log('⚠️ Les données existantes en test seront remplacées.\n')

  // Confirmation de sécurité
  const { createInterface } = await import('readline')
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const confirm = await new Promise(resolve => {
    rl.question('Êtes-vous sûr de vouloir remplacer les données de test? (tapez OUI): ', resolve)
  })

  rl.close()

  if (confirm !== 'OUI') {
    console.log('❌ Opération annulée')
    return
  }

  const cloner = new DataCloner({
    source: 'prod',
    target: 'test',
    excludeSensitive: false, // Inclure TOUTES les données (avec anonymisation)
    dryRun: false
  })

  await cloner.cloneData()
  
  // Vérification automatique post-clonage
  console.log('\n🔍 Vérification automatique...')
  await cloner.verifyClone()
  
  console.log('\n🎯 RECOMMANDATIONS POST-CLONAGE:')
  console.log('• Testez la connexion: npm run env:switch:test && npm run dev')
  console.log('• Vérifiez vos colonnes TV: Utilisez vos scripts SQL de vérification')
  console.log('• TOUTES les données ont été clonées avec anonymisation')
  console.log('• Mot de passe universel pour TEST: test123')
  console.log('• Tous les utilisateurs peuvent se connecter avec: test123')
}

cloneProdToTest().catch(console.error)