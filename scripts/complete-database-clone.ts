#!/usr/bin/env tsx
/**
 * CLONAGE COMPLET DE BASE DE DONNÉES
 * Solution alternative pour cloner complètement PROD vers TEST/DEV
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'

interface Environment {
  name: string
  url: string
  key: string
  client: any
  projectRef: string
}

class CompleteDatabaseClone {
  private environments: Map<string, Environment> = new Map()

  constructor() {
    this.loadEnvironments()
  }

  private loadEnvironments() {
    const envConfigs = [
      { name: 'prod', file: '.env.production' },
      { name: 'test', file: '.env.test' },
      { name: 'dev', file: '.env.development' }
    ]

    for (const config of envConfigs) {
      try {
        if (existsSync(config.file)) {
          const envContent = readFileSync(config.file, 'utf8')
          const envVars: any = {}
          
          envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=')
            if (key && valueParts.length > 0) {
              envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim()
            }
          })

          if (envVars.NEXT_PUBLIC_SUPABASE_URL && envVars.SUPABASE_SERVICE_ROLE_KEY) {
            const hasPlaceholders = envVars.NEXT_PUBLIC_SUPABASE_URL.includes('[') || 
                                   envVars.SUPABASE_SERVICE_ROLE_KEY.includes('[')
            
            if (!hasPlaceholders) {
              const projectRef = this.extractProjectRef(envVars.NEXT_PUBLIC_SUPABASE_URL)
              const env: Environment = {
                name: config.name,
                url: envVars.NEXT_PUBLIC_SUPABASE_URL,
                key: envVars.SUPABASE_SERVICE_ROLE_KEY,
                client: createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY),
                projectRef: projectRef
              }
              this.environments.set(config.name, env)
            }
          }
        }
      } catch (error) {
        // Ignorer les erreurs
      }
    }
  }

  private extractProjectRef(supabaseUrl: string): string {
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)
    return match ? match[1] : 'unknown'
  }

  async showCloneOptions(): Promise<void> {
    console.log('🔄 OPTIONS DE CLONAGE COMPLET')
    console.log('='.repeat(50))

    const prodEnv = this.environments.get('prod')
    const testEnv = this.environments.get('test')
    const devEnv = this.environments.get('dev')

    if (!prodEnv) {
      console.log('❌ Environnement PROD non configuré')
      return
    }

    console.log('\n📋 ENVIRONNEMENTS DÉTECTÉS:')
    console.log(`✅ PROD: ${prodEnv.projectRef}`)
    if (testEnv) console.log(`✅ TEST: ${testEnv.projectRef}`)
    if (devEnv) console.log(`✅ DEV: ${devEnv.projectRef}`)

    console.log('\n🎯 MÉTHODES DE CLONAGE DISPONIBLES:')
    console.log('='.repeat(40))

    console.log('\n1. 📊 SUPABASE DASHBOARD (Recommandé - Plus Simple)')
    console.log('   🔗 Étapes:')
    console.log(`   • Aller sur: https://supabase.com/dashboard/project/${prodEnv.projectRef}`)
    console.log('   • Settings → Database → Database backups')
    console.log('   • Cliquer sur "Download backup"')
    console.log('   • Aller sur TEST/DEV dashboard → Settings → Database')
    console.log('   • Utiliser "Restore from backup"')

    console.log('\n2. 🔧 SUPABASE CLI (Automatique)')
    console.log('   🔗 Commandes:')
    console.log(`   npx supabase db dump --project-ref ${prodEnv.projectRef} --file prod_backup.sql`)
    if (testEnv) {
      console.log(`   npx supabase db reset --project-ref ${testEnv.projectRef} --file prod_backup.sql`)
    }
    if (devEnv) {
      console.log(`   npx supabase db reset --project-ref ${devEnv.projectRef} --file prod_backup.sql`)
    }

    console.log('\n3. 🗄️ POSTGRESQL DIRECT (Avancé)')
    console.log('   🔗 Commandes (nécessite mots de passe DB):')
    console.log(`   pg_dump "postgresql://postgres:[PROD_PASSWORD]@db.${prodEnv.projectRef}.supabase.co:5432/postgres" -f prod_backup.sql`)
    if (testEnv) {
      console.log(`   psql "postgresql://postgres:[TEST_PASSWORD]@db.${testEnv.projectRef}.supabase.co:5432/postgres" -f prod_backup.sql`)
    }
    if (devEnv) {
      console.log(`   psql "postgresql://postgres:[DEV_PASSWORD]@db.${devEnv.projectRef}.supabase.co:5432/postgres" -f prod_backup.sql`)
    }

    console.log('\n4. 🔄 DUPLICATION DE PROJET (Idéal)')
    console.log('   🔗 Étapes:')
    console.log('   • Créer de nouveaux projets Supabase')
    console.log('   • Utiliser la fonction "Fork project" si disponible')
    console.log('   • Ou importer le schéma + données manuellement')

    await this.tryAutomaticClone()
  }

  private async tryAutomaticClone(): Promise<void> {
    console.log('\n🚀 TENTATIVE DE CLONAGE AUTOMATIQUE')
    console.log('='.repeat(50))

    const prodEnv = this.environments.get('prod')
    if (!prodEnv) return

    try {
      console.log('\n📤 Tentative d\'export PROD via Supabase CLI...')
      
      // Essayer d'exporter avec Supabase CLI
      const exportCmd = `npx supabase db dump --project-ref ${prodEnv.projectRef} --file prod_complete_backup.sql`
      console.log(`Commande: ${exportCmd}`)
      
      execSync(exportCmd, { stdio: 'inherit' })
      console.log('✅ Export PROD réussi!')

      // Essayer d'importer vers TEST
      const testEnv = this.environments.get('test')
      if (testEnv) {
        console.log('\n📥 Import vers TEST...')
        const importTestCmd = `npx supabase db reset --project-ref ${testEnv.projectRef} --file prod_complete_backup.sql`
        console.log(`Commande: ${importTestCmd}`)
        
        execSync(importTestCmd, { stdio: 'inherit' })
        console.log('✅ Import TEST réussi!')
      }

      // Essayer d'importer vers DEV
      const devEnv = this.environments.get('dev')
      if (devEnv) {
        console.log('\n📥 Import vers DEV...')
        const importDevCmd = `npx supabase db reset --project-ref ${devEnv.projectRef} --file prod_complete_backup.sql`
        console.log(`Commande: ${importDevCmd}`)
        
        execSync(importDevCmd, { stdio: 'inherit' })
        console.log('✅ Import DEV réussi!')
      }

      console.log('\n🎉 CLONAGE AUTOMATIQUE TERMINÉ!')
      console.log('🔍 Vérifiez avec: npx tsx scripts/complete-sync-diagnosis.ts')

    } catch (error) {
      console.log('\n⚠️ CLONAGE AUTOMATIQUE ÉCHOUÉ')
      console.log('Erreur:', error)
      console.log('\n💡 SOLUTIONS ALTERNATIVES:')
      console.log('1. Utiliser le Supabase Dashboard (méthode manuelle)')
      console.log('2. Configurer Docker pour Supabase CLI')
      console.log('3. Utiliser pg_dump avec les mots de passe database')
    }
  }
}

async function main() {
  const cloner = new CompleteDatabaseClone()
  
  try {
    await cloner.showCloneOptions()
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

main().catch(console.error)