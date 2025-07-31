#!/usr/bin/env tsx
/**
 * VÉRIFICATION D'URGENCE - Recherche des données lofts dans tous les environnements
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function emergencyLoftsCheck() {
  console.log('🚨 VÉRIFICATION D\'URGENCE DES DONNÉES LOFTS')
  console.log('=' .repeat(60))

  const environments = [
    { name: 'PRODUCTION', file: '.env.prod' },
    { name: 'TEST', file: '.env.test' },
    { name: 'DÉVELOPPEMENT', file: '.env.development' }
  ]

  for (const env of environments) {
    console.log(`\n📋 Vérification: ${env.name}`)
    console.log('-' .repeat(40))

    try {
      config({ path: resolve(process.cwd(), env.file) })
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
      
      if (!url || !key) {
        console.log(`❌ Variables d'environnement manquantes`)
        continue
      }

      const client = createClient(url, key)

      // Compter les lofts
      const { count, error: countError } = await client
        .from('lofts')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        console.log(`❌ Erreur: ${countError.message}`)
        continue
      }

      console.log(`📊 Nombre de lofts: ${count || 0}`)

      if (count && count > 0) {
        // Récupérer les données
        const { data: lofts, error: dataError } = await client
          .from('lofts')
          .select('id, name, address, price_per_month, status, created_at')

        if (!dataError && lofts) {
          console.log(`✅ DONNÉES TROUVÉES! ${lofts.length} lofts:`)
          lofts.forEach((loft, index) => {
            console.log(`   ${index + 1}. "${loft.name}" - ${loft.address} (${loft.price_per_month} DA/jour)`)
          })

          // Sauvegarder les données dans un fichier de récupération
          const fs = await import('fs')
          const backupData = {
            environment: env.name,
            timestamp: new Date().toISOString(),
            count: lofts.length,
            data: lofts
          }
          
          const filename = `lofts-backup-${env.name.toLowerCase()}-${Date.now()}.json`
          fs.writeFileSync(filename, JSON.stringify(backupData, null, 2))
          console.log(`💾 Sauvegarde créée: ${filename}`)
        }
      } else {
        console.log(`⚠️ Aucun loft trouvé`)
      }

    } catch (error) {
      console.log(`💥 Erreur: ${error}`)
    }
  }

  console.log('\n🎯 PLAN DE RÉCUPÉRATION:')
  console.log('1. Identifier l\'environnement avec des données')
  console.log('2. Créer une sauvegarde de sécurité')
  console.log('3. Restaurer les données en production')
  console.log('4. Identifier la cause de la suppression')
}

emergencyLoftsCheck()