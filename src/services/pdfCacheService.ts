/**
 * Service de cache pour les PDFs de factures
 * Gère la régénération et le stockage permanent des PDFs manquants
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { generateInvoiceHTML } from '../utils/pdfTemplate';
import { InvoiceData } from '../types/invoice';
import { StoredInvoice } from './localStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PDF_CACHE_DIR = `${FileSystem.documentDirectory}invoices/`;
const INVOICES_STORAGE_KEY = 'invoices';

interface PDFCacheResult {
  pdfUri: string;
  wasRegenerated: boolean;
}

class PDFCacheService {
  private regenerationInProgress: Map<string, Promise<string>> = new Map();

  /**
   * Initialise le répertoire de cache PDF
   */
  async init(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(PDF_CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(PDF_CACHE_DIR, { intermediates: true });
        console.log('[PDFCache] Répertoire de cache créé:', PDF_CACHE_DIR);
      }
    } catch (error) {
      console.error('[PDFCache] Erreur initialisation:', error);
    }
  }

  /**
   * Obtient le PDF d'une facture, en le régénérant si nécessaire
   * Met à jour automatiquement le stockage si le PDF est régénéré
   */
  async getPDF(invoice: StoredInvoice): Promise<PDFCacheResult> {
    // Vérifier si le PDF existe déjà
    if (invoice.pdfUri) {
      const fileInfo = await FileSystem.getInfoAsync(invoice.pdfUri);
      if (fileInfo.exists && !fileInfo.isDirectory && fileInfo.size > 0) {
        return { pdfUri: invoice.pdfUri, wasRegenerated: false };
      }
    }

    // Le PDF n'existe pas ou est invalide, le régénérer
    console.log('[PDFCache] PDF manquant pour facture:', invoice.invoiceNumber);

    // Éviter les régénérations multiples en parallèle pour la même facture
    const existingRegeneration = this.regenerationInProgress.get(invoice.id);
    if (existingRegeneration) {
      const pdfUri = await existingRegeneration;
      return { pdfUri, wasRegenerated: true };
    }

    // Démarrer la régénération
    const regenerationPromise = this.regeneratePDF(invoice);
    this.regenerationInProgress.set(invoice.id, regenerationPromise);

    try {
      const newPdfUri = await regenerationPromise;

      // Mettre à jour le stockage avec le nouveau chemin
      await this.updateStoredInvoicePdfUri(invoice.id, newPdfUri);

      return { pdfUri: newPdfUri, wasRegenerated: true };
    } finally {
      this.regenerationInProgress.delete(invoice.id);
    }
  }

  /**
   * Régénère le PDF d'une facture et le sauvegarde de façon permanente
   */
  private async regeneratePDF(invoice: StoredInvoice): Promise<string> {
    console.log('[PDFCache] Régénération du PDF pour:', invoice.invoiceNumber);

    // Générer le HTML
    const html = await generateInvoiceHTML(invoice.data, invoice.invoiceNumber);

    // Générer le PDF temporaire
    const { uri: tempPdfUri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Créer le nom de fichier permanent
    const safeFileName = this.generateSafeFileName(invoice);
    const permanentPath = `${PDF_CACHE_DIR}${safeFileName}`;

    // Copier vers l'emplacement permanent
    await FileSystem.copyAsync({
      from: tempPdfUri,
      to: permanentPath,
    });

    // Supprimer le fichier temporaire
    await FileSystem.deleteAsync(tempPdfUri, { idempotent: true });

    console.log('[PDFCache] PDF régénéré et sauvegardé:', permanentPath);
    return permanentPath;
  }

  /**
   * Génère un nom de fichier sûr pour le PDF
   */
  private generateSafeFileName(invoice: StoredInvoice): string {
    const invoiceNumber = invoice.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '_');
    const lastName = invoice.data.lastName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    const firstName = invoice.data.firstName.replace(/[^a-zA-Z0-9]/g, '_');
    return `${invoiceNumber}_${firstName}_${lastName}.pdf`;
  }

  /**
   * Met à jour le chemin du PDF dans le stockage
   */
  private async updateStoredInvoicePdfUri(invoiceId: string, newPdfUri: string): Promise<void> {
    try {
      const invoicesJson = await AsyncStorage.getItem(INVOICES_STORAGE_KEY);
      if (!invoicesJson) return;

      const invoices = JSON.parse(invoicesJson) as Array<Record<string, unknown>>;
      const invoiceIndex = invoices.findIndex(inv => inv.id === invoiceId);

      if (invoiceIndex !== -1) {
        invoices[invoiceIndex].pdfUri = newPdfUri;
        await AsyncStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
        console.log('[PDFCache] Stockage mis à jour avec nouveau chemin PDF');
      }
    } catch (error) {
      console.error('[PDFCache] Erreur mise à jour stockage:', error);
    }
  }

  /**
   * Vérifie et répare les PDFs manquants pour toutes les factures
   * Utile pour la maintenance au démarrage de l'app
   */
  async validateAllPDFs(invoices: StoredInvoice[]): Promise<{
    valid: number;
    missing: number;
    repaired: number;
  }> {
    let valid = 0;
    let missing = 0;
    let repaired = 0;

    for (const invoice of invoices) {
      if (invoice.pdfUri) {
        const fileInfo = await FileSystem.getInfoAsync(invoice.pdfUri);
        if (fileInfo.exists && !fileInfo.isDirectory && fileInfo.size > 0) {
          valid++;
          continue;
        }
      }

      missing++;

      // Essayer de réparer
      try {
        await this.getPDF(invoice);
        repaired++;
      } catch (error) {
        console.error('[PDFCache] Impossible de réparer PDF pour:', invoice.invoiceNumber);
      }
    }

    console.log(`[PDFCache] Validation: ${valid} valides, ${missing} manquants, ${repaired} réparés`);
    return { valid, missing, repaired };
  }

  /**
   * Nettoie les PDFs orphelins (qui ne correspondent à aucune facture)
   */
  async cleanupOrphanedPDFs(invoices: StoredInvoice[]): Promise<number> {
    try {
      const files = await FileSystem.readDirectoryAsync(PDF_CACHE_DIR);
      const validUris = new Set(invoices.map(inv => inv.pdfUri).filter(Boolean));

      let deletedCount = 0;

      for (const file of files) {
        const filePath = `${PDF_CACHE_DIR}${file}`;
        if (!validUris.has(filePath)) {
          await FileSystem.deleteAsync(filePath, { idempotent: true });
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`[PDFCache] ${deletedCount} fichiers orphelins supprimés`);
      }

      return deletedCount;
    } catch (error) {
      console.error('[PDFCache] Erreur nettoyage:', error);
      return 0;
    }
  }

  /**
   * Force la régénération d'un PDF (utile après modification des paramètres)
   */
  async forceRegenerate(invoice: StoredInvoice): Promise<string> {
    // Supprimer l'ancien PDF s'il existe
    if (invoice.pdfUri) {
      await FileSystem.deleteAsync(invoice.pdfUri, { idempotent: true });
    }

    // Régénérer
    const newPdfUri = await this.regeneratePDF(invoice);
    await this.updateStoredInvoicePdfUri(invoice.id, newPdfUri);

    return newPdfUri;
  }
}

export const pdfCacheService = new PDFCacheService();
export default pdfCacheService;
