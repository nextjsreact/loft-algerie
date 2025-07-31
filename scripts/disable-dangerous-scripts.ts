#!/usr/bin/env tsx
/**
 * DÉSACTIVATION DES SCRIPTS DANGEREUX
 */

async function disableDangerousScripts() {
  console.log('🛡️ DÉSACTIVATION DES SCRIPTS DANGEREUX')
  console.log('=' .repeat(50))

  const fs = await import('fs')
  
  // Lire le package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  
  // Sauvegarder l'original
  fs.writeFileSync('package.json.backup', JSON.stringify(packageJson, null, 2))
  console.log('💾 Sauvegarde créée: package.json.backup')

  // Désactiver les scripts dangereux
  const dangerousScripts = [
    'clone:prod-to-test',
    'clone:prod-to-dev', 
    'clone:test-to-dev'
  ]

  console.log('\n🚫 Désactivation des scripts dangereux:')
  
  for (const scriptName of dangerousScripts) {
    if (packageJson.scripts[scriptName]) {
      // Renommer le script pour le désactiver
      const newName = `DISABLED_${scriptName}`
      packageJson.scripts[newName] = `echo "❌ Script désactivé pour sécurité. Utilisez smart-clone à la place." && exit 1`
      delete packageJson.scripts[scriptName]
      console.log(`   ❌ ${scriptName} → ${newName}`)
    }
  }

  // Ajouter des scripts de sécurité
  packageJson.scripts['backup:prod'] = 'tsx scripts/backup-production.ts'
  packageJson.scripts['restore:emergency'] = 'tsx scripts/restore-emergency-lofts.ts'
  
  console.log('\n✅ Scripts de sécurité ajoutés:')
  console.log('   • backup:prod - Sauvegarde de production')
  console.log('   • restore:emergency - Restauration d\'urgence')

  // Sauvegarder le nouveau package.json
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2))
  
  console.log('\n🎉 SÉCURISATION TERMINÉE!')
  console.log('✅ Scripts dangereux désactivés')
  console.log('✅ Scripts sûrs disponibles:')
  console.log('   • npm run smart-clone:prod-to-test')
  console.log('   • npm run smart-clone:prod-to-dev')
  console.log('   • npm run diagnose:all')
  console.log('   • npm run backup:prod')
  console.log('   • npm run restore:emergency')
}

disableDangerousScripts()