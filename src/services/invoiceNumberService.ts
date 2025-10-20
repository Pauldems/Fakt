import AsyncStorage from '@react-native-async-storage/async-storage';
import invoiceCounterService from './invoiceCounterService';

const INVOICE_NUMBER_KEY = 'last_invoice_number';

export class InvoiceNumberService {
  static async formatInvoiceNumber(sequentialNumber: string, invoiceDate: Date): Promise<string> {
    try {
      // Utiliser le format personnalisé de l'utilisateur
      const formattedNumber = await invoiceCounterService.generateFullInvoiceNumber(sequentialNumber, invoiceDate);

      // Sauvegarder le numéro pour référence
      await AsyncStorage.setItem(INVOICE_NUMBER_KEY, formattedNumber);

      return formattedNumber;
    } catch (error) {
      console.error('Erreur lors du formatage du numéro de facture:', error);
      // En cas d'erreur, utiliser un format par défaut
      return await invoiceCounterService.generateFullInvoiceNumber(sequentialNumber, invoiceDate);
    }
  }
  
  static async getCurrentInvoiceNumber(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(INVOICE_NUMBER_KEY);
    } catch (error) {
      console.error('Erreur lors de la récupération du numéro de facture:', error);
      return null;
    }
  }
}