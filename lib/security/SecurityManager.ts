/**
 * SecurityManager - Gestionnaire de sécurité pour les opérations critiques
 * Implémente la protection de la production avec double confirmation
 */

export interface SecurityValidation {
  isValid: boolean
  message: string
  requiresBackup: boolean
}

export interface ConfirmationOptions {
  operation: string
  environment: string
  consequences: string[]
  keyword: string
}

export class SecurityManager {
  private static readonly PRODUCTION_KEYWORDS = ['PRODUCTION', 'PROD'];
  private static readonly CONFIRMATION_KEYWORDS = ['CONFIRMER', 'CONFIRM'];

  /**
   * Valide l'accès aux opérations de production
   */
  async validateProductionAccess(operation: string, targetEnv: string): Promise<SecurityValidation> {
    const isProduction = this.isProductionEnvironment(targetEnv);
    
    if (!isProduction) {
      return {
        isValid: true,
        message: `Opération autorisée sur l'environnement ${targetEnv}`,
        requiresBackup: false
      };
    }

    // Production détectée - protection maximale
    console.log('\n🚨 ALERTE SÉCURITÉ - ENVIRONNEMENT DE PRODUCTION DÉTECTÉ');
    console.log('=' .repeat(60));
    console.log(`🎯 Opération: ${operation}`);
    console.log(`🏭 Environnement: ${targetEnv.toUpperCase()}`);
    console.log('⚠️  CETTE OPÉRATION AFFECTERA LA PRODUCTION!');
    
    return {
      isValid: false, // Nécessite confirmation supplémentaire
      message: 'Opération de production détectée - confirmation requise',
      requiresBackup: true
    };
  }

  /**
   * Demande une double confirmation avec mot-clé spécifique
   */
  async requestDoubleConfirmation(options: ConfirmationOptions): Promise<boolean> {
    const { createInterface } = await import('readline');
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    try {
      // Affichage de l'avertissement de sécurité
      this.displaySecurityWarning(options.environment, options.operation, options.consequences);

      // Première confirmation
      const firstConfirm = await new Promise<string>(resolve => {
        rl.question('\n❓ Voulez-vous vraiment continuer? (tapez OUI): ', resolve);
      });

      if (firstConfirm !== 'OUI') {
        console.log('❌ Opération annulée par l\'utilisateur');
        return false;
      }

      // Deuxième confirmation avec mot-clé
      const keywordConfirm = await new Promise<string>(resolve => {
        rl.question(`\n🔐 Pour confirmer, tapez "${options.keyword}" en majuscules: `, resolve);
      });

      if (keywordConfirm !== options.keyword) {
        console.log(`❌ Mot-clé incorrect. Attendu: "${options.keyword}", Reçu: "${keywordConfirm}"`);
        console.log('🛡️ Opération annulée pour sécurité');
        return false;
      }

      console.log('✅ Double confirmation validée');
      return true;

    } finally {
      rl.close();
    }
  }

  /**
   * Affiche un avertissement de sécurité visuel
   */
  displaySecurityWarning(environment: string, operation: string, consequences: string[]): void {
    const isProduction = this.isProductionEnvironment(environment);
    
    if (isProduction) {
      console.log('\n🔴🔴🔴 DANGER - ENVIRONNEMENT DE PRODUCTION 🔴🔴🔴');
      console.log('█'.repeat(60));
      console.log('█                    ⚠️  ATTENTION  ⚠️                     █');
      console.log('█                                                        █');
      console.log(`█  Opération: ${operation.padEnd(42)} █`);
      console.log(`█  Environnement: ${environment.toUpperCase().padEnd(38)} █`);
      console.log('█                                                        █');
      console.log('█  CONSÉQUENCES DE CETTE OPÉRATION:                     █');
      consequences.forEach(consequence => {
        console.log(`█  • ${consequence.padEnd(49)} █`);
      });
      console.log('█                                                        █');
      console.log('█  ⚠️  CETTE ACTION EST IRRÉVERSIBLE  ⚠️                  █');
      console.log('█'.repeat(60));
    } else {
      console.log(`\n🟡 Opération sur l'environnement: ${environment.toUpperCase()}`);
      console.log(`📋 Action: ${operation}`);
      console.log('📝 Conséquences:');
      consequences.forEach(consequence => {
        console.log(`   • ${consequence}`);
      });
    }
  }

  /**
   * Vérifie si un environnement est considéré comme production
   */
  private isProductionEnvironment(environment: string): boolean {
    const env = environment.toLowerCase();
    return env.includes('prod') || env.includes('production');
  }

  /**
   * Valide un mot-clé de confirmation
   */
  validateConfirmationKeyword(keyword: string, expectedType: 'production' | 'general'): boolean {
    const upperKeyword = keyword.toUpperCase();
    
    if (expectedType === 'production') {
      return SecurityManager.PRODUCTION_KEYWORDS.includes(upperKeyword);
    } else {
      return SecurityManager.CONFIRMATION_KEYWORDS.includes(upperKeyword);
    }
  }

  /**
   * Génère un ID unique pour l'opération (pour audit)
   */
  generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Crée un résumé de sécurité pour l'audit
   */
  createSecuritySummary(operation: string, environment: string, confirmed: boolean): object {
    return {
      timestamp: new Date().toISOString(),
      operation,
      environment,
      isProduction: this.isProductionEnvironment(environment),
      confirmed,
      securityLevel: this.isProductionEnvironment(environment) ? 'CRITICAL' : 'STANDARD',
      operationId: this.generateOperationId()
    };
  }
}