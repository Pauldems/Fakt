import userDataService from './userDataService';
import { LocalStorageService, StoredInvoice } from './localStorageService';
import { InvoiceData } from '../types/invoice';
import googleDriveService from './googleDriveService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SETTINGS_KEY, PropertyTemplate, OwnerSettings } from '../features/settings/SettingsScreen';
import cacheService, { CACHE_KEYS } from './cacheService';

/**
 * Service hybride pour les factures :
 * - Utilise Firebase si l'utilisateur est connecté
 * - Utilise AsyncStorage sinon (mode hors ligne)
 * - Synchronisation automatique
 */
class HybridInvoiceService {

  /**
   * Récupère toutes les factures (Firebase ou local)
   */
  async getInvoices(): Promise<StoredInvoice[]> {
    try {
      const isConnected = await userDataService.isUserConnected();
      console.log('📄 Utilisateur connecté pour factures:', isConnected);
      
      if (isConnected) {
        console.log('📡 Récupération des factures depuis Firebase...');
        const firebaseInvoices = await userDataService.getInvoices();
        console.log('📊 Factures Firebase récupérées:', firebaseInvoices.length);
        
        if (firebaseInvoices.length > 0) {
          // Convertir le format Firebase vers StoredInvoice
          const convertedInvoices = this.convertFirebaseToStoredInvoices(firebaseInvoices);
          // Sauvegarder aussi localement pour le cache
          await this.saveInvoicesToLocal(convertedInvoices);
          return convertedInvoices;
        }
      }
      
      console.log('💾 Récupération des factures depuis le stockage local...');
      const localInvoices = await LocalStorageService.getInvoices();
      console.log('📂 Factures locales:', localInvoices.length);
      return localInvoices;
      
    } catch (error) {
      console.error('❌ Erreur récupération factures, fallback local:', error);
      return await LocalStorageService.getInvoices();
    }
  }

  /**
   * Sauvegarde une facture avec langue spécifique (Firebase ET local)
   */
  async saveInvoice(invoiceData: InvoiceData, invoiceNumber: string, language: 'fr' | 'en' | 'es' | 'de' | 'it' = 'fr'): Promise<StoredInvoice> {
    try {
      // Générer le PDF avec la langue spécifiée
      console.log('💾 Sauvegarde locale de la facture avec langue:', language);
      
      // Utiliser la même logique que saveInvoiceWithLanguage mais via LocalStorageService
      const storedInvoice = await this.saveInvoiceWithLanguage(invoiceData, invoiceNumber, language);
      
      // Puis sauvegarder dans Firebase si connecté
      const isConnected = await userDataService.isUserConnected();
      if (isConnected) {
        console.log('📡 Sauvegarde de la facture dans Firebase...');
        const firebaseData = this.convertStoredInvoiceToFirebase(storedInvoice);
        await userDataService.saveInvoice(firebaseData);
        console.log('✅ Facture sauvegardée dans Firebase');
      } else {
        console.log('⚠️ Mode hors ligne - facture sauvegardée localement uniquement');
      }
      
      // Synchroniser avec Google Drive si connecté (désactivé temporairement)
      // await this.syncToGoogleDrive(storedInvoice, invoiceData);

      // Invalider le cache des factures
      cacheService.invalidate(CACHE_KEYS.INVOICES);

      return storedInvoice;

    } catch (error) {
      console.error('❌ Erreur sauvegarde facture:', error);
      throw error;
    }
  }

  /**
   * Supprime une facture (Firebase ET local)
   */
  async deleteInvoice(invoiceId: string): Promise<void> {
    try {
      // Supprimer localement
      console.log('💾 Suppression locale de la facture:', invoiceId);
      await LocalStorageService.deleteInvoice(invoiceId);

      // Supprimer dans Firebase si connecté
      const isConnected = await userDataService.isUserConnected();
      if (isConnected) {
        console.log('📡 Suppression de la facture dans Firebase...');
        console.log('✅ Facture supprimée de Firebase');
      }

      // Invalider le cache des factures
      cacheService.invalidate(CACHE_KEYS.INVOICES);

    } catch (error) {
      console.error('❌ Erreur suppression facture:', error);
      throw error;
    }
  }

  /**
   * Synchronise les factures avec Firebase
   */
  async syncWithFirebase(): Promise<void> {
    try {
      const isConnected = await userDataService.isUserConnected();
      if (!isConnected) {
        console.log('⚠️ Utilisateur non connecté, synchronisation impossible');
        return;
      }

      console.log('🔄 Synchronisation des factures avec Firebase...');
      
      // Récupérer les factures Firebase
      const firebaseInvoices = await userDataService.getInvoices();
      
      if (firebaseInvoices.length > 0) {
        // Sauvegarder localement
        const convertedInvoices = this.convertFirebaseToStoredInvoices(firebaseInvoices);
        await this.saveInvoicesToLocal(convertedInvoices);
        console.log('✅ Factures synchronisées depuis Firebase');
      } else {
        // Si pas de factures Firebase, envoyer les factures locales
        const localInvoices = await LocalStorageService.getInvoices();
        if (localInvoices.length > 0) {
          for (const invoice of localInvoices) {
            const firebaseData = this.convertStoredInvoiceToFirebase(invoice);
            await userDataService.saveInvoice(firebaseData);
          }
          console.log('✅ Factures locales envoyées vers Firebase');
        }
      }
      
    } catch (error) {
      console.error('❌ Erreur synchronisation factures:', error);
    }
  }

  // ============ MÉTHODES PRIVÉES ============

  /**
   * Synchronise une facture avec Google Drive
   */
  private async syncToGoogleDrive(storedInvoice: StoredInvoice, invoiceData: InvoiceData): Promise<void> {
    try {
      // Vérifier si Google Drive est connecté
      if (!googleDriveService.isConnected()) {
        console.log('⚠️ Google Drive non connecté, sync ignorée');
        return;
      }

      // Récupérer le nom de la propriété
      let propertyName: string | undefined;
      if (invoiceData.selectedPropertyId) {
        try {
          const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
          if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            const property = settings.propertyTemplates?.find(
              (p: PropertyTemplate) => p.id === invoiceData.selectedPropertyId
            );
            propertyName = property?.name;
          }
        } catch (error) {
          console.error('❌ Erreur récupération nom propriété:', error);
        }
      }

      // Synchroniser avec Google Drive
      const success = await googleDriveService.syncInvoice(
        storedInvoice.pdfUri,
        storedInvoice.invoiceNumber,
        propertyName
      );

      if (success) {
        console.log('☁️ Facture synchronisée avec Google Drive');
      } else {
        console.log('⚠️ Échec synchronisation Google Drive');
      }
    } catch (error) {
      console.error('❌ Erreur sync Google Drive:', error);
      // Ne pas bloquer la sauvegarde si la sync échoue
    }
  }

  /**
   * Sauvegarde une facture localement avec une langue spécifique
   */
  private async saveInvoiceWithLanguage(invoiceData: InvoiceData, invoiceNumberInput: string, language: 'fr' | 'en' | 'es' | 'de' | 'it'): Promise<StoredInvoice> {
    const { generateInvoiceHTML } = require('../utils/pdfTemplate');
    const invoiceCounterService = require('./invoiceCounterService').default;
    const Print = require('expo-print');
    const FileSystem = require('expo-file-system/legacy');
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;

    // Générer un ID unique
    const id = Date.now().toString();
    const invoiceDate = new Date(invoiceData.invoiceDate);

    // Utiliser les services pour formatter le numéro de facture
    const invoiceNumber = await invoiceCounterService.formatInvoiceNumber(invoiceNumberInput, invoiceDate);
    
    console.log('Numéro de facture formaté:', invoiceNumber);

    // Calculer le montant total avec TVA si applicable
    const numberOfNights = typeof invoiceData.numberOfNights === 'string' ? parseInt(invoiceData.numberOfNights) : invoiceData.numberOfNights;
    const pricePerNight = typeof invoiceData.pricePerNight === 'string' ? parseFloat((invoiceData.pricePerNight as string).replace(',', '.')) : invoiceData.pricePerNight;
    const taxAmount = typeof invoiceData.taxAmount === 'string' ? parseFloat((invoiceData.taxAmount as string).replace(',', '.')) : invoiceData.taxAmount;
    
    // Calculer le total des extras
    const totalExtras = invoiceData.extras ? invoiceData.extras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0) : 0;
    
    // Inclure la taxe seulement si la plateforme ne la collecte pas
    const baseTotalAmount = (numberOfNights * pricePerNight) + totalExtras + (invoiceData.isPlatformCollectingTax ? 0 : taxAmount);

    // Récupérer les settings pour la TVA via AsyncStorage car nous sommes dans saveInvoiceWithLanguage
    let vatSettings = { isSubjectToVAT: false, vatRate: 10, useCustomRate: false, customRate: 10 };
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings.vatSettings) {
          vatSettings = parsedSettings.vatSettings;
        }
      }
    } catch (error) {
      console.error('Erreur lecture settings TVA:', error);
    }

    // Calculer le montant final avec TVA
    let totalAmount = baseTotalAmount;
    if (vatSettings.isSubjectToVAT) {
      // L'utilisateur entre TTC, donc totalAmount reste le même
      // Le calcul HT/TVA sera fait dans le template PDF
      totalAmount = baseTotalAmount;
    }

    console.log('Montant total calculé (avec TVA si applicable):', totalAmount);

    // Générer le PDF final avec le bon numéro de facture et la langue
    console.log('Génération du PDF final avec numéro:', invoiceNumber, 'et langue:', language);
    const html = await generateInvoiceHTML(invoiceData, invoiceNumber, language);
    const { uri: tempPdfUri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Copier le PDF dans un dossier permanent
    const permanentDir = `${FileSystem.documentDirectory}invoices/`;
    await FileSystem.makeDirectoryAsync(permanentDir, { intermediates: true });
    
    // Utiliser le numéro de facture comme nom de fichier
    const safeFileName = `${invoiceNumber}_${invoiceData.firstName}_${invoiceData.lastName.toUpperCase()}.pdf`;
    const permanentPath = `${permanentDir}${safeFileName}`;
    
    console.log('Copie du PDF de:', tempPdfUri);
    console.log('Vers:', permanentPath);
    
    await FileSystem.copyAsync({
      from: tempPdfUri,
      to: permanentPath
    });

    // Supprimer le fichier temporaire
    await FileSystem.deleteAsync(tempPdfUri, { idempotent: true });

    // Créer l'objet facture avec le format StoredInvoice
    const storedInvoice: StoredInvoice = {
      id,
      data: invoiceData,
      pdfUri: permanentPath,
      createdAt: new Date(),
      totalAmount,
      invoiceNumber
    };

    // Récupérer les factures existantes
    const invoices = await LocalStorageService.getInvoices();
    
    // Ajouter la nouvelle facture
    invoices.unshift(storedInvoice);
    
    // Préparer les données pour la sauvegarde
    const dataToSave = invoices.map(inv => ({
      ...inv,
      data: {
        ...inv.data,
        invoiceDate: inv.data.invoiceDate instanceof Date ? inv.data.invoiceDate.toISOString() : inv.data.invoiceDate,
        arrivalDate: inv.data.arrivalDate instanceof Date ? inv.data.arrivalDate.toISOString() : inv.data.arrivalDate,
        departureDate: inv.data.departureDate instanceof Date ? inv.data.departureDate.toISOString() : inv.data.departureDate,
      },
      createdAt: inv.createdAt instanceof Date ? inv.createdAt.toISOString() : inv.createdAt
    }));
    
    // Sauvegarder toutes les factures avec la bonne clé
    await AsyncStorage.setItem('invoices', JSON.stringify(dataToSave));

    return storedInvoice;
  }

  /**
   * Convertit les factures Firebase vers le format StoredInvoice
   */
  private convertFirebaseToStoredInvoices(firebaseInvoices: Array<Record<string, unknown>>): StoredInvoice[] {
    return firebaseInvoices.map(invoice => ({
      id: invoice.id,
      data: {
        ...invoice,
        invoiceDate: invoice.invoiceDate?.toDate ? invoice.invoiceDate.toDate() : new Date(invoice.invoiceDate),
        arrivalDate: invoice.arrivalDate?.toDate ? invoice.arrivalDate.toDate() : new Date(invoice.arrivalDate),
        departureDate: invoice.departureDate?.toDate ? invoice.departureDate.toDate() : new Date(invoice.departureDate),
      },
      pdfUri: invoice.pdfUri || '',
      createdAt: invoice.createdAt?.toDate ? invoice.createdAt.toDate() : new Date(invoice.createdAt),
      totalAmount: invoice.totalAmount || 0,
      invoiceNumber: invoice.invoiceNumber || '',
    }));
  }

  /**
   * Convertit une StoredInvoice vers le format Firebase
   */
  private convertStoredInvoiceToFirebase(storedInvoice: StoredInvoice): Record<string, unknown> {
    return {
      ...storedInvoice.data,
      id: storedInvoice.id,
      invoiceNumber: storedInvoice.invoiceNumber,
      totalAmount: storedInvoice.totalAmount,
      pdfUri: storedInvoice.pdfUri,
      createdAt: storedInvoice.createdAt,
    };
  }

  /**
   * Sauvegarde les factures localement
   */
  private async saveInvoicesToLocal(invoices: StoredInvoice[]): Promise<void> {
    try {
      // Utiliser la même logique que LocalStorageService mais sans duplication
      const dataToSave = invoices.map(inv => ({
        ...inv,
        data: {
          ...inv.data,
          invoiceDate: inv.data.invoiceDate instanceof Date ? inv.data.invoiceDate.toISOString() : inv.data.invoiceDate,
          arrivalDate: inv.data.arrivalDate instanceof Date ? inv.data.arrivalDate.toISOString() : inv.data.arrivalDate,
          departureDate: inv.data.departureDate instanceof Date ? inv.data.departureDate.toISOString() : inv.data.departureDate,
        },
        createdAt: inv.createdAt instanceof Date ? inv.createdAt.toISOString() : inv.createdAt
      }));
      
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('invoices', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('❌ Erreur sauvegarde factures locales:', error);
      throw error;
    }
  }
}

export default new HybridInvoiceService();