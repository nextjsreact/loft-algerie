#!/usr/bin/env tsx
/**
 * Script pour vérifier les rôles des utilisateurs
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function checkUserRoles() {
  console.log('🔍 Vérification des rôles utilisateurs')
  console.log('=' .repeat(50))

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Récupérer tous les profils
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('❌ Erreur lors de la récupération des profils:', profilesError.message)
      return
    }

    console.log('\n📊 Profils utilisateurs:')
    console.log('-' .repeat(80))
    
    if (!profiles || profiles.length === 0) {
      console.log('⚠️ Aucun profil trouvé')
      return
    }

    profiles.forEach((profile, index) => {
      const roleIcon = profile.role === 'admin' ? '👑' : 
                      profile.role === 'manager' ? '👨‍💼' : '👤'
      
      console.log(`${index + 1}. ${roleIcon} ${profile.email}`)
      console.log(`   Nom: ${profile.full_name || 'Non défini'}`)
      console.log(`   Rôle: ${profile.role}`)
      console.log(`   ID: ${profile.id}`)
      console.log(`   Créé: ${new Date(profile.created_at).toLocaleString()}`)
      console.log('')
    })

    // Statistiques
    const roleStats = profiles.reduce((stats, profile) => {
      stats[profile.role] = (stats[profile.role] || 0) + 1
      return stats
    }, {} as Record<string, number>)

    console.log('📈 Statistiques des rôles:')
    console.log('-' .repeat(30))
    Object.entries(roleStats).forEach(([role, count]) => {
      const icon = role === 'admin' ? '👑' : role === 'manager' ? '👨‍💼' : '👤'
      console.log(`${icon} ${role}: ${count}`)
    })

    // Vérifier les utilisateurs auth sans profil
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (!authError && authUsers) {
      const profileIds = new Set(profiles.map(p => p.id))
      const usersWithoutProfile = authUsers.users.filter(user => !profileIds.has(user.id))
      
      if (usersWithoutProfile.length > 0) {
        console.log('\n⚠️ Utilisateurs auth sans profil:')
        console.log('-' .repeat(40))
        usersWithoutProfile.forEach(user => {
          console.log(`- ${user.email} (ID: ${user.id})`)
        })
      }
    }

    console.log('\n✅ Vérification terminée!')

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

checkUserRoles()