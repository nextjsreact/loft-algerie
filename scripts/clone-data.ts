#!/usr/bin/env tsx
/**
 * Script de clonage de données entre environnements
 * Clone les données de production vers test ou développement
 * Améliorations:
 *  - Ne manipule plus auth.users directement
 *  - Chargement .env robuste via dotenv
 *  - Pré-vérification de compatibilité schéma (hook)
 *  - Pagination pour éviter l'usage mémoire excessif
 *  - Meilleure journalisation et gestion d'erreurs
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

interface CloneOptions {
  source: 'prod' | 'test' | 'dev'
  target: 'prod' | 'test' | 'dev'
  tables?: string[]
  excludeSensitive?: boolean
  dryRun?: boolean
  pageSize?: number
}

type TableResult = { status: 'success'|'error'|'empty'|'dry-run', records?: number, error?: string }

export class DataCloner {
  private sourceClient!: SupabaseClient
  private targetClient!: SupabaseClient

  constructor(private options: CloneOptions) {}

  private resolveEnvFile(env: 'prod'|'test'|'dev') {
    return `.env.${env === 'dev' ? 'development' : env}`
  }

  private loadEnvironment(env: 'prod'|'test'|'dev') {
    const path = this.resolveEnvFile(env)
    const res = dotenv.config({ path })
    if (res.error) {
      throw new Error(`Fichier d'environnement introuvable ou invalide: ${path}`)
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      throw new Error(`Variables manquantes dans ${path}: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY`)
    }
    return { url, serviceKey }
  }

  private initializeClients() {
    const source = this.loadEnvironment(this.options.source)
    const target = this.loadEnvironment(this.options.target)
    this.sourceClient = createClient(source.url, source.serviceKey, { auth: { persistSession: false } })
    this.targetClient = createClient(target.url, target.serviceKey, { auth: { persistSession: false } })
  }

  // Hook de pré-vérification schéma (non bloquant si indisponible)
  private async preflightSchemaCheck(): Promise<void> {
    try {
      // Si vous avez déjà un endpoint interne: app/api/health ou un script diagnose, appelez-le ici.
      // Ici, on fait un check minimal: existence de quelques tables clés dans source et cible.
      const mustHaveTables = ['profiles','lofts','transactions','categories','currencies']
      for (const [client, label] of [[this.sourceClient,'source'] as const, [this.targetClient,'target'] as const]) {
        for (const t of mustHaveTables) {
          const { error } = await client.from(t).select('id').limit(1)
          if (error) {
            console.warn(`⚠️ Pré-check schéma (${label}): table "${t}" inaccessible: ${error.message}`)
          }
        }
      }
      console.log('🧪 Pré-vérification schéma effectuée (non bloquante).')
    } catch (e: any) {
      console.warn('⚠️ Échec pré-vérification schéma (ignorée):', e?.message || e)
    }
  }

  // Anonymisation
  private anonymizeProfiles(profiles: any[]): any[] {
    return profiles.map((profile) => {
      const isAdmin = profile.role === 'admin'
      const anonLocal = `${this.options.target}.local`
      const stableSuffix = (profile.id || '').toString().slice(0, 6) || Math.random().toString(36).slice(2, 8)
      return {
        ...profile,
        email: isAdmin ? `admin@${anonLocal}` : `user_${stableSuffix}@${anonLocal}`,
        full_name: profile.full_name ? `${profile.full_name} (${this.options.target.toUpperCase()})` : `User ${stableSuffix.toUpperCase()}`,
        airbnb_access_token: null,
        airbnb_refresh_token: null,
        updated_at: new Date().toISOString(),
      }
    })
  }
  private anonymizeUserSessions(): any[] { return [] }
  private anonymizeNotifications(notifications: any[]): any[] {
    return notifications.map((n) => ({
      ...n,
      message: typeof n.message === 'string' && n.message.includes('@') ? 'Message de test anonymisé' : n.message,
      is_read: true,
      read_at: new Date().toISOString(),
    }))
  }
  private anonymizeMessages(messages: any[]): any[] {
    return messages.map((m) => ({
      ...m,
      content: 'Message de test anonymisé',
      metadata: m.metadata ? { ...m.metadata, anonymized: true } : null,
    }))
  }

  private async fetchTablePaged(client: SupabaseClient, table: string, pageSize: number): Promise<any[]> {
    let from = 0
    const out: any[] = []
    for (;;) {
      const to = from + pageSize - 1
      const { data, error } = await client.from(table).select('*').range(from, to)
      if (error) {
        throw new Error(`Lecture ${table} échouée: ${error.message}`)
      }
      if (!data || data.length === 0) break
      out.push(...data)
      from += pageSize
      if (data.length < pageSize) break
    }
    return out
  }

  private async tableExists(client: SupabaseClient, table: string): Promise<boolean> {
    // Try a cheap existence probe
    const { error } = await client.from(table).select('*').limit(1)
    if (error && `${error.message}`.toLowerCase().includes('relation') && `${error.message}`.toLowerCase().includes('does not exist')) {
      return false
    }
    // If other error, assume exists and let normal flow handle specifics
    return true
  }

  private async getTableColumns(client: SupabaseClient, table: string): Promise<Set<string>> {
    // Fallback: attempt to select one row and infer keys
    const { data, error } = await client.from(table).select('*').limit(1)
    if (error) {
      // If cannot read, return empty (will cause shaping to drop all and then skip)
      return new Set<string>()
    }
    if (data && data.length > 0) {
      return new Set<string>(Object.keys(data[0] as Record<string, any>))
    }
    // If empty, we can't infer; try inserting with unshaped data later. Return empty set to avoid shaping.
    return new Set<string>()
  }

  private async truncateTargetTable(table: string) {
    // Supabase PostgREST n'a pas TRUNCATE; on supprime tout
    // Attention aux FKs/RLS: on dépend de l'ordre et des politiques permissives côté service role.
    const { error } = await this.targetClient.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error && !`${error.message}`.includes('No rows found')) {
      console.warn(`⚠️ Nettoyage ${table}: ${error.message}`)
    }
  }

  private processSensitive(table: string, rows: any[]): any[] {
    if (table === 'profiles') return this.anonymizeProfiles(rows)
    if (table === 'user_sessions') return this.anonymizeUserSessions()
    if (table === 'notifications') return this.anonymizeNotifications(rows)
    if (table === 'messages') return this.anonymizeMessages(rows)
    return rows
  }

  async cloneData() {
    // 1) Init clients (dotenv) + 2) Preflight schema check
    this.initializeClients()
    await this.preflightSchemaCheck()

    const pageSize = this.options.pageSize ?? 1000

    console.log(`🔄 Clonage des données: ${this.options.source.toUpperCase()} → ${this.options.target.toUpperCase()}`)
    console.log('='.repeat(70))
    if (this.options.dryRun) console.log('🧪 MODE TEST - Aucune donnée ne sera modifiée')

    // Order: keep explicit list; ideally replace with a server-side FK-topology RPC
    const tablesToClone = this.options.tables || [
      'currencies',
      'categories',
      'zone_areas',
      'internet_connection_types',
      'payment_methods',
      'loft_owners',
      'lofts',
      'teams',
      'team_members',
      'tasks',
      'transactions',
      'transaction_category_references',
      'settings'
    ]

    if (!this.options.excludeSensitive) {
      tablesToClone.push('profiles', 'user_sessions', 'notifications', 'messages')
    }

    let totalRecords = 0
    const results: Record<string, TableResult> = {}

    for (const table of tablesToClone) {
      try {
        console.log(`\n📋 Clonage de la table: ${table}`)
        console.log('-'.repeat(40))

        // Skip tables missing on target to avoid immediate failures (e.g., user_sessions)
        const targetHas = await this.tableExists(this.targetClient, table)
        if (!targetHas) {
          console.log(`ℹ️ Table absente dans la cible, ignorée: ${table}`)
          results[table] = { status: 'empty', records: 0 }
          continue
        }

        const sourceHas = await this.tableExists(this.sourceClient, table)
        if (!sourceHas) {
          console.log(`ℹ️ Table absente dans la source, ignorée: ${table}`)
          results[table] = { status: 'empty', records: 0 }
          continue
        }

        const sourceData = await this.fetchTablePaged(this.sourceClient, table, pageSize)

        if (!sourceData.length) {
          console.log(`ℹ️ Table ${table} vide dans la source`)
          results[table] = { status: 'empty', records: 0 }
          continue
        }

        console.log(`📊 ${sourceData.length} enregistrements trouvés (pagination: ${pageSize})`)

        if (this.options.dryRun) {
          console.log(`🧪 [TEST] Aurait cloné ${sourceData.length} enregistrements`)
          results[table] = { status: 'dry-run', records: sourceData.length }
          totalRecords += sourceData.length
          continue
        }

        // Column intersection shaping to handle schema drift
        const targetCols = await this.getTableColumns(this.targetClient, table)
        let shaped = sourceData
        if (targetCols.size > 0) {
          shaped = sourceData.map((row) => {
            const out: any = {}
            for (const k of Object.keys(row)) {
              if (targetCols.has(k)) out[k] = (row as any)[k]
            }
            return out
          })
        }

        // Sensitive processing after shaping (only columns that exist)
        let processed = this.processSensitive(table, shaped)

        // Special-case strategies:
        // - settings: often singleton; avoid delete to prevent PK conflicts, use upsert when possible
        // - profiles: avoid delete due to inbound FKs; prefer upsert
        const useUpsert = (table === 'profiles' || table === 'settings')

        if (!useUpsert) {
          await this.truncateTargetTable(table)
        }

        // Batch insert/upsert
        const batchSize = 500
        let insertedCount = 0
        for (let i = 0; i < processed.length; i += batchSize) {
          const batch = processed.slice(i, i + batchSize)

          if (useUpsert) {
            // Try to infer conflict target: prefer 'id' if present, else first key
            const sample = batch[0] || {}
            const conflictKey = 'id' in sample ? 'id' : Object.keys(sample)[0]
            const q = (this.targetClient.from(table) as any).upsert
              ? (this.targetClient.from(table) as any).upsert(batch, { onConflict: conflictKey, ignoreDuplicates: false })
              : this.targetClient.from(table).insert(batch) // fallback if upsert unsupported
            const { error } = await q
            if (error) {
              console.log(`❌ Erreur upsert lot ${Math.floor(i / batchSize) + 1} (${table}): ${error.message}`)
            } else {
              insertedCount += batch.length
              process.stdout.write(`\r📥 Upsert: ${insertedCount}/${processed.length}`)
            }
          } else {
            const { error } = await this.targetClient.from(table).insert(batch)
            if (error) {
              console.log(`❌ Erreur insertion lot ${Math.floor(i / batchSize) + 1} (${table}): ${error.message}`)
            } else {
              insertedCount += batch.length
              process.stdout.write(`\r📥 Inséré: ${insertedCount}/${processed.length}`)
            }
          }
        }
        console.log(`\n✅ Table ${table}: ${insertedCount} enregistrements clonés`)
        results[table] = { status: 'success', records: insertedCount }
        totalRecords += insertedCount
      } catch (e: any) {
        console.log(`💥 Erreur inattendue pour ${table}:`, e?.message || e)
        results[table] = { status: 'error', error: e?.message || String(e) }
      }
    }

    // Résumé
    console.log('\n📊 RÉSUMÉ DU CLONAGE')
    console.log('='.repeat(50))
    console.log(`📈 Total des enregistrements: ${totalRecords}`)
    const succ = Object.values(results).filter(r => r.status === 'success').length
    const err = Object.values(results).filter(r => r.status === 'error').length
    const empty = Object.values(results).filter(r => r.status === 'empty').length
    console.log(`✅ Tables réussies: ${succ}`)
    console.log(`❌ Tables en erreur: ${err}`)
    console.log(`ℹ️ Tables vides: ${empty}`)

    console.log('\n📋 Détail par table:')
    for (const [table, r] of Object.entries(results)) {
      const icon = r.status === 'success' ? '✅' : r.status === 'error' ? '❌' : r.status === 'empty' ? 'ℹ️' : '🧪'
      console.log(`${icon} ${table}: ${r.records || 0} enregistrements (${r.status}${r.error ? ` - ${r.error}` : ''})`)
    }

    console.log(`\n🎉 Clonage terminé: ${this.options.source.toUpperCase()} → ${this.options.target.toUpperCase()}`)
    if (this.options.target !== 'prod') {
      console.log('💡 Testez avec: npm run env:switch:' + this.options.target)
      console.log('🔍 Vérifiez les données avec vos scripts de vérification')
    }
  }

  // Vérification simple: compare les counts par table côté source/target
  async verifyClone(tables?: string[]) {
    // Simple count comparison using pagination for accuracy
    this.initializeClients()
    const list = tables && tables.length ? tables : [
      'currencies','categories','zone_areas','internet_connection_types','payment_methods',
      'loft_owners','lofts','teams','team_members','tasks','transactions',
      'transaction_category_references','settings','profiles','notifications','messages'
    ]
    console.log('\n🔎 Vérification post-clonage (counts):')
    const page = 1000
    for (const t of list) {
      const srcExists = await this.tableExists(this.sourceClient, t)
      const tgtExists = await this.tableExists(this.targetClient, t)
      if (!srcExists || !tgtExists) {
        console.log(`- ${t}: ignorée (existence source=${srcExists}, cible=${tgtExists})`)
        continue
      }
      const countWith = async (client: SupabaseClient) => {
        let total = 0, offset = 0
        for (;;) {
          const { data, error } = await client.from(t).select('*').range(offset, offset + page - 1)
          if (error) break
          if (!data || data.length === 0) break
          total += data.length
          if (data.length < page) break
          offset += page
        }
        return total
      }
      const sCount = await countWith(this.sourceClient)
      const tCount = await countWith(this.targetClient)
      const match = sCount === tCount ? '✅' : '⚠️'
      console.log(`${match} ${t}: source=${sCount}, target=${tCount}`)
    }
    console.log('✔️ Vérification simple terminée.')
  }
}
