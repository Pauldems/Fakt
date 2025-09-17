import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { StoredInvoice } from './localStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SETTINGS_KEY, PropertyTemplate } from '../features/settings/SettingsScreen';

export class CSVExportService {
  /**
   * Formate une valeur pour CSV en gérant les caractères spéciaux
   */
  private static formatCSVValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    
    // Convertir en string
    let strValue = String(value);
    
    // Si la valeur contient des points-virgules, guillemets ou retours à la ligne, l'encapsuler
    if (strValue.includes(';') || strValue.includes('"') || strValue.includes('\n')) {
      strValue = `"${strValue.replace(/"/g, '""')}"`;
    }
    
    return strValue;
  }

  /**
   * Formate un nombre avec virgule pour Excel français
   */
  private static formatNumber(value: number | string): string {
    if (typeof value === 'string') {
      value = parseFloat(value);
    }
    return value.toFixed(2).replace('.', ',');
  }

  /**
   * Formate une date au format YYYY-MM-DD
   */
  private static formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Récupère le nom de la propriété depuis les settings
   */
  private static async getPropertyName(propertyId: string): Promise<string> {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        const property = settings.propertyTemplates?.find((p: PropertyTemplate) => p.id === propertyId);
        return property?.name || 'Non spécifiée';
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du nom de propriété:', error);
    }
    return 'Non spécifiée';
  }

  /**
   * Génère le contenu CSV à partir des factures
   */
  public static async generateCSVContent(invoices: StoredInvoice[]): Promise<string> {
    // En-tête du CSV
    const headers = [
      'Date_Facture',
      'Numero_Facture',
      'Nom',
      'Prenom',
      'Email',
      'Propriete',
      'Date_Arrivee',
      'Date_Depart',
      'Nb_Nuits',
      'Prix_Nuit_HT',
      'Total_HT',
      'Taxe_Sejour',
      'Total_TTC',
      'Plateforme',
      'Numero_Reservation'
    ];

    // Construire les lignes
    const rows: string[] = [headers.join(';')];

    for (const invoice of invoices) {
      const data = invoice.data;
      
      // Récupérer le nom de la propriété
      const propertyName = await this.getPropertyName(data.selectedPropertyId);
      
      // Calculer les montants
      const numberOfNights = typeof data.numberOfNights === 'string' 
        ? parseInt(data.numberOfNights) 
        : data.numberOfNights;
      
      const pricePerNight = typeof data.pricePerNight === 'string' 
        ? parseFloat(data.pricePerNight.replace(',', '.')) 
        : data.pricePerNight;
      
      const taxAmount = typeof data.taxAmount === 'string' 
        ? parseFloat(data.taxAmount.replace(',', '.')) 
        : data.taxAmount;
      
      const totalHT = numberOfNights * pricePerNight;
      const taxeEffective = data.isPlatformCollectingTax ? 0 : taxAmount;
      const totalTTC = totalHT + taxeEffective;
      
      // Déterminer la plateforme
      const plateforme = data.isBookingReservation ? 'Booking' : 'Direct';
      
      // Créer la ligne CSV
      const row = [
        this.formatDate(invoice.createdAt),
        this.formatCSVValue(invoice.invoiceNumber),
        this.formatCSVValue(data.lastName.toUpperCase()),
        this.formatCSVValue(data.firstName),
        this.formatCSVValue(data.email),
        this.formatCSVValue(propertyName),
        data.arrivalDate ? this.formatDate(data.arrivalDate) : '',
        data.departureDate ? this.formatDate(data.departureDate) : '',
        numberOfNights.toString(),
        this.formatNumber(pricePerNight),
        this.formatNumber(totalHT),
        this.formatNumber(taxeEffective),
        this.formatNumber(totalTTC),
        plateforme,
        this.formatCSVValue(data.bookingNumber || '')
      ];

      rows.push(row.join(';'));
    }

    return rows.join('\n');
  }

  /**
   * Export les factures en CSV
   */
  public static async exportToCSV(invoices: StoredInvoice[]): Promise<void> {
    try {
      // Générer le contenu CSV
      const csvContent = await this.generateCSVContent(invoices);
      
      // Générer le nom du fichier avec la date du jour
      const today = new Date();
      const fileName = `factures_export_${this.formatDate(today)}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      // Écrire le fichier
      await FileSystem.writeAsStringAsync(filePath, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      console.log('Fichier CSV créé:', filePath);
      
      // Partager le fichier
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Exporter les factures',
        });
      } else {
        throw new Error('Le partage n\'est pas disponible sur cet appareil');
      }
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      throw error;
    }
  }
}