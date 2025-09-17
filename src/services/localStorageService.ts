import AsyncStorage from '@react-native-async-storage/async-storage';
import { InvoiceData } from '../types/invoice';
import * as FileSystem from 'expo-file-system';
import { InvoiceNumberService } from './invoiceNumberService';
import invoiceCounterService from './invoiceCounterService';

export interface StoredInvoice {
  id: string;
  data: InvoiceData;
  pdfUri: string;
  createdAt: Date;
  totalAmount: number;
  invoiceNumber: string;
}

const STORAGE_KEY = 'invoices';

export class LocalStorageService {
  static async init() {
    // Créer le dossier pour les PDFs s'il n'existe pas
    const pdfDir = `${FileSystem.documentDirectory}invoices/`;
    const dirInfo = await FileSystem.getInfoAsync(pdfDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(pdfDir, { intermediates: true });
    }
  }

  static async saveInvoice(invoiceData: InvoiceData, invoiceNumberInput?: string): Promise<StoredInvoice> {
    try {
      console.log('LocalStorageService.saveInvoice - Début');
      console.log('invoiceData:', JSON.stringify(invoiceData, null, 2));

      // Vérifier que invoiceData est bien défini
      if (!invoiceData) {
        throw new Error('invoiceData est undefined');
      }

      // Générer un ID unique
      const id = Date.now().toString();
      const invoiceDate = new Date(invoiceData.invoiceDate);
      
      // Si aucun numéro n'est fourni, générer automatiquement le prochain
      let sequentialNumber: string;
      if (!invoiceNumberInput || invoiceNumberInput.trim() === '') {
        sequentialNumber = await invoiceCounterService.getNextInvoiceNumber();
        console.log('Numéro auto-généré:', sequentialNumber);
      } else {
        sequentialNumber = invoiceNumberInput;
        console.log('Numéro fourni:', sequentialNumber);
      }
      
      // Formater le numéro de facture complet
      const invoiceNumber = await InvoiceNumberService.formatInvoiceNumber(sequentialNumber, invoiceDate);
      
      console.log('Numéro de facture formaté:', invoiceNumber);

      // Calculer le montant total
      const numberOfNights = typeof invoiceData.numberOfNights === 'string' ? parseInt(invoiceData.numberOfNights) : invoiceData.numberOfNights;
      const pricePerNight = typeof invoiceData.pricePerNight === 'string' ? parseFloat((invoiceData.pricePerNight as string).replace(',', '.')) : invoiceData.pricePerNight;
      const taxAmount = typeof invoiceData.taxAmount === 'string' ? parseFloat((invoiceData.taxAmount as string).replace(',', '.')) : invoiceData.taxAmount;
      
      // Inclure la taxe seulement si la plateforme ne la collecte pas
      const totalAmount = (numberOfNights * pricePerNight) + (invoiceData.isPlatformCollectingTax ? 0 : taxAmount);

      console.log('Montant total calculé:', totalAmount);

      // Importer les services nécessaires
      const { generateInvoiceHTML } = require('../utils/pdfTemplate');
      const Print = require('expo-print');

      // Générer le PDF final avec le bon numéro de facture
      console.log('Génération du PDF final avec le numéro:', invoiceNumber);
      const html = await generateInvoiceHTML(invoiceData, invoiceNumber);
      const { uri: tempPdfUri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // Copier le PDF dans un dossier permanent
      const permanentDir = `${FileSystem.documentDirectory}invoices/`;
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

      // Créer l'objet facture
      const storedInvoice: StoredInvoice = {
        id,
        data: invoiceData,
        pdfUri: permanentPath,
        createdAt: new Date(),
        totalAmount,
        invoiceNumber
      };

      // Récupérer les factures existantes
      console.log('Récupération des factures existantes...');
      const invoices = await this.getInvoices();
      console.log('Nombre de factures existantes:', invoices.length);
      
      // Ajouter la nouvelle facture
      invoices.unshift(storedInvoice);
      console.log('Nouvelle facture ajoutée, total:', invoices.length);
      
      // Préparer les données pour la sauvegarde
      const dataToSave = invoices.map(inv => ({
        ...inv,
        data: {
          ...inv.data,
          invoiceDate: inv.data.invoiceDate instanceof Date ? inv.data.invoiceDate.toISOString() : inv.data.invoiceDate
        },
        createdAt: inv.createdAt instanceof Date ? inv.createdAt.toISOString() : inv.createdAt
      }));
      
      console.log('Données à sauvegarder:', JSON.stringify(dataToSave, null, 2));
      
      // Sauvegarder
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      
      // Mettre à jour le compteur de numéros de facture avec le numéro séquentiel
      const usedSequentialNumber = parseInt(sequentialNumber);
      await invoiceCounterService.saveLastInvoiceNumber(usedSequentialNumber);
      console.log('Compteur de factures mis à jour avec le numéro séquentiel:', usedSequentialNumber);

      return storedInvoice;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la facture:', error);
      throw error;
    }
  }

  static async getInvoices(): Promise<StoredInvoice[]> {
    try {
      const invoicesJson = await AsyncStorage.getItem(STORAGE_KEY);
      if (!invoicesJson) return [];
      
      const invoices = JSON.parse(invoicesJson);
      // Convertir les dates string en objets Date et recalculer totalAmount si nécessaire
      return invoices.map((inv: any) => {
        // Recalculer totalAmount si null
        let totalAmount = inv.totalAmount;
        if (totalAmount == null && inv.data) {
          const nights = inv.data.numberOfNights || 0;
          const price = inv.data.pricePerNight || 0;
          const tax = inv.data.taxAmount || 0;
          // Inclure la taxe seulement si la plateforme ne la collecte pas
          const isPlatformCollectingTax = inv.data.isPlatformCollectingTax || false;
          totalAmount = (nights * price) + (isPlatformCollectingTax ? 0 : tax);
        }
        
        return {
          ...inv,
          totalAmount,
          data: {
            ...inv.data,
            invoiceDate: new Date(inv.data.invoiceDate),
            // Gérer les dates optionnelles pour les anciennes factures
            arrivalDate: inv.data.arrivalDate ? new Date(inv.data.arrivalDate) : undefined,
            departureDate: inv.data.departureDate ? new Date(inv.data.departureDate) : undefined,
          },
          createdAt: new Date(inv.createdAt)
        };
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des factures:', error);
      return [];
    }
  }

  static async deleteInvoice(id: string): Promise<void> {
    try {
      const invoices = await this.getInvoices();
      const invoiceToDelete = invoices.find(inv => inv.id === id);
      
      if (invoiceToDelete) {
        // Supprimer le fichier PDF
        try {
          await FileSystem.deleteAsync(invoiceToDelete.pdfUri, { idempotent: true });
        } catch (error) {
          console.log('Erreur suppression PDF:', error);
        }
      }
      
      // Filtrer la facture
      const updatedInvoices = invoices.filter(inv => inv.id !== id);
      
      // Sauvegarder
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedInvoices));
    } catch (error) {
      console.error('Erreur lors de la suppression de la facture:', error);
      throw error;
    }
  }

  static async clearAll(): Promise<void> {
    try {
      // Supprimer tous les PDFs
      const invoices = await this.getInvoices();
      for (const invoice of invoices) {
        try {
          await FileSystem.deleteAsync(invoice.pdfUri, { idempotent: true });
        } catch (error) {
          console.log('Erreur suppression PDF:', error);
        }
      }
      
      // Vider le storage
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Erreur lors de la suppression des factures:', error);
    }
  }
}