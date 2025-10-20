import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { LocalStorageService } from './localStorageService';
import hybridSettingsService from './hybridSettingsService';
import consentService from './consentService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ExportData {
  exportDate: string;
  appVersion: string;
  userData: {
    consent: any;
    settings: any;
    clients: any[];
    invoices: any[];
    invoiceCounter: any;
  };
}

class DataExportService {
  /**
   * Exporte toutes les données de l'utilisateur au format JSON
   * Conformément au droit à la portabilité RGPD
   */
  async exportAllData(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📤 Début de l\'export des données...');

      // 1. Récupérer toutes les données
      const consent = await consentService.getConsent();
      const settings = await hybridSettingsService.getSettings();
      const invoices = await LocalStorageService.getInvoices();

      // Récupérer les clients depuis AsyncStorage
      let clients = [];
      try {
        const clientsJson = await AsyncStorage.getItem('clients');
        if (clientsJson) {
          clients = JSON.parse(clientsJson);
        }
      } catch (error) {
        console.log('Aucun client trouvé');
      }

      // Récupérer le compteur de factures
      let invoiceCounter = null;
      try {
        const counterJson = await AsyncStorage.getItem('@fakt_last_invoice_number');
        if (counterJson) {
          invoiceCounter = JSON.parse(counterJson);
        }
      } catch (error) {
        console.log('Aucun compteur trouvé');
      }

      // 2. Créer l'objet d'export
      const exportData: ExportData = {
        exportDate: new Date().toISOString(),
        appVersion: '1.0',
        userData: {
          consent: consent || null,
          settings: settings || null,
          clients: clients || [],
          invoices: invoices.map(inv => ({
            ...inv,
            // Convertir les dates en ISO pour la sérialization
            createdAt: inv.createdAt instanceof Date ? inv.createdAt.toISOString() : inv.createdAt,
            data: {
              ...inv.data,
              invoiceDate: inv.data.invoiceDate instanceof Date ? inv.data.invoiceDate.toISOString() : inv.data.invoiceDate,
              arrivalDate: inv.data.arrivalDate instanceof Date ? inv.data.arrivalDate.toISOString() : inv.data.arrivalDate,
              departureDate: inv.data.departureDate instanceof Date ? inv.data.departureDate.toISOString() : inv.data.departureDate,
            }
          })) || [],
          invoiceCounter: invoiceCounter || null,
        }
      };

      // 3. Générer le nom du fichier
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `fakt-export-${timestamp}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      // 4. Écrire le fichier
      await FileSystem.writeAsStringAsync(
        filePath,
        JSON.stringify(exportData, null, 2),
        { encoding: FileSystem.EncodingType.UTF8 }
      );

      console.log('✅ Fichier créé:', filePath);

      // 5. Vérifier si le partage est disponible
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        return {
          success: false,
          message: 'Le partage n\'est pas disponible sur cet appareil'
        };
      }

      // 6. Partager le fichier
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Exporter vos données Fakt',
        UTI: 'public.json'
      });

      console.log('✅ Export terminé avec succès');

      return {
        success: true,
        message: 'Vos données ont été exportées avec succès'
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'export:', error);
      return {
        success: false,
        message: `Erreur lors de l'export: ${error}`
      };
    }
  }

  /**
   * Obtient un résumé des données à exporter (pour affichage avant export)
   */
  async getDataSummary(): Promise<{
    invoicesCount: number;
    clientsCount: number;
    hasConsent: boolean;
    hasSettings: boolean;
  }> {
    try {
      const consent = await consentService.getConsent();
      const settings = await hybridSettingsService.getSettings();
      const invoices = await LocalStorageService.getInvoices();

      let clientsCount = 0;
      try {
        const clientsJson = await AsyncStorage.getItem('clients');
        if (clientsJson) {
          const clients = JSON.parse(clientsJson);
          clientsCount = clients.length;
        }
      } catch (error) {
        console.log('Aucun client trouvé');
      }

      return {
        invoicesCount: invoices.length,
        clientsCount,
        hasConsent: consent !== null,
        hasSettings: settings !== null,
      };
    } catch (error) {
      console.error('❌ Erreur récupération résumé:', error);
      return {
        invoicesCount: 0,
        clientsCount: 0,
        hasConsent: false,
        hasSettings: false,
      };
    }
  }
}

export default new DataExportService();
