#!/usr/bin/env tsx
/**
 * Vérification URGENTE des lofts en PRODUCTION
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

async function checkProdLofts() {
  console.log('🚨 VÉRIFICATION URGENTE - LOFTS EN PRODUCTION')
  console.log('=' .repeat(60))

  try {
    // Charger les variables PROD
    const envContent = readFileSync('.env.prod', 'utf8')
    const envVars: any = {}
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim()
      }
    })

    const prodClient = createClient(
      envVars.NEXT_PUBLIC_SUPABASE_URL,
      envVars.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('🔍 Connexion à la base PRODUCTION...')
    console.log(`📡 URL: ${envVars.NEXT_PUBLIC_SUPABASE_URL}`)

    // Vérifier les lofts
    const { data: lofts, error: loftsError, count } = await prodClient
      .from('lofts')
      .select('*', { count: 'exact' })

    if (loftsError) {
      console.log('❌ ERREUR lors de la lecture des lofts:', loftsError.message)
      return
    }

    console.log('')
    console.log('📊 RÉSULTATS:')
    console.log(`🏠 Nombre de lofts en PROD: ${count || 0}`)

    if (lofts && lofts.length > 0) {
      console.log('✅ VOS LOFTS SONT BIEN LÀ!')
      console.log('')
      console.log('📋 Aperçu des lofts:')
      lofts.forEach((loft, index) => {
        console.log(`${index + 1}. ${loft.name} - ${loft.address}`)
      })
    } else {
      console.log('🚨 AUCUN LOFT TROUVÉ!')
      console.log('⚠️ Cela peut indiquer un problème de connexion ou de permissions')
    }

    // Vérifier d'autres tables importantes
    console.log('')
    console.log('🔍 Vérification d\'autres tables importantes:')
    
    const tablesToCheck = ['loft_owners', 'transactions', 'profiles']
    
    for (const table of tablesToCheck) {
      try {
        const { count: tableCount } = await prodClient
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        console.log(`📋 ${table}: ${tableCount || 0} enregistrements`)
      } catch (error) {
        console.log(`❌ ${table}: Erreur - ${error}`)
      }
    }

  } catch (error) {
    console.log('💥 ERREUR CRITIQUE:', error)
  }

  console.log('')
  console.log('🛡️ RAPPEL DE SÉCURITÉ:')
  console.log('• Nos scripts ne peuvent PAS modifier la PRODUCTION')
  console.log('• Toutes les opérations de clonage ciblent TEST/DEV uniquement')
  console.log('• La protection est codée en dur dans les scripts')
}

checkProdLofts().catch(console.error)