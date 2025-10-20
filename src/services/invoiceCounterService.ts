import AsyncStorage from '@react-native-async-storage/async-storage';
import hybridSettingsService from './hybridSettingsService';

const LAST_INVOICE_NUMBER_KEY = '@fakt_last_invoice_number';

interface InvoiceCounterData {
  lastNumber: number;
  lastUsedDate: string;
}

class InvoiceCounterService {
  /**
   * Récupère le dernier numéro de facture utilisé
   */
  async getLastInvoiceNumber(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(LAST_INVOICE_NUMBER_KEY);
      if (data) {
        const counterData: InvoiceCounterData = JSON.parse(data);
        return counterData.lastNumber;
      }
      return 0; // Si aucune facture n'existe, on commence à 0
    } catch (error) {
      console.error('Erreur lors de la récupération du dernier numéro de facture:', error);
      return 0;
    }
  }

  /**
   * Sauvegarde le dernier numéro de facture utilisé
   */
  async saveLastInvoiceNumber(number: number): Promise<void> {
    try {
      const counterData: InvoiceCounterData = {
        lastNumber: number,
        lastUsedDate: new Date().toISOString()
      };
      await AsyncStorage.setItem(LAST_INVOICE_NUMBER_KEY, JSON.stringify(counterData));
      console.log('Dernier numéro de facture sauvegardé:', number);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du dernier numéro de facture:', error);
    }
  }

  /**
   * Génère le prochain numéro séquentiel simple (001, 002, etc.)
   * Basé sur la dernière facture existante
   * Retourne UNIQUEMENT le numéro séquentiel (ex: "001")
   */
  async getNextInvoiceNumber(): Promise<string> {
    try {
      // Charger toutes les factures existantes
      const { LocalStorageService } = require('./localStorageService');
      const existingInvoices = await LocalStorageService.getInvoices();

      if (existingInvoices.length === 0) {
        // Aucune facture existante, commencer à 001
        console.log('Aucune facture trouvée, démarrage à 001');
        return '001';
      }

      // Extraire tous les numéros séquentiels existants
      const sequentialNumbers = existingInvoices
        .map(invoice => this.extractSequentialNumber(invoice.invoiceNumber))
        .filter(num => num > 0)
        .sort((a, b) => b - a); // Trier par ordre décroissant

      if (sequentialNumbers.length === 0) {
        console.log('Aucun numéro séquentiel valide trouvé, démarrage à 001');
        return '001';
      }

      // Prendre le plus grand numéro et ajouter 1
      const lastNumber = sequentialNumbers[0];
      const nextNumber = lastNumber + 1;

      console.log('Dernier numéro trouvé:', lastNumber, '-> Prochain:', nextNumber);

      // Formater le numéro avec au minimum 3 chiffres
      const numberPart = nextNumber < 1000
        ? String(nextNumber).padStart(3, '0')
        : String(nextNumber);

      return numberPart;
    } catch (error) {
      console.error('Erreur lors de la génération du prochain numéro:', error);
      return '001';
    }
  }

  /**
   * Génère le numéro de facture COMPLET en appliquant le format personnalisé
   * À utiliser lors de la sauvegarde de la facture
   */
  async generateFullInvoiceNumber(sequentialNumber: string, invoiceDate?: Date): Promise<string> {
    const date = invoiceDate || new Date();
    return await this.formatInvoiceNumberWithCustomFormat(sequentialNumber, date);
  }

  /**
   * Génère le numéro de facture complet au format MM-YYYY-NNN à partir d'une date et d'un numéro
   */
  formatInvoiceNumberWithDate(sequentialNumber: string, invoiceDate: Date): string {
    const month = String(invoiceDate.getMonth() + 1).padStart(2, '0');
    const year = invoiceDate.getFullYear();
    return `${month}-${year}-${sequentialNumber}`;
  }

  /**
   * Génère le numéro de facture avec un format personnalisé
   * Variables disponibles : {ANNEE}, {MOIS}, {JOUR}, {N}
   */
  async formatInvoiceNumberWithCustomFormat(sequentialNumber: string, invoiceDate: Date): Promise<string> {
    try {
      // Récupérer le format personnalisé depuis les paramètres
      const settings = await hybridSettingsService.getSettings();
      const format = settings.invoiceNumberFormat || 'FACT-{ANNEE}-{MOIS}-{JOUR}-{N}';

      // Préparer les valeurs de remplacement
      const year = invoiceDate.getFullYear();
      const month = String(invoiceDate.getMonth() + 1).padStart(2, '0');
      const day = String(invoiceDate.getDate()).padStart(2, '0');

      // Remplacer les variables
      let result = format
        .replace(/\{ANNEE\}/g, String(year))
        .replace(/\{MOIS\}/g, month)
        .replace(/\{JOUR\}/g, day)
        .replace(/\{N\}/g, sequentialNumber);

      return result;
    } catch (error) {
      console.error('Erreur lors du formatage personnalisé, utilisation du format par défaut:', error);
      return this.formatInvoiceNumberWithDate(sequentialNumber, invoiceDate);
    }
  }

  /**
   * Extrait le numéro séquentiel d'un numéro de facture formaté
   * Recherche le dernier groupe de chiffres dans le numéro (qui correspond à {N})
   * Par exemple: "FACT09-2025-032" -> 32, "FACT-2025-10-001" -> 1
   */
  extractSequentialNumber(invoiceNumber: string): number {
    try {
      // Rechercher tous les groupes de chiffres dans le numéro de facture
      const matches = invoiceNumber.match(/\d+/g);

      if (!matches || matches.length === 0) {
        return 0;
      }

      // Le dernier groupe de chiffres est supposé être le compteur {N}
      const lastMatch = matches[matches.length - 1];
      return parseInt(lastMatch, 10) || 0;
    } catch (error) {
      console.error('Erreur lors de l\'extraction du numéro séquentiel:', error);
      return 0;
    }
  }

  /**
   * Met à jour le compteur si un numéro de facture est utilisé manuellement
   * Cela évite les doublons si l'utilisateur modifie le numéro proposé
   */
  async updateCounterIfNeeded(invoiceNumber: string): Promise<void> {
    try {
      const sequentialNumber = this.extractSequentialNumber(invoiceNumber);
      const lastNumber = await this.getLastInvoiceNumber();
      
      // Si le numéro utilisé est supérieur au dernier connu, on met à jour
      if (sequentialNumber > lastNumber) {
        await this.saveLastInvoiceNumber(sequentialNumber);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du compteur:', error);
    }
  }
}

export default new InvoiceCounterService();