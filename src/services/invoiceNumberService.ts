import AsyncStorage from '@react-native-async-storage/async-storage';

const INVOICE_NUMBER_KEY = 'last_invoice_number';
const INVOICE_PREFIX = 'FACT';

export class InvoiceNumberService {
  static async formatInvoiceNumber(sequentialNumber: string, invoiceDate: Date): Promise<string> {
    try {
      // Extraire mois et année de la date de facture
      const month = String(invoiceDate.getMonth() + 1).padStart(2, '0');
      const year = invoiceDate.getFullYear();
      
      // Formater le numéro de facture : BO + MM-YYYY-NNN
      const formattedNumber = `${INVOICE_PREFIX}${month}-${year}-${sequentialNumber}`;
      
      // Sauvegarder le numéro pour référence
      await AsyncStorage.setItem(INVOICE_NUMBER_KEY, formattedNumber);
      
      return formattedNumber;
    } catch (error) {
      console.error('Erreur lors du formatage du numéro de facture:', error);
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      return `${INVOICE_PREFIX}${month}-${year}-${sequentialNumber}`;
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