import AsyncStorage from '@react-native-async-storage/async-storage';

const INVOICE_NUMBER_KEY = 'last_invoice_number';
const INVOICE_PREFIX = 'BO';

export class InvoiceNumberService {
  static async formatInvoiceNumber(invoiceNumber: string, invoiceYear: number): Promise<string> {
    try {
      // Formater le numéro de facture avec l'année de la facture
      const formattedNumber = `${INVOICE_PREFIX}${invoiceYear}${invoiceNumber}`;
      
      // Sauvegarder le numéro pour référence
      await AsyncStorage.setItem(INVOICE_NUMBER_KEY, formattedNumber);
      
      return formattedNumber;
    } catch (error) {
      console.error('Erreur lors du formatage du numéro de facture:', error);
      return `${INVOICE_PREFIX}${invoiceYear}${invoiceNumber}`;
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