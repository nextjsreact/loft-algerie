#!/usr/bin/env tsx
/**
 * CORRECTION DE LA SYNCHRONISATION PROFILES
 * Gère les problèmes d'enum et synchronise les profils
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'

interface Environment {
  name: string
  url: string
  key: string
  client: any
}

class ProfilesSync {
  private sourceEnv!: Environment
  private targetEnv!: Environment

  constructor(private sourceName: string, private targetName: string) {}

  private loadEnvironment(envName: string): Environment {
    const envFile = envName === 'dev' ? '.env.development' : `.env.${envName}`
    
    if (!existsSync(envFile)) {
      throw new Error(`❌ Fichier ${envFile} non trouvé`)
    }

    const envContent = readFileSync(envFile, 'utf8')
    const envVars: any = {}
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim()
      }
    })

    return {
      name: envName,
      url: envVars.NEXT_PUBLIC_SUPABASE_URL,
      key: envVars.SUPABASE_SERVICE_ROLE_KEY,
      client: createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY)
    }
  }

  private async initializeEnvironments(): Promise<void> {
    console.log(`🔗 Initialisation des environnements ${this.sourceName.toUpperCase()} → ${this.targetName.toUpperCase()}`)
    
    this.sourceEnv = this.loadEnvironment(this.sourceName)
    this.targetEnv = this.loadEnvironment(this.targetName)
    
    console.log(`✅ Connexions établies`)
  }

  private normalizeRole(role: string): string {
    // Mapper les rôles PROD vers les rôles acceptés par TEST
    const roleMapping: { [key: string]: string } = {
      'executive': 'admin',
      'manager': 'admin', 
      'employee': 'user',
      'admin': 'admin',
      'user': 'user'
    }

    return roleMapping[role] || 'user'
  }

  async syncProfiles(): Promise<void> {
    console.log('👥 SYNCHRONISATION DES PROFILS')
    console.log('='.repeat(40))

    await this.initializeEnvironments()

    try {
      // Récupérer les profils source
      const { data: sourceProfiles, error: sourceError } = await this.sourceEnv.client
        .from('profiles')
        .select('id, email, full_name, role, created_at, updated_at')

      if (sourceError) {
        console.log(`❌ Erreur source: ${sourceError.message}`)
        return
      }

      if (!sourceProfiles || sourceProfiles.length === 0) {
        console.log(`ℹ️ Aucun profil à synchroniser`)
        return
      }

      console.log(`📊 ${sourceProfiles.length} profils à synchroniser`)

      // Nettoyer les profils existants
      const { error: deleteError } = await this.targetEnv.client
        .from('profiles')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (deleteError && !deleteError.message.includes('No rows found')) {
        console.log(`⚠️ Nettoyage: ${deleteError.message}`)
      }

      // Normaliser et insérer les profils
      const normalizedProfiles = sourceProfiles.map(profile => ({
        ...profile,
        role: this.normalizeRole(profile.role)
      }))

      console.log('\n📋 Profils à insérer:')
      normalizedProfiles.forEach(profile => {
        console.log(`   • ${profile.email} (${profile.role})`)
      })

      // Insérer par lots
      const batchSize = 5
      let insertedCount = 0

      for (let i = 0; i < normalizedProfiles.length; i += batchSize) {
        const batch = normalizedProfiles.slice(i, i + batchSize)
        
        const { error: insertError } = await this.targetEnv.client
          .from('profiles')
          .insert(batch)

        if (insertError) {
          console.log(`⚠️ Erreur lot ${Math.floor(i/batchSize) + 1}: ${insertError.message}`)
          
          // Essayer insertion individuelle
          for (const profile of batch) {
            const { error: singleError } = await this.targetEnv.client
              .from('profiles')
              .insert([profile])
            
            if (!singleError) {
              insertedCount++
              console.log(`   ✅ ${profile.email} inséré`)
            } else {
              console.log(`   ❌ ${profile.email}: ${singleError.message}`)
            }
          }
        } else {
          insertedCount += batch.length
          console.log(`   ✅ Lot ${Math.floor(i/batchSize) + 1} inséré (${batch.length} profils)`)
        }
      }

      console.log(`\n📊 RÉSULTAT: ${insertedCount}/${sourceProfiles.length} profils synchronisés`)

      if (insertedCount > 0) {
        console.log('\n🎉 PROFILS SYNCHRONISÉS AVEC SUCCÈS!')
        console.log('🔄 Vous pouvez maintenant relancer la synchronisation complète')
        console.log('npx tsx scripts/complete-table-sync.ts prod test')
      }

    } catch (error) {
      console.error('❌ Erreur:', error)
    }
  }
}

// Interface en ligne de commande
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length !== 2) {
    console.log('Usage: npx tsx scripts/fix-profiles-sync.ts <source> <target>')
    console.log('Exemple: npx tsx scripts/fix-profiles-sync.ts prod test')
    process.exit(1)
  }

  const [source, target] = args
  const sync = new ProfilesSync(source, target)
  
  try {
    await sync.syncProfiles()
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

main().catch(console.error)