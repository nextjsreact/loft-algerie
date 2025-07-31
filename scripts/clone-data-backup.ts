#!/usr/bin/env tsx
/**
 * Script de clonage de données entre environnements
 * Clone les données de production vers test ou développement
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

interface CloneOptions {
  source: 'prod' | 'test' | 'dev'
  target: 'prod' | 'test' | 'dev'
  tables?: string[]
  excludeSensitive?: boolean
  dryRun?: boolean
}

class DataCloner {
  private sourceClient: any
  private targetClient: any
  
  constructor(private options: CloneOptions) {
    // Initialization will happen in cloneData method
  }

  private async initializeClients() {
    // Charger les configurations d'environnement
    const sourceEnv = await this.loadEnvironment(this.options.source)
    const targetEnv = await this.loadEnvironment(this.options.target)

    this.sourceClient = createClient(
      sourceEnv.NEXT_PUBLIC_SUPABASE_URL,
      sourceEnv.SUPABASE_SERVICE_ROLE_KEY
    )

    this.targetClient = createClient(
      targetEnv.NEXT_PUBLIC_SUPABASE_URL,
      targetEnv.SUPABASE_SERVICE_ROLE_KEY
    )
  }

  private async loadEnvironment(env: string) {
    const envFile = `.env.${env === 'dev' ? 'development' : env}`
    
    const fs = await import('fs')
    if (!fs.existsSync(envFile)) {
      throw new Error(`Fichier d'environnement ${envFile} non trouvé`)
    }

    const envContent = readFileSync(envFile, 'utf8')
    const envVars: any = {}
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim()
      }
    })

    return envVars
  }

  async cloneData() {
    // Initialize clients first
    await this.initializeClients()
    
    console.log(`🔄 Clonage des données: ${this.options.source.toUpperCase()} → ${this.options.target.toUpperCase()}`)
    console.log('=' .repeat(70))

    if (this.options.dryRun) {
      console.log('🧪 MODE TEST - Aucune donnée ne sera modifiée')
    }

    // Tables à cloner dans l'ordre (pour respecter les contraintes de clés étrangères)
    const tablesToClone = this.options.tables || [
      // Tables de configuration (d'abord)
      'currencies',
      'categories', 
      'zone_areas',
      'internet_connection_types',
      'payment_methods',
      
      // Tables de base
      'loft_owners',
      'lofts',
      
      // Tables de gestion
      'teams',
      'team_members',
      'tasks',
      
      // Tables transactionnelles
      'transactions',
      'transaction_category_references',
      
      // Configuration système
      'settings'
    ]

    // Tables sensibles qui nécessitent un traitement spécial (anonymisation)
    const sensitiveTables = ['profiles', 'user_sessions']
    
    // Si excludeSensitive est false, on inclut TOUTES les tables
    if (!this.options.excludeSensitive) {
      // Ajouter les tables sensibles à la liste
      tablesToClone.push('profiles', 'user_sessions', 'notifications', 'messages')
    }

    // Traitement spécial pour auth.users (toujours inclus mais avec mots de passe anonymisés)
    await this.cloneAuthUsers()

    let totalRecords = 0
    const results: any = {}

    for (const table of tablesToClone) {
      try {
        console.log(`\n📋 Clonage de la table: ${table}`)
        console.log('-' .repeat(40))

        // Récupérer les données source
        const { data: sourceData, error: sourceError } = await this.sourceClient
          .from(table)
          .select('*')

        if (sourceError) {
          console.log(`⚠️ Erreur lecture ${table}:`, sourceError.message)
          results[table] = { status: 'error', error: sourceError.message }
          continue
        }

        if (!sourceData || sourceData.length === 0) {
          console.log(`ℹ️ Table ${table} vide dans la source`)
          results[table] = { status: 'empty', records: 0 }
          continue
        }

        console.log(`📊 ${sourceData.length} enregistrements trouvés`)

        if (this.options.dryRun) {
          console.log(`🧪 [TEST] Aurait cloné ${sourceData.length} enregistrements`)
          results[table] = { status: 'dry-run', records: sourceData.length }
          totalRecords += sourceData.length
          continue
        }

        // Vider la table cible
        const { error: deleteError } = await this.targetClient
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000') // Supprimer tout

        if (deleteError && !deleteError.message.includes('No rows found')) {
          console.log(`⚠️ Avertissement lors du nettoyage de ${table}:`, deleteError.message)
        }

        // Traitement spécial pour les données sensibles
        let processedData = sourceData
        
        if (table === 'profiles') {
          processedData = this.anonymizeProfiles(sourceData)
        } else if (table === 'user_sessions') {
          processedData = this.anonymizeUserSessions(sourceData)
        } else if (table === 'notifications') {
          processedData = this.anonymizeNotifications(sourceData)
        } else if (table === 'messages') {
          processedData = this.anonymizeMessages(sourceData)
        }

        // Insérer les données par lots pour éviter les timeouts
        const batchSize = 100
        let insertedCount = 0

        for (let i = 0; i < processedData.length; i += batchSize) {
          const batch = processedData.slice(i, i + batchSize)
          
          const { error: insertError } = await this.targetClient
            .from(table)
            .insert(batch)

          if (insertError) {
            console.log(`❌ Erreur insertion lot ${Math.floor(i/batchSize) + 1} pour ${table}:`, insertError.message)
            // Continuer avec le lot suivant
          } else {
            insertedCount += batch.length
            process.stdout.write(`\r📥 Inséré: ${insertedCount}/${processedData.length}`)
          }
        }

        console.log(`\n✅ Table ${table}: ${insertedCount} enregistrements clonés`)
        results[table] = { status: 'success', records: insertedCount }
        totalRecords += insertedCount

      } catch (error) {
        console.log(`💥 Erreur inattendue pour ${table}:`, error)
        results[table] = { status: 'error', error: error.message }
      }
    }

    // Résumé final
    console.log('\n📊 RÉSUMÉ DU CLONAGE')
    console.log('=' .repeat(50))
    console.log(`📈 Total des enregistrements: ${totalRecords}`)
    console.log(`✅ Tables réussies: ${Object.values(results).filter((r: any) => r.status === 'success').length}`)
    console.log(`❌ Tables en erreur: ${Object.values(results).filter((r: any) => r.status === 'error').length}`)
    console.log(`ℹ️ Tables vides: ${Object.values(results).filter((r: any) => r.status === 'empty').length}`)

    // Détail par table
    console.log('\n📋 Détail par table:')
    Object.entries(results).forEach(([table, result]: [string, any]) => {
      const icon = result.status === 'success' ? '✅' : 
                   result.status === 'error' ? '❌' : 
                   result.status === 'empty' ? 'ℹ️' : '🧪'
      console.log(`${icon} ${table}: ${result.records || 0} enregistrements (${result.status})`)
    })

    console.log(`\n🎉 Clonage terminé: ${this.options.source.toUpperCase()} → ${this.options.target.toUpperCase()}`)
    
    if (this.options.target !== 'prod') {
      console.log('💡 Vous pouvez maintenant tester avec: npm run env:switch:' + this.options.target)
      console.log('🔍 Vérifiez les données avec: npm run verify-env:' + this.options.target)
      
      const password = this.options.target === 'test' ? 'test123' : 'dev123'
      console.log(`🔐 Mot de passe universel pour ${this.options.target.toUpperCase()}: ${password}`)
    }
  }
}

// Interface en ligne de commande
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log('📋 Usage: npm run clone:data <source> <target> [options]')
    console.log('')
    console.log('Environnements disponibles: prod, test, dev')
    console.log('')
    console.log('Exemples:')
    console.log('• npm run clone:prod-to-test    # Production → Test')
    console.log('• npm run clone:prod-to-dev     # Production → Développement') 
    console.log('• npm run clone:test-to-dev     # Test → Développement')
    console.log('')
    console.log('Options:')
    console.log('• --dry-run                     # Mode test (aucune modification)')
    console.log('• --exclude-sensitive           # Exclure les données sensibles')
    return
  }

  const [source, target] = args
  const options: CloneOptions = {
    source: source as any,
    target: target as any,
    excludeSensitive: args.includes('--exclude-sensitive'),
    dryRun: args.includes('--dry-run')
  }

  // Vérifications de sécurité
  if (target === 'prod') {
    console.log('⚠️ ATTENTION: Vous tentez de cloner vers la PRODUCTION!')
    console.log('❌ Cette opération est interdite pour des raisons de sécurité.')
    console.log('💡 Le clonage ne peut se faire QUE vers test ou dev.')
    return
  }

  if (source === target) {
    console.log('❌ Erreur: La source et la cible ne peuvent pas être identiques')
    return
  }

  const cloner = new DataCloner(options)
  await cloner.cloneData()
}

  // Méthodes d'anonymisation des données sensibles
  private anonymizeProfiles(profiles: any[]): any[] {
    const testPassword = this.options.target === 'test' ? 'test123' : 'dev123'
    
    return profiles.map(profile => ({
      ...profile,
      // Anonymiser les emails sauf les admins
      email: profile.role === 'admin' ? 
        `admin@${this.options.target}.local` : 
        `user${Math.random().toString(36).substr(2, 5)}@${this.options.target}.local`,
      
      // Garder les noms mais les marquer comme test
      full_name: `${profile.full_name} (${this.options.target.toUpperCase()})`,
      
      // Supprimer les tokens sensibles
      airbnb_access_token: null,
      airbnb_refresh_token: null,
      
      // Marquer comme données de test
      updated_at: new Date().toISOString()
    }))
  }

  private anonymizeUserSessions(sessions: any[]): any[] {
    // Supprimer toutes les sessions existantes pour forcer une nouvelle connexion
    return []
  }

  private anonymizeNotifications(notifications: any[]): any[] {
    return notifications.map(notif => ({
      ...notif,
      // Anonymiser les messages personnels
      message: notif.message?.includes('@') ? 
        'Message de test anonymisé' : 
        notif.message,
      
      // Marquer comme lu pour éviter le spam
      is_read: true,
      read_at: new Date().toISOString()
    }))
  }

  private anonymizeMessages(messages: any[]): any[] {
    return messages.map(msg => ({
      ...msg,
      // Anonymiser le contenu des messages
      content: 'Message de test anonymisé',
      
      // Garder la structure mais pas le contenu sensible
      metadata: msg.metadata ? { ...msg.metadata, anonymized: true } : null
    }))
  }

  // Méthode spéciale pour cloner auth.users avec mots de passe anonymisés
  private async cloneAuthUsers() {
    console.log(`\n🔐 Clonage spécial: auth.users (avec mots de passe anonymisés)`)
    console.log('-' .repeat(50))

    try {
      // Récupérer tous les utilisateurs de la source
      const { data: sourceUsers, error: sourceError } = await this.sourceClient
        .from('users')
        .select('*')

      if (sourceError) {
        console.log(`⚠️ Erreur lecture auth.users:`, sourceError.message)
        return
      }

      if (!sourceUsers || sourceUsers.length === 0) {
        console.log(`ℹ️ Aucun utilisateur trouvé dans auth.users`)
        return
      }

      console.log(`👥 ${sourceUsers.length} utilisateurs trouvés`)

      // Anonymiser les mots de passe
      const testPassword = this.options.target === 'test' ? 'test123' : 'dev123'
      const hashedPassword = '$2a$10$' + Buffer.from(testPassword).toString('base64').padEnd(53, 'A').substring(0, 53)

      const anonymizedUsers = sourceUsers.map(user => ({
        ...user,
        // Remplacer le mot de passe par le mot de passe de test
        encrypted_password: hashedPassword,
        
        // Anonymiser l'email mais garder la structure
        email: user.email?.includes('@') ? 
          `user${user.email.split('@')[0].slice(-3)}@${this.options.target}.local` : 
          `user${Math.random().toString(36).substr(2, 5)}@${this.options.target}.local`,
        
        // Supprimer les tokens sensibles
        recovery_token: null,
        email_change_token_new: null,
        email_change_token_current: null,
        reauthentication_token: null,
        
        // Marquer comme confirmé pour éviter les problèmes de validation
        email_confirmed_at: user.email_confirmed_at || new Date().toISOString(),
        confirmed_at: user.confirmed_at || new Date().toISOString(),
        
        // Mettre à jour les métadonnées
        raw_user_meta_data: {
          ...user.raw_user_meta_data,
          environment: this.options.target,
          anonymized: true,
          original_email_hash: user.email ? Buffer.from(user.email).toString('base64').substring(0, 8) : null
        },
        
        updated_at: new Date().toISOString()
      }))

      // Vider la table auth.users cible
      const { error: deleteError } = await this.targetClient
        .from('users')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (deleteError && !deleteError.message.includes('No rows found')) {
        console.log(`⚠️ Avertissement nettoyage auth.users:`, deleteError.message)
      }

      // Insérer les utilisateurs anonymisés
      const { error: insertError } = await this.targetClient
        .from('users')
        .insert(anonymizedUsers)

      if (insertError) {
        console.log(`❌ Erreur insertion auth.users:`, insertError.message)
      } else {
        console.log(`✅ ${anonymizedUsers.length} utilisateurs clonés avec mots de passe anonymisés`)
        console.log(`🔑 Mot de passe universel: ${testPassword}`)
      }

    } catch (error) {
      console.log(`💥 Erreur lors du clonage auth.users:`, error)
    }
  }

  // Nouvelle méthode pour créer des utilisateurs de test
  private async createTestUsers() {
    try {
      const testUsers = [
        {
          email: 'admin@test.local',
          full_name: 'Admin Test',
          role: 'admin'
        },
        {
          email: 'manager@test.local', 
          full_name: 'Manager Test',
          role: 'manager'
        },
        {
          email: 'user@test.local',
          full_name: 'User Test', 
          role: 'member'
        }
      ]

      // Supprimer les anciens utilisateurs de test
      await this.targetClient
        .from('profiles')
        .delete()
        .like('email', '%@test.local')

      // Créer les nouveaux utilisateurs de test
      const { data, error } = await this.targetClient
        .from('profiles')
        .insert(testUsers.map(user => ({
          id: crypto.randomUUID(),
          ...user,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })))

      if (error) {
        console.log('⚠️ Erreur création utilisateurs de test:', error.message)
      } else {
        console.log('✅ Utilisateurs de test créés:')
        testUsers.forEach(user => {
          console.log(`   • ${user.email} (${user.role})`)
        })
        console.log('🔑 Mot de passe par défaut: test123')
      }
    } catch (error) {
      console.log('⚠️ Erreur lors de la création des utilisateurs de test:', error)
    }
  }

  // Nouvelle méthode de vérification post-clonage
  async verifyClone() {
    console.log('\n🔍 VÉRIFICATION POST-CLONAGE')
    console.log('=' .repeat(40))

    const verificationQueries = [
      { name: 'Profiles', query: 'profiles', expected: '> 0' },
      { name: 'Lofts', query: 'lofts', expected: '> 0' },
      { name: 'Loft Owners', query: 'loft_owners', expected: '> 0' },
      { name: 'Currencies', query: 'currencies', expected: '> 0' }
    ]

    for (const check of verificationQueries) {
      try {
        const { data, error } = await this.targetClient
          .from(check.query)
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.log(`❌ ${check.name}: Erreur - ${error.message}`)
        } else {
          const count = data?.length || 0
          const status = count > 0 ? '✅' : '⚠️'
          console.log(`${status} ${check.name}: ${count} enregistrements`)
        }
      } catch (error) {
        console.log(`❌ ${check.name}: Erreur de vérification`)
      }
    }

    // Vérifier les colonnes TV spécifiquement
    try {
      const { data: loftSample } = await this.targetClient
        .from('lofts')
        .select('frequence_paiement_tv, prochaine_echeance_tv')
        .limit(1)

      if (loftSample && loftSample.length > 0) {
        const hasTV = loftSample[0].hasOwnProperty('frequence_paiement_tv')
        console.log(`${hasTV ? '✅' : '❌'} Colonnes TV: ${hasTV ? 'Présentes' : 'Manquantes'}`)
      }
    } catch (error) {
      console.log('⚠️ Impossible de vérifier les colonnes TV')
    }

    console.log('\n🎯 Vérification terminée!')
  }
}

}

// Interface en ligne de commande
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log('📋 Usage: npm run clone:data <source> <target> [options]')
    console.log('')
    console.log('Environnements disponibles: prod, test, dev')
    console.log('')
    console.log('Exemples:')
    console.log('• npm run clone:prod-to-test    # Production → Test')
    console.log('• npm run clone:prod-to-dev     # Production → Développement') 
    console.log('• npm run clone:test-to-dev     # Test → Développement')
    console.log('')
    console.log('Options:')
    console.log('• --dry-run                     # Mode test (aucune modification)')
    console.log('• --exclude-sensitive           # Exclure les données sensibles')
    return
  }

  const [source, target] = args
  const options: CloneOptions = {
    source: source as any,
    target: target as any,
    excludeSensitive: args.includes('--exclude-sensitive'),
    dryRun: args.includes('--dry-run')
  }

  // Vérifications de sécurité
  if (target === 'prod') {
    console.log('⚠️ ATTENTION: Vous tentez de cloner vers la PRODUCTION!')
    console.log('❌ Cette opération est interdite pour des raisons de sécurité.')
    console.log('💡 Le clonage ne peut se faire QUE vers test ou dev.')
    return
  }

  if (source === target) {
    console.log('❌ Erreur: La source et la cible ne peuvent pas être identiques')
    return
  }

  const cloner = new DataCloner(options)
  await cloner.cloneData()
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { DataCloner }