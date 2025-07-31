/**
 * BackupManager - Gestionnaire de sauvegardes automatiques
 * Crée des sauvegardes avant les opérations critiques et permet la restauration
 */

import type { Environment } from './EnvironmentValidator'

export interface BackupResult {
  success: boolean
  backupId: string
  filePath: string
  tablesBackedUp: string[]
  recordCount: number
  timestamp: Date
  error?: string
}

export interface RestoreResult {
  success: boolean
  restoredTables: string[]
  recordsRestored: number
  error?: string
}

export interface Backup {
  id: string
  environment: string
  timestamp: Date
  filePath: string
  tables: string[]
  recordCount: number
  operation: string
}

export class BackupManager {
  private backupDirectory = 'backups';

  /**
   * Crée une sauvegarde complète avant une opération critique
   */
  async createBackup(
    environment: Environment, 
    tables: string[], 
    operation: string
  ): Promise<BackupResult> {
    const backupId = this.generateBackupId(environment.name, operation);
    const timestamp = new Date();
    
    console.log(`\n💾 CRÉATION DE SAUVEGARDE`);
    console.log(`📋 ID: ${backupId}`);
    console.log(`🏭 Environnement: ${environment.name}`);
    console.log(`📊 Tables: ${tables.length}`);

    try {
      // Créer le répertoire de sauvegarde si nécessaire
      await this.ensureBackupDirectory();

      const backupData: any = {
        metadata: {
          backupId,
          environment: environment.name,
          timestamp: timestamp.toISOString(),
          operation,
          tables: tables
        },
        data: {}
      };

      let totalRecords = 0;
      const backedUpTables: string[] = [];

      // Sauvegarder chaque table
      for (const tableName of tables) {
        try {
          console.log(`📋 Sauvegarde de ${tableName}...`);
          
          const { data, error } = await environment.client
            .from(tableName)
            .select('*');

          if (error) {
            console.log(`⚠️ Erreur ${tableName}: ${error.message}`);
            continue;
          }

          if (data && data.length > 0) {
            backupData.data[tableName] = data;
            totalRecords += data.length;
            backedUpTables.push(tableName);
            console.log(`✅ ${tableName}: ${data.length} enregistrements`);
          } else {
            console.log(`ℹ️ ${tableName}: table vide`);
            backupData.data[tableName] = [];
            backedUpTables.push(tableName);
          }
        } catch (tableError) {
          console.log(`❌ Erreur table ${tableName}:`, tableError);
        }
      }

      // Sauvegarder dans un fichier
      const filePath = await this.saveBackupToFile(backupId, backupData);

      // Enregistrer les métadonnées de sauvegarde
      await this.saveBackupMetadata({
        id: backupId,
        environment: environment.name,
        timestamp,
        filePath,
        tables: backedUpTables,
        recordCount: totalRecords,
        operation
      });

      console.log(`✅ Sauvegarde créée: ${totalRecords} enregistrements`);
      console.log(`📁 Fichier: ${filePath}`);

      return {
        success: true,
        backupId,
        filePath,
        tablesBackedUp: backedUpTables,
        recordCount: totalRecords,
        timestamp
      };

    } catch (error) {
      console.log(`❌ Erreur lors de la sauvegarde:`, error);
      return {
        success: false,
        backupId,
        filePath: '',
        tablesBackedUp: [],
        recordCount: 0,
        timestamp,
        error: String(error)
      };
    }
  }

  /**
   * Restaure une sauvegarde
   */
  async restoreBackup(backupId: string, targetEnvironment: Environment): Promise<RestoreResult> {
    console.log(`\n🔄 RESTAURATION DE SAUVEGARDE`);
    console.log(`📋 ID: ${backupId}`);
    console.log(`🎯 Cible: ${targetEnvironment.name}`);

    try {
      // Charger les données de sauvegarde
      const backupData = await this.loadBackupFromFile(backupId);
      if (!backupData) {
        return {
          success: false,
          restoredTables: [],
          recordsRestored: 0,
          error: 'Sauvegarde non trouvée'
        };
      }

      const restoredTables: string[] = [];
      let totalRestored = 0;

      // Restaurer chaque table
      for (const [tableName, tableData] of Object.entries(backupData.data)) {
        try {
          console.log(`📋 Restauration de ${tableName}...`);

          // Vider la table cible
          await targetEnvironment.client
            .from(tableName)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

          // Insérer les données sauvegardées
          if (Array.isArray(tableData) && tableData.length > 0) {
            const { error: insertError } = await targetEnvironment.client
              .from(tableName)
              .insert(tableData);

            if (insertError) {
              console.log(`❌ Erreur insertion ${tableName}: ${insertError.message}`);
              continue;
            }

            totalRestored += tableData.length;
            restoredTables.push(tableName);
            console.log(`✅ ${tableName}: ${tableData.length} enregistrements restaurés`);
          } else {
            console.log(`ℹ️ ${tableName}: aucune donnée à restaurer`);
            restoredTables.push(tableName);
          }
        } catch (tableError) {
          console.log(`❌ Erreur restauration ${tableName}:`, tableError);
        }
      }

      console.log(`✅ Restauration terminée: ${totalRestored} enregistrements`);

      return {
        success: true,
        restoredTables,
        recordsRestored: totalRestored
      };

    } catch (error) {
      console.log(`❌ Erreur lors de la restauration:`, error);
      return {
        success: false,
        restoredTables: [],
        recordsRestored: 0,
        error: String(error)
      };
    }
  }

  /**
   * Liste les sauvegardes disponibles
   */
  async listBackups(): Promise<Backup[]> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const metadataPath = path.join(this.backupDirectory, 'metadata.json');
      
      if (!fs.existsSync(metadataPath)) {
        return [];
      }

      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      return metadata.backups || [];
    } catch (error) {
      console.log('❌ Erreur lecture des sauvegardes:', error);
      return [];
    }
  }

  /**
   * Génère un ID unique pour la sauvegarde
   */
  private generateBackupId(environment: string, operation: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substr(2, 6);
    return `backup_${environment}_${operation}_${timestamp}_${random}`;
  }

  /**
   * Assure que le répertoire de sauvegarde existe
   */
  private async ensureBackupDirectory(): Promise<void> {
    const fs = await import('fs');
    if (!fs.existsSync(this.backupDirectory)) {
      fs.mkdirSync(this.backupDirectory, { recursive: true });
    }
  }

  /**
   * Sauvegarde les données dans un fichier
   */
  private async saveBackupToFile(backupId: string, data: any): Promise<string> {
    const fs = await import('fs');
    const path = await import('path');
    
    const filePath = path.join(this.backupDirectory, `${backupId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return filePath;
  }

  /**
   * Charge les données depuis un fichier de sauvegarde
   */
  private async loadBackupFromFile(backupId: string): Promise<any | null> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const filePath = path.join(this.backupDirectory, `${backupId}.json`);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }

      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      console.log('❌ Erreur chargement sauvegarde:', error);
      return null;
    }
  }

  /**
   * Sauvegarde les métadonnées de sauvegarde
   */
  private async saveBackupMetadata(backup: Backup): Promise<void> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const metadataPath = path.join(this.backupDirectory, 'metadata.json');
      
      let metadata: any = { backups: [] };
      if (fs.existsSync(metadataPath)) {
        metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      }

      metadata.backups = metadata.backups || [];
      metadata.backups.push(backup);

      // Garder seulement les 50 dernières sauvegardes
      metadata.backups = metadata.backups
        .sort((a: Backup, b: Backup) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50);

      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.log('⚠️ Erreur sauvegarde métadonnées:', error);
    }
  }
}