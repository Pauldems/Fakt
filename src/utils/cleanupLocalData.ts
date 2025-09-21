import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Utilitaire pour nettoyer les données locales de test/anciennes
 */
export class LocalDataCleanup {

  /**
   * Nettoie les données de test et remet les paramètres par défaut
   */
  static async cleanTestData(): Promise<void> {
    try {
      console.log('🧹 Nettoyage des données de test...');
      
      // Récupérer les paramètres actuels
      const currentSettings = await AsyncStorage.getItem('@fakt_settings');
      
      if (currentSettings) {
        const settings = JSON.parse(currentSettings);
        
        // Supprimer les propriétés de test
        if (settings.propertyTemplates) {
          const cleanTemplates = settings.propertyTemplates.filter((prop: any) => 
            !prop.name?.includes('Test') && !prop.name?.includes('test')
          );
          
          settings.propertyTemplates = cleanTemplates;
          
          // Sauvegarder les paramètres nettoyés
          await AsyncStorage.setItem('@fakt_settings', JSON.stringify(settings));
          console.log(`✅ ${settings.propertyTemplates.length} propriétés conservées après nettoyage`);
        }
      }
      
    } catch (error) {
      console.error('❌ Erreur nettoyage données test:', error);
    }
  }

  /**
   * Remet complètement à zéro les paramètres pour un nouveau compte
   */
  static async resetSettingsForNewAccount(): Promise<void> {
    try {
      console.log('🔄 Réinitialisation complète pour nouveau compte...');
      
      const cleanSettings = {
        ownerName: '',
        ownerFirstName: '',
        ownerLastName: '',
        companyName: '',
        companyAddress: '',
        companyPostalCode: '',
        companyCity: '',
        establishmentId: '',
        legalEntityId: '',
        phoneNumber: '',
        email: '',
        enableBcc: false,
        bccEmail: '',
        useCustomEmail: false,
        customEmailSubject: '',
        customEmailBody: '',
        useSignature: false,
        signatureImage: '',
        customProperties: [],
        propertyTemplates: [], // Vide pour nouveau compte
        invoiceTemplate: 'original',
      };
      
      await AsyncStorage.setItem('@fakt_settings', JSON.stringify(cleanSettings));
      console.log('✅ Paramètres réinitialisés pour nouveau compte');
      
    } catch (error) {
      console.error('❌ Erreur réinitialisation paramètres:', error);
    }
  }

  /**
   * Vide complètement la liste des clients pour nouveau compte
   */
  static async cleanTestClients(): Promise<void> {
    try {
      console.log('🧹 Vidage complet des clients pour nouveau compte...');
      
      // Vider complètement la liste des clients
      await AsyncStorage.setItem('@fakt_clients', JSON.stringify([]));
      console.log('✅ Liste des clients vidée pour nouveau compte');
      
    } catch (error) {
      console.error('❌ Erreur vidage clients:', error);
    }
  }

  /**
   * Vide complètement la liste des factures pour nouveau compte
   */
  static async cleanTestInvoices(): Promise<void> {
    try {
      console.log('🧹 Vidage complet des factures pour nouveau compte...');
      
      // La bonne clé utilisée par LocalStorageService
      const INVOICE_STORAGE_KEY = 'invoices';
      
      // Vérifier d'abord ce qui existe dans les deux emplacements
      const oldKeyInvoices = await AsyncStorage.getItem('@fakt_invoices');
      const newKeyInvoices = await AsyncStorage.getItem(INVOICE_STORAGE_KEY);
      
      console.log('📋 Factures dans @fakt_invoices:', oldKeyInvoices ? JSON.parse(oldKeyInvoices).length : 0);
      console.log('📋 Factures dans invoices:', newKeyInvoices ? JSON.parse(newKeyInvoices).length : 0);
      
      // Vider les deux emplacements pour être sûr
      await AsyncStorage.setItem('@fakt_invoices', JSON.stringify([]));
      await AsyncStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify([]));
      
      // Vérifier que c'est bien vidé
      const afterCleanup1 = await AsyncStorage.getItem('@fakt_invoices');
      const afterCleanup2 = await AsyncStorage.getItem(INVOICE_STORAGE_KEY);
      console.log('📋 @fakt_invoices après nettoyage:', afterCleanup1 ? JSON.parse(afterCleanup1).length : 0);
      console.log('📋 invoices après nettoyage:', afterCleanup2 ? JSON.parse(afterCleanup2).length : 0);
      
      console.log('✅ Liste des factures vidée pour nouveau compte');
      
    } catch (error) {
      console.error('❌ Erreur vidage factures:', error);
    }
  }

  /**
   * Force le nettoyage immédiat des factures (pour debug)
   */
  static async forceCleanInvoices(): Promise<void> {
    console.log('🔥 NETTOYAGE FORCÉ DES FACTURES...');
    
    // Vider aussi tous les autres stockages potentiels
    const keys = await AsyncStorage.getAllKeys();
    console.log('🔑 Toutes les clés AsyncStorage:', keys);
    console.log('🔑 Clés contenant "invoice":', keys.filter(k => k.toLowerCase().includes('invoice')));
    
    await this.cleanTestInvoices();
  }

  /**
   * Nettoyage complet pour nouveau compte activé
   */
  static async fullCleanupForNewAccount(): Promise<void> {
    await this.resetSettingsForNewAccount();
    await this.cleanTestClients();
    await this.cleanTestInvoices();
    console.log('🎉 Nettoyage complet terminé pour nouveau compte');
  }
}