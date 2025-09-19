import { InvoiceData } from '../types/invoice';
import { generateInvoiceHTML, InvoiceTemplateType } from '../utils/pdfTemplate';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SETTINGS_KEY, DEFAULT_SETTINGS, OwnerSettings } from '../features/settings/SettingsScreen';

export class TemplatePreviewService {
  /**
   * Génère des données de démonstration pour la prévisualisation
   */
  private static generateDemoData(): InvoiceData {
    const today = new Date();
    const arrivalDate = new Date(today);
    arrivalDate.setDate(today.getDate() + 7); // Dans 7 jours
    const departureDate = new Date(arrivalDate);
    departureDate.setDate(arrivalDate.getDate() + 3); // 3 nuits

    return {
      firstName: 'Marie',
      lastName: 'DUPONT',
      email: 'marie.dupont@email.com',
      arrivalDate: arrivalDate,
      departureDate: departureDate,
      numberOfNights: 3,
      pricePerNight: 85,
      taxAmount: 6.60,
      isPlatformCollectingTax: false,
      invoiceDate: today,
      invoiceNumber: '001',
      isGeniusRate: true,
      isBookingReservation: true,
      bookingNumber: '4578965231',
      isClientInvoice: false,
      clientInvoiceNumber: '',
      hasClientAddress: true,
      clientAddress: '123 Rue de la Paix',
      clientPostalCode: '75001',
      clientCity: 'Paris',
      selectedPropertyId: '', // Sera géré par le service
    };
  }

  /**
   * Génère une facture PDF de démonstration pour un template donné
   */
  public static async generatePreviewPDF(
    templateType: InvoiceTemplateType,
    language: 'fr' | 'en' | 'es' | 'de' | 'it' = 'fr'
  ): Promise<string> {
    try {
      // Générer les données de démo
      const demoData = this.generateDemoData();

      // Charger les paramètres utilisateur actuels
      let settings: OwnerSettings = DEFAULT_SETTINGS;
      try {
        const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
          settings = JSON.parse(savedSettings);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres pour la prévisualisation:', error);
      }

      // Forcer le template pour la prévisualisation
      const originalTemplate = settings.invoiceTemplate;
      settings.invoiceTemplate = templateType;

      // Sauvegarder temporairement les paramètres modifiés
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

      // Générer le HTML avec le template sélectionné
      const html = await generateInvoiceHTML(
        demoData,
        `FACT${new Date().getMonth() + 1 < 10 ? '0' : ''}${new Date().getMonth() + 1}-${new Date().getFullYear()}-001`,
        language
      );

      // Générer le PDF temporaire
      const { uri: pdfUri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // Restaurer les paramètres originaux
      settings.invoiceTemplate = originalTemplate;
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

      console.log('Preview PDF temporaire généré:', pdfUri);
      return pdfUri;

    } catch (error) {
      console.error('Erreur lors de la génération du PDF de prévisualisation:', error);
      throw error;
    }
  }

}