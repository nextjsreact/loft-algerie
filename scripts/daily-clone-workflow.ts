#!/usr/bin/env tsx
/**
 * Workflow quotidien de clonage et vérification
 * Combine clonage + vérification + rapport
 */

import { DataCloner } from './clone-data'

async function dailyWorkflow() {
  const args = process.argv.slice(2)
  const targetEnv = args[0] || 'test'
  
  if (!['test', 'dev'].includes(targetEnv)) {
    console.log('❌ Environnement cible non valide. Utilisez: test ou dev')
    return
  }

  console.log('🚀 WORKFLOW QUOTIDIEN DE CLONAGE')
  console.log('=' .repeat(50))
  console.log(`📅 ${new Date().toLocaleDateString('fr-FR')}`)
  console.log(`🎯 Cible: ${targetEnv.toUpperCase()}`)
  console.log('')

  // Étape 1: Confirmation
  const { createInterface } = await import('readline')
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  console.log(`⚠️ Cette opération va remplacer toutes les données de ${targetEnv.toUpperCase()}`)
  const confirm = await new Promise(resolve => {
    rl.question('Continuer? (tapez OUI): ', resolve)
  })
  rl.close()

  if (confirm !== 'OUI') {
    console.log('❌ Opération annulée')
    return
  }

  try {
    // Étape 2: Clonage
    console.log('\n📋 ÉTAPE 1: CLONAGE DES DONNÉES')
    console.log('-' .repeat(40))
    
    const cloner = new DataCloner({
      source: 'prod',
      target: targetEnv as 'test' | 'dev',
      excludeSensitive: true,
      dryRun: false
    })

    await cloner.cloneData()

    // Étape 3: Vérification automatique
    console.log('\n🔍 ÉTAPE 2: VÉRIFICATION AUTOMATIQUE')
    console.log('-' .repeat(40))
    
    await cloner.verifyClone()

    // Étape 4: Rapport final
    console.log('\n📊 ÉTAPE 3: RAPPORT FINAL')
    console.log('-' .repeat(40))
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const reportFile = `./logs/clone-report-${targetEnv}-${timestamp}.md`
    
    const report = `# Rapport de Clonage Quotidien

**Date:** ${new Date().toLocaleString('fr-FR')}
**Source:** PRODUCTION
**Cible:** ${targetEnv.toUpperCase()}
**Status:** ✅ RÉUSSI

## Actions effectuées
- ✅ Clonage des données de configuration
- ✅ Clonage des données de base (lofts, propriétaires)
- ✅ Exclusion des données sensibles
- ✅ Création automatique des utilisateurs de test
- ✅ Vérification post-clonage

## Utilisateurs de test créés
- admin@test.local (Admin)
- manager@test.local (Manager)
- user@test.local (Utilisateur)
- **Mot de passe:** test123

## Prochaines étapes
1. Testez la connexion: \`npm run env:switch:${targetEnv}\`
2. Lancez l'application: \`npm run dev\`
3. Vérifiez vos fonctionnalités spécifiques
4. Testez les colonnes TV avec vos scripts SQL

## Commandes utiles
\`\`\`bash
# Vérifier l'environnement
npm run verify:${targetEnv}

# Basculer vers l'environnement
npm run env:switch:${targetEnv}

# Vérifier les colonnes TV (vos scripts SQL)
# Utilisez vos scripts dans le dossier scripts/
\`\`\`
`

    // Créer le dossier logs s'il n'existe pas
    const fs = await import('fs')
    if (!fs.existsSync('./logs')) {
      fs.mkdirSync('./logs', { recursive: true })
    }

    fs.writeFileSync(reportFile, report)
    
    console.log('✅ Rapport généré:', reportFile)
    console.log('')
    console.log('🎉 WORKFLOW TERMINÉ AVEC SUCCÈS!')
    console.log('=' .repeat(50))
    console.log(`🔐 Connexion ${targetEnv}: admin@test.local / test123`)
    console.log(`📋 Rapport: ${reportFile}`)
    console.log(`🚀 Commande suivante: npm run env:switch:${targetEnv} && npm run dev`)

  } catch (error) {
    console.log('❌ ERREUR DURANT LE WORKFLOW:', error)
    
    // Rapport d'erreur
    const errorReport = `# Rapport d'Erreur - Clonage

**Date:** ${new Date().toLocaleString('fr-FR')}
**Cible:** ${targetEnv.toUpperCase()}
**Status:** ❌ ÉCHEC

## Erreur
\`\`\`
${error}
\`\`\`

## Actions recommandées
1. Vérifiez la connexion aux bases de données
2. Vérifiez les fichiers .env.${targetEnv}
3. Relancez le workflow: \`npm run daily:clone:${targetEnv}\`
`

    const fs = await import('fs')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const errorFile = `./logs/clone-error-${targetEnv}-${timestamp}.md`
    
    if (!fs.existsSync('./logs')) {
      fs.mkdirSync('./logs', { recursive: true })
    }
    
    fs.writeFileSync(errorFile, errorReport)
    console.log('📋 Rapport d\'erreur:', errorFile)
  }
}

dailyWorkflow().catch(console.error)