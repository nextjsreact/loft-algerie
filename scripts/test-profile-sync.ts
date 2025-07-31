#!/usr/bin/env tsx
/**
 * Script de test pour vérifier la synchronisation des profils
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testProfileSync() {
  console.log('🔍 Test de synchronisation des profils')
  console.log('=' .repeat(50))

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Vérifier les utilisateurs sans profil
    console.log('\n📊 Vérification des utilisateurs sans profil...')
    
    const { data: usersWithoutProfile, error: checkError } = await supabase
      .rpc('check_users_without_profile')
      .single()

    if (checkError) {
      // Si la fonction n'existe pas, on fait une requête manuelle
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        console.log('❌ Erreur lors de la récupération des utilisateurs auth:', authError.message)
        return
      }

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')

      if (profileError) {
        console.log('❌ Erreur lors de la récupération des profils:', profileError.message)
        return
      }

      const profileIds = new Set(profiles?.map(p => p.id) || [])
      const usersWithoutProfiles = authUsers.users.filter(user => !profileIds.has(user.id))

      console.log(`📈 Utilisateurs auth: ${authUsers.users.length}`)
      console.log(`📈 Profils: ${profiles?.length || 0}`)
      console.log(`⚠️ Utilisateurs sans profil: ${usersWithoutProfiles.length}`)

      if (usersWithoutProfiles.length > 0) {
        console.log('\n🔧 Utilisateurs sans profil détectés:')
        usersWithoutProfiles.forEach(user => {
          console.log(`- ${user.email} (ID: ${user.id})`)
        })
      }
    }

    // Vérifier si les triggers existent
    console.log('\n🔍 Vérification des triggers...')
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_object_table')
      .in('trigger_name', ['on_auth_user_created', 'on_auth_user_deleted'])

    if (triggerError) {
      console.log('⚠️ Impossible de vérifier les triggers:', triggerError.message)
    } else {
      console.log(`✅ Triggers trouvés: ${triggers?.length || 0}`)
      triggers?.forEach(trigger => {
        console.log(`- ${trigger.trigger_name} sur ${trigger.event_object_table}`)
      })
    }

    console.log('\n✅ Test de synchronisation terminé!')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

testProfileSync()