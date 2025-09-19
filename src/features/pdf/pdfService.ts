import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { InvoiceData } from '../../types/invoice';
import { generateInvoiceHTML } from '../../utils/pdfTemplate';

export class PDFService {
  static async generatePDF(invoiceData: InvoiceData): Promise<string> {
    try {
      console.log('PDFService.generatePDF - Début');
      console.log('invoiceData reçu:', JSON.stringify(invoiceData, null, 2));
      
      // Générer le numéro de facture temporaire pour l'aperçu
      const tempInvoiceNumber = 'TEMP-' + Date.now();
      const html = await generateInvoiceHTML(invoiceData, tempInvoiceNumber);
      console.log('HTML généré (premiers 200 caractères):', html.substring(0, 200));
      
      // Générer le PDF
      console.log('Génération du PDF avec expo-print...');
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });
      console.log('PDF généré à:', uri);

      // Créer un nom de fichier unique
      const fileName = `facture_${invoiceData.lastName}_${Date.now()}.pdf`;
      const newUri = `${FileSystem.documentDirectory}${fileName}`;
      console.log('Nouveau nom de fichier:', newUri);

      // Copier le fichier avec le nouveau nom
      await FileSystem.copyAsync({
        from: uri,
        to: newUri,
      });
      console.log('Fichier copié avec succès');

      // Supprimer le fichier temporaire
      await FileSystem.deleteAsync(uri, { idempotent: true });

      return newUri;
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      throw new Error('Impossible de générer le PDF');
    }
  }

  static async sharePDF(pdfUri: string): Promise<void> {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri);
      } else {
        throw new Error('Le partage n\'est pas disponible sur cet appareil');
      }
    } catch (error) {
      console.error('Erreur lors du partage du PDF:', error);
      throw error;
    }
  }
}