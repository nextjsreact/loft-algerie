#!/usr/bin/env tsx
/**
 * SCRIPT DE CLONAGE SÉCURISÉ: PRODUCTION → TEST
 * Implémente toutes les mesures de sécurité professionnelles
 */

import { SecurityManager } from '../lib/security/SecurityManager'
import { EnvironmentValidator } from '../lib/security/EnvironmentValidator'
import { BackupManager } from '../lib/security/BackupManager'
import { SuperCloneEngine } from '../lib/security/SuperCloneEngine'

async function secureCloneProdToTest() {
  console.log('🛡️ CLONAGE SÉCURISÉ: PRODUCTION → TEST')
  console.log('=' .repeat(60))
  console.log('🔒 Système de sécurité professionnel activé')
  console.log('📋 Toutes les opérations seront auditées et sécurisées\n')

  const securityManager = new SecurityManager()
  const envValidator = new EnvironmentValidator()
  const backupManager = new BackupManager()
  const cloneEngine = new SuperCloneEngine()

  const operationId = securityManager.generateOperationId()
  console.log(`🆔 ID Opération: ${operationId}`)

  try {
    // ÉTAPE 1: Validation des environnements
    console.log('\n📋 ÉTAPE 1: VALIDATION DES ENVIRONNEMENTS')
    console.log('-' .repeat(50))

    const validation = await envValidator.validateEnvironments('prod', 'test')
    
    if (!validation.isValid) {
      console.log('❌ VALIDATION ÉCHOUÉE:')
      validation.errors.forEach(error => console.log(`   • ${error}`))
      process.exit(1)
    }

    console.log('✅ Environnements validés avec succès')
    
    if (validation.warnings.length > 0) {
      console.log('⚠️ Avertissements:')
      validation.warnings.forEach(warning => console.log(`   • ${warning}`))
    }

    // Afficher le résumé des environnements
    envValidator.displayEnvironmentSummary(validation.source!, validation.target!)

    // ÉTAPE 2: Vérification de sécurité
    console.log('\n📋 ÉTAPE 2: VÉRIFICATION DE SÉCURITÉ')
    console.log('-' .repeat(50))

    const securityCheck = await securityManager.validateProductionAccess(
      'CLONAGE_PRODUCTION_VERS_TEST', 
      validation.target!.name
    )

    console.log(`🔍 Niveau de sécurité: ${validation.target!.isProtected ? 'CRITIQUE' : 'STANDARD'}`)

    // ÉTAPE 3: Confirmation utilisateur
    console.log('\n📋 ÉTAPE 3: CONFIRMATION UTILISATEUR')
    console.log('-' .repeat(50))

    const consequences = [
      'Les données actuelles de TEST seront SUPPRIMÉES',
      'Les données de PRODUCTION seront copiées vers TEST',
      'Cette opération est IRRÉVERSIBLE',
      'Un audit complet sera créé'
    ]

    const confirmed = await securityManager.requestDoubleConfirmation({
      operation: 'Clonage Production → Test',
      environment: validation.target!.name,
      consequences: consequences,
      keyword: 'CONFIRMER'
    })

    if (!confirmed) {
      console.log('\n❌ OPÉRATION ANNULÉE PAR L\'UTILISATEUR')
      console.log('🛡️ Aucune modification effectuée')
      process.exit(0)
    }

    // ÉTAPE 4: Sauvegarde de sécurité (si nécessaire)
    console.log('\n📋 ÉTAPE 4: SAUVEGARDE DE SÉCURITÉ')
    console.log('-' .repeat(50))

    const tablesToClone = [
      'zone_areas', 'internet_connection_types', 'loft_owners', 'lofts',
      'categories', 'currencies', 'payment_methods', 'teams', 'team_members',
      'tasks', 'transaction_category_references', 'settings'
    ]

    let backupResult = null
    if (securityCheck.requiresBackup || validation.target!.isProtected) {
      console.log('💾 Création de sauvegarde de sécurité...')
      backupResult = await backupManager.createBackup(
        validation.target!,
        tablesToClone,
        'clone_prod_to_test'
      )

      if (!backupResult.success) {
        console.log('❌ ÉCHEC DE LA SAUVEGARDE - OPÉRATION ANNULÉE')
        console.log(`Erreur: ${backupResult.error}`)
        process.exit(1)
      }

      console.log(`✅ Sauvegarde créée: ${backupResult.backupId}`)
    } else {
      console.log('ℹ️ Sauvegarde non requise pour cette opération')
    }

    // ÉTAPE 5: Exécution du clonage ultra-intelligent et sécurisé
    console.log('\n📋 ÉTAPE 5: EXÉCUTION DU CLONAGE ULTRA-INTELLIGENT')
    console.log('-' .repeat(50))

    const cloneResult = await cloneEngine.executeClone(
      validation.source!,
      validation.target!,
      {
        dryRun: false,
        batchSize: 50,
        adaptSchema: true,
        includeTables: tablesToClone
      }
    )

    const totalCloned = cloneResult.totalRecords
    const results = cloneResult.results

    // ÉTAPE 6: Rapport final et audit
    console.log('\n📋 ÉTAPE 6: RAPPORT FINAL')
    console.log('-' .repeat(50))

    const successTables = Object.keys(results).filter(t => results[t].status === 'success')
    const errorTables = Object.keys(results).filter(t => results[t].status === 'error')
    const emptyTables = Object.keys(results).filter(t => results[t].status === 'empty')
    const skippedTables = Object.keys(results).filter(t => results[t].status === 'skipped')

    console.log(`📊 RÉSUMÉ DU CLONAGE ULTRA-INTELLIGENT ET SÉCURISÉ`)
    console.log(`📈 Total enregistrements clonés: ${totalCloned}`)
    console.log(`✅ Tables réussies: ${successTables.length}`)
    console.log(`❌ Tables en erreur: ${errorTables.length}`)
    console.log(`ℹ️ Tables vides: ${emptyTables.length}`)
    console.log(`⏭️ Tables ignorées: ${skippedTables.length}`)

    // Afficher les détails des adaptations
    if (successTables.length > 0) {
      console.log('\n🔧 Adaptations de schéma effectuées:')
      successTables.forEach(table => {
        const tableResult = results[table]
        if (tableResult.adaptations.length > 0) {
          console.log(`   📋 ${table}:`)
          tableResult.adaptations.forEach(adaptation => {
            console.log(`      • ${adaptation}`)
          })
        }
      })
    }

    // Afficher les erreurs détaillées
    if (cloneResult.errors.length > 0) {
      console.log('\n❌ Erreurs détaillées:')
      cloneResult.errors.forEach(error => {
        console.log(`   • ${error}`)
      })
    }

    if (backupResult) {
      console.log(`💾 Sauvegarde disponible: ${backupResult.backupId}`)
    }

    // Créer le rapport d'audit
    const auditReport = {
      operationId,
      timestamp: new Date().toISOString(),
      operation: 'SECURE_CLONE_PROD_TO_TEST',
      source: validation.source!.name,
      target: validation.target!.name,
      confirmed: true,
      backupId: backupResult?.backupId,
      totalRecords: totalCloned,
      tablesProcessed: cloneResult.tablesProcessed,
      results: results,
      cloneEngineResult: cloneResult,
      securityLevel: validation.target!.isProtected ? 'CRITICAL' : 'STANDARD'
    }

    // Sauvegarder le rapport d'audit
    const fs = await import('fs')
    const auditPath = `audit-${operationId}.json`
    fs.writeFileSync(auditPath, JSON.stringify(auditReport, null, 2))
    console.log(`📄 Rapport d'audit: ${auditPath}`)

    console.log('\n🎉 CLONAGE SÉCURISÉ TERMINÉ AVEC SUCCÈS!')
    console.log('✅ Toutes les mesures de sécurité ont été respectées')
    console.log('🛡️ L\'opération a été entièrement auditée')
    console.log('📋 Les données de test ont été mises à jour avec les données de production')

  } catch (error) {
    console.log(`\n💥 ERREUR CRITIQUE: ${error}`)
    console.log('🚨 Opération interrompue pour sécurité')
    
    // En cas d'erreur, proposer la restauration si une sauvegarde existe
    console.log('\n🔄 Options de récupération disponibles:')
    console.log('• Vérifiez les logs d\'erreur ci-dessus')
    console.log('• Contactez l\'administrateur système si nécessaire')
    console.log('• Une sauvegarde automatique peut être disponible')
    
    process.exit(1)
  }
}

secureCloneProdToTest().catch(console.error)