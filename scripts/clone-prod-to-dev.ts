#!/usr/bin/env tsx
/**
 * Script spécialisé: Clonage Production → Développement
 * Clone les données de production vers l'environnement de développement
 */

import { DataCloner } from './clone-data'

async function cloneProdToDev() {
  console.log('🔧 CLONAGE PRODUCTION → DÉVELOPPEMENT')
  console.log('=' .repeat(50))
  console.log('Ce script clone les données de production vers l\'environnement de développement.')
  console.log('⚠️ Les données existantes en développement seront remplacées.\n')

  // Confirmation de sécurité
  const { createInterface } = await import('readline')
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const confirm = await new Promise(resolve => {
    rl.question('Êtes-vous sûr de vouloir remplacer les données de développement? (tapez OUI): ', resolve)
  })

  rl.close()

  if (confirm !== 'OUI') {
    console.log('❌ Opération annulée')
    return
  }

  const cloner = new DataCloner({
    source: 'prod',
    target: 'dev',
    excludeSensitive: false, // Inclure TOUTES les données (avec anonymisation)
    dryRun: false
  })

  await cloner.cloneData()
  
  console.log('\n🎯 RECOMMANDATIONS POST-CLONAGE:')
  console.log('• Testez la connexion: npm run env:switch:dev && npm run dev')
  console.log('• TOUTES les données ont été clonées avec anonymisation')
  console.log('• Mot de passe universel pour DEV: dev123')
  console.log('• Tous les utilisateurs peuvent se connecter avec: dev123')
  console.log('• Les données sont maintenant synchronisées avec la production')
}

cloneProdToDev().catch(console.error)