import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalStorageService } from './localStorageService';
import consentService from './consentService';
import * as FileSystem from 'expo-file-system/legacy';

class DataDeleteService {
  /**
   * Supprime TOUTES les données LOCALES de l'utilisateur
   * ⚠️ ACTION IRRÉVERSIBLE
   *
   * Note : Cette fonction supprime uniquement les données sur l'appareil.
   * Le code d'activation dans Firebase n'est PAS supprimé (seul l'admin peut le faire).
   * L'utilisateur devra acheter un nouveau code d'activation pour réutiliser l'app.
   */
  async deleteAllUserData(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🗑️ Début de la suppression totale des données...');

      // 1. Supprimer toutes les factures (localement + PDFs)
      console.log('📄 Suppression des factures...');
      await LocalStorageService.clearAll();

      // 2. Supprimer tous les clients
      console.log('👥 Suppression des clients...');
      await AsyncStorage.removeItem('clients');

      // 3. Supprimer les paramètres
      console.log('⚙️ Suppression des paramètres...');
      await AsyncStorage.removeItem('owner_settings');

      // 4. Supprimer le consentement RGPD
      console.log('📋 Suppression du consentement...');
      await consentService.revokeConsent();

      // 5. Supprimer le compteur de factures
      console.log('🔢 Suppression du compteur...');
      await AsyncStorage.removeItem('@fakt_last_invoice_number');
      await AsyncStorage.removeItem('last_invoice_number');

      // 6. Supprimer les données d'activation locale
      console.log('🔑 Suppression de l\'activation...');
      // Clés utilisées par activationService
      await AsyncStorage.removeItem('app_activation_code'); // ✅ CLÉ PRINCIPALE !
      await AsyncStorage.removeItem('app_activation_data'); // ✅ Données d'activation
      await AsyncStorage.removeItem('device_id'); // ✅ Device ID
      // Anciennes clés (peut-être obsolètes mais on les supprime quand même)
      await AsyncStorage.removeItem('@fakt_activation_status');
      await AsyncStorage.removeItem('@fakt_activation_code');
      await AsyncStorage.removeItem('@fakt_activation_name');
      await AsyncStorage.removeItem('@fakt_activation_email');
      await AsyncStorage.removeItem('@fakt_activation_date');
      await AsyncStorage.removeItem('@fakt_device_id');

      // 7. Supprimer le dossier des PDFs si existant
      console.log('📁 Suppression du dossier PDFs...');
      try {
        const pdfDir = `${FileSystem.documentDirectory}invoices/`;
        const dirInfo = await FileSystem.getInfoAsync(pdfDir);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(pdfDir, { idempotent: true });
        }
      } catch (error) {
        console.log('⚠️ Erreur suppression dossier PDF (ignorée):', error);
      }

      // 8. Supprimer les données Firebase si connecté
      console.log('☁️ Suppression des données Firebase...');
      try {
        // Les données Firebase seront supprimées automatiquement
        // par la Cloud Function quand le code d'activation sera supprimé
        // Ici on supprime juste les références locales
        await AsyncStorage.removeItem('firebase_user_id');
      } catch (error) {
        console.log('⚠️ Erreur suppression Firebase (ignorée):', error);
      }

      // 9. Supprimer tous les autres caches possibles
      console.log('🧹 Nettoyage final...');
      await AsyncStorage.removeItem('invoices');
      await AsyncStorage.removeItem('@fakt_subscription_type');
      await AsyncStorage.removeItem('@fakt_subscription_expires');

      console.log('✅ Toutes les données ont été supprimées');

      return {
        success: true,
        message: 'Toutes vos données ont été supprimées définitivement'
      };

    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      return {
        success: false,
        message: `Erreur lors de la suppression: ${error}`
      };
    }
  }

  /**
   * Obtient un résumé des données qui seront supprimées
   */
  async getDeleteSummary(): Promise<{
    invoicesCount: number;
    clientsCount: number;
  }> {
    try {
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
      };
    } catch (error) {
      console.error('❌ Erreur récupération résumé:', error);
      return {
        invoicesCount: 0,
        clientsCount: 0,
      };
    }
  }
}

export default new DataDeleteService();
