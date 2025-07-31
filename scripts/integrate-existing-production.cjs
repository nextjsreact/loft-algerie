#!/usr/bin/env node
/**
 * Script d'intégration de la production existante
 * Ce script vous aide à intégrer votre base de données de production existante
 */

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function integrateExistingProduction() {
  console.log('🚀 INTÉGRATION DE LA PRODUCTION EXISTANTE');
  console.log('=' .repeat(60));
  console.log('Ce script vous aide à intégrer votre base de données de production existante.\n');

  try {
    // Étape 1: Informations sur la production existante
    console.log('📋 ÉTAPE 1: Informations sur votre production existante');
    console.log('-' .repeat(50));
    
    console.log('Nous allons configurer votre environnement de production existant.');
    console.log('Vous aurez besoin des informations de connexion à votre base Supabase de production.\n');

    const hasProductionAccess = await question('Avez-vous accès à votre dashboard Supabase de production? (o/n): ');
    if (hasProductionAccess.toLowerCase() !== 'o') {
      console.log('❌ Vous devez avoir accès à votre dashboard Supabase de production');
      console.log('💡 Contactez votre administrateur pour obtenir les accès');
      return;
    }

    // Étape 2: Collecte des informations de production
    console.log('\n🔑 ÉTAPE 2: Configuration des clés de production');
    console.log('-' .repeat(50));
    console.log('Dans votre dashboard Supabase de PRODUCTION, allez dans Settings > API');
    
    const prodSupabaseUrl = await question('URL du projet PRODUCTION (Project URL): ');
    const prodAnonKey = await question('Clé anonyme PRODUCTION (anon/public): ');
    const prodServiceRoleKey = await question('Clé service_role PRODUCTION: ');

    // Étape 3: Génération du fichier .env.production
    console.log('\n⚙️ ÉTAPE 3: Génération du fichier .env.production');
    console.log('-' .repeat(50));

    const prodAuthSecret = require('crypto').randomBytes(32).toString('hex');
    
    const prodEnvContent = `# ===========================================
# ENVIRONNEMENT DE PRODUCTION EXISTANT
# ===========================================
# Intégré le ${new Date().toLocaleString()}

# Base de données Supabase - Production (EXISTANTE)
NEXT_PUBLIC_SUPABASE_URL=${prodSupabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${prodAnonKey}
SUPABASE_SERVICE_ROLE_KEY="${prodServiceRoleKey}"

# Authentication
AUTH_SECRET=${prodAuthSecret}

# Application
NEXT_PUBLIC_APP_URL=https://loft-algerie.com
NODE_ENV=production

# Logging et Debug (Production - Minimal)
NEXT_PUBLIC_DEBUG_MODE=false
LOG_LEVEL=error

# Email (Production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=[VOTRE_EMAIL_PRODUCTION]
SMTP_PASS=[VOTRE_MOT_DE_PASSE_APP]
SMTP_FROM=noreply@loft-algerie.com

# Monitoring et Analytics (Production)
NEXT_PUBLIC_ANALYTICS_ENABLED=true
SENTRY_DSN=[VOTRE_SENTRY_DSN_PRODUCTION]
DATADOG_API_KEY=[VOTRE_DATADOG_KEY]

# Cache et Performance (Production)
REDIS_URL=[VOTRE_REDIS_URL_PRODUCTION]
ENABLE_CACHE=true
CDN_URL=https://cdn.loft-algerie.com

# Sécurité (Production)
RATE_LIMIT_ENABLED=true
CORS_ORIGINS=https://loft-algerie.com,https://www.loft-algerie.com

# Backup et Maintenance
BACKUP_ENABLED=true
MAINTENANCE_MODE=false

# Notifications temps réel
NEXT_PUBLIC_REALTIME_ENABLED=true

# Base de données
NEXT_PUBLIC_HAS_DB=true
`;

    fs.writeFileSync('.env.production', prodEnvContent);
    console.log('✅ Fichier .env.production créé!');

    // Étape 4: Vérification de la compatibilité du schéma
    console.log('\n📊 ÉTAPE 4: Vérification de la compatibilité du schéma');
    console.log('-' .repeat(50));
    
    console.log('⚠️ IMPORTANT: Vérification de la compatibilité de votre base de production');
    console.log('Nous devons nous assurer que votre base de production a toutes les tables nécessaires.\n');
    
    const checkSchema = await question('Voulez-vous vérifier la compatibilité du schéma maintenant? (o/n): ');
    if (checkSchema.toLowerCase() === 'o') {
      console.log('📝 Instructions pour vérifier le schéma:');
      console.log('1. Basculez vers la production: npm run env:switch:prod');
      console.log('2. Testez la connexion: npm run test-env');
      console.log('3. Vérifiez les tables manquantes avec le script de diagnostic');
      console.log('4. Appliquez les migrations nécessaires si besoin');
      
      await question('Appuyez sur Entrée pour continuer...');
    }

    // Étape 5: Configuration des sauvegardes
    console.log('\n💾 ÉTAPE 5: Configuration des sauvegardes');
    console.log('-' .repeat(50));
    
    const setupBackup = await question('Configurer les sauvegardes automatiques de production? (o/n): ');
    if (setupBackup.toLowerCase() === 'o') {
      console.log('📝 Les scripts de sauvegarde seront configurés dans l\'étape suivante');
    }

    // Récapitulatif
    console.log('\n🎉 INTÉGRATION DE LA PRODUCTION TERMINÉE!');
    console.log('=' .repeat(60));
    console.log('✅ Fichier .env.production configuré');
    console.log('✅ Variables d\'environnement de production définies');
    console.log('✅ Prêt pour les scripts de clonage de données');
    
    console.log('\n📋 PROCHAINES ÉTAPES:');
    console.log('1. Testez la connexion: npm run env:switch:prod && npm run test-env');
    console.log('2. Vérifiez la compatibilité du schéma');
    console.log('3. Configurez les scripts de clonage de données');
    console.log('4. Mettez en place les sauvegardes automatiques');
    
    console.log('\n⚠️ SÉCURITÉ:');
    console.log('• Votre production existante ne sera PAS modifiée');
    console.log('• Les scripts de clonage copient les données VERS dev/test');
    console.log('• Aucun risque pour vos données de production');

  } catch (error) {
    console.error('❌ Erreur lors de l\'intégration:', error.message);
  } finally {
    rl.close();
  }
}

integrateExistingProduction();