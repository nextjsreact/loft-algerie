/**
 * EnvironmentValidator - Validateur d'environnements pour éviter les erreurs de configuration
 * Vérifie la connectivité et identifie les environnements source/cible
 */

import { EnvironmentLoader, type EnvironmentConfig } from './EnvironmentLoader'

export interface Environment extends EnvironmentConfig {
  configFile: string
}

export interface ValidationResult {
  isValid: boolean
  message: string
  source?: Environment
  target?: Environment
  warnings: string[]
  errors: string[]
}

export class EnvironmentValidator {
  private environments: Map<string, Environment> = new Map();

  /**
   * Valide les environnements source et cible
   */
  async validateEnvironments(sourceName: string, targetName: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: false,
      message: '',
      warnings: [],
      errors: []
    };

    try {
      // Charger et valider l'environnement source
      const source = await this.loadEnvironment(sourceName);
      if (!source) {
        result.errors.push(`Environnement source "${sourceName}" non trouvé ou invalide`);
        return result;
      }

      // Charger et valider l'environnement cible
      const target = await this.loadEnvironment(targetName);
      if (!target) {
        result.errors.push(`Environnement cible "${targetName}" non trouvé ou invalide`);
        return result;
      }

      // Vérifications de sécurité
      if (source.name === target.name) {
        result.errors.push('La source et la cible ne peuvent pas être identiques');
        return result;
      }

      if (source.url === target.url) {
        result.errors.push('Les URLs source et cible sont identiques - risque de corruption');
        return result;
      }

      // Avertissements de sécurité
      if (target.isProtected) {
        result.warnings.push(`⚠️ ATTENTION: La cible "${target.name}" est un environnement protégé`);
      }

      if (source.type !== 'production' && target.type === 'production') {
        result.errors.push('❌ INTERDIT: Impossible de cloner depuis un environnement non-production vers la production');
        return result;
      }

      // Test de connectivité
      const sourceConnected = await this.testConnectivity(source);
      const targetConnected = await this.testConnectivity(target);

      if (!sourceConnected) {
        result.errors.push(`Impossible de se connecter à l'environnement source: ${source.name}`);
      }

      if (!targetConnected) {
        result.errors.push(`Impossible de se connecter à l'environnement cible: ${target.name}`);
      }

      if (sourceConnected && targetConnected) {
        result.isValid = true;
        result.message = 'Environnements validés avec succès';
        result.source = source;
        result.target = target;
      }

      return result;

    } catch (error) {
      result.errors.push(`Erreur de validation: ${error}`);
      return result;
    }
  }

  /**
   * Charge et configure un environnement
   */
  private async loadEnvironment(envName: string): Promise<Environment | null> {
    try {
      const envConfig = await EnvironmentLoader.loadEnvironment(envName);
      
      if (!envConfig) {
        return null;
      }

      const environment: Environment = {
        ...envConfig,
        configFile: this.getConfigFile(envName)
      };

      this.environments.set(envName, environment);
      return environment;

    } catch (error) {
      console.log(`❌ Erreur chargement environnement ${envName}:`, error);
      return null;
    }
  }

  /**
   * Teste la connectivité à un environnement
   */
  async testConnectivity(environment: Environment): Promise<boolean> {
    return EnvironmentLoader.testConnectivity(environment);
  }

  /**
   * Identifie le type d'environnement
   */
  identifyEnvironmentType(envName: string): 'production' | 'test' | 'development' {
    const name = envName.toLowerCase();
    
    if (name.includes('prod')) return 'production';
    if (name.includes('test')) return 'test';
    if (name.includes('dev')) return 'development';
    
    // Par défaut, considérer comme développement
    return 'development';
  }

  /**
   * Détermine si un environnement est protégé
   */
  private isProtectedEnvironment(envName: string): boolean {
    return this.identifyEnvironmentType(envName) === 'production';
  }

  /**
   * Obtient le fichier de configuration pour un environnement
   */
  private getConfigFile(envName: string): string {
    const envMap: Record<string, string> = {
      'prod': '.env.prod',
      'production': '.env.production',
      'test': '.env.test',
      'dev': '.env.development',
      'development': '.env.development'
    };

    return envMap[envName.toLowerCase()] || `.env.${envName}`;
  }

  /**
   * Affiche un résumé visuel des environnements
   */
  displayEnvironmentSummary(source: Environment, target: Environment): void {
    console.log('\n📋 RÉSUMÉ DES ENVIRONNEMENTS');
    console.log('=' .repeat(50));
    
    // Source
    console.log(`📤 SOURCE: ${source.name.toUpperCase()}`);
    console.log(`   Type: ${source.type}`);
    console.log(`   URL: ${this.maskUrl(source.url)}`);
    console.log(`   Protégé: ${source.isProtected ? '🔒 OUI' : '🔓 NON'}`);
    
    console.log('\n   ⬇️  CLONAGE  ⬇️\n');
    
    // Target
    const targetIcon = target.isProtected ? '🔴' : '🟢';
    console.log(`📥 CIBLE: ${target.name.toUpperCase()} ${targetIcon}`);
    console.log(`   Type: ${target.type}`);
    console.log(`   URL: ${this.maskUrl(target.url)}`);
    console.log(`   Protégé: ${target.isProtected ? '🔒 OUI' : '🔓 NON'}`);
    
    if (target.isProtected) {
      console.log('\n⚠️  ATTENTION: La cible est un environnement protégé!');
    }
  }

  /**
   * Masque l'URL pour l'affichage sécurisé
   */
  private maskUrl(url: string): string {
    return EnvironmentLoader.maskUrl(url);
  }

  /**
   * Obtient un environnement chargé
   */
  getEnvironment(name: string): Environment | undefined {
    return this.environments.get(name);
  }

  /**
   * Liste tous les environnements disponibles
   */
  listAvailableEnvironments(): string[] {
    return ['prod', 'test', 'dev'];
  }
}