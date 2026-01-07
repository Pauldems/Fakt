import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { LocalStorageService, StoredInvoice } from './localStorageService';
import hybridSettingsService from './hybridSettingsService';
import consentService, { GDPRConsent } from './consentService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OwnerSettings, PropertyTemplate } from '../features/settings/SettingsScreen';
import { Client } from '../types/common';

interface InvoiceCounterData {
  lastNumber: number;
  year: number;
}

interface ExportData {
  exportDate: string;
  appVersion: string;
  userData: {
    consent: GDPRConsent | null;
    settings: OwnerSettings | null;
    clients: Client[];
    invoices: StoredInvoice[];
    invoiceCounter: InvoiceCounterData | null;
  };
}

class DataExportService {
  /**
   * Exporte toutes les données de l'utilisateur au format JSON
   * Conformément au droit à la portabilité RGPD
   */
  async exportAllData(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📤 Début de l\'export des données...');

      // 1. Récupérer toutes les données
      const consent = await consentService.getConsent();
      const settings = await hybridSettingsService.getSettings();
      const invoices = await LocalStorageService.getInvoices();

      // Récupérer les clients depuis AsyncStorage
      let clients = [];
      try {
        const clientsJson = await AsyncStorage.getItem('clients');
        if (clientsJson) {
          clients = JSON.parse(clientsJson);
        }
      } catch (error) {
        console.log('Aucun client trouvé');
      }

      // Récupérer le compteur de factures
      let invoiceCounter = null;
      try {
        const counterJson = await AsyncStorage.getItem('@fakt_last_invoice_number');
        if (counterJson) {
          invoiceCounter = JSON.parse(counterJson);
        }
      } catch (error) {
        console.log('Aucun compteur trouvé');
      }

      // 2. Créer l'objet d'export
      const exportData: ExportData = {
        exportDate: new Date().toISOString(),
        appVersion: '1.0',
        userData: {
          consent: consent || null,
          settings: settings || null,
          clients: clients || [],
          invoices: invoices.map(inv => ({
            ...inv,
            // Convertir les dates en ISO pour la sérialization
            createdAt: inv.createdAt instanceof Date ? inv.createdAt.toISOString() : inv.createdAt,
            data: {
              ...inv.data,
              invoiceDate: inv.data.invoiceDate instanceof Date ? inv.data.invoiceDate.toISOString() : inv.data.invoiceDate,
              arrivalDate: inv.data.arrivalDate instanceof Date ? inv.data.arrivalDate.toISOString() : inv.data.arrivalDate,
              departureDate: inv.data.departureDate instanceof Date ? inv.data.departureDate.toISOString() : inv.data.departureDate,
            }
          })) || [],
          invoiceCounter: invoiceCounter || null,
        }
      };

      // 3. Générer le nom du fichier
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `fakt-export-${timestamp}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      // 4. Écrire le fichier
      await FileSystem.writeAsStringAsync(
        filePath,
        JSON.stringify(exportData, null, 2),
        { encoding: FileSystem.EncodingType.UTF8 }
      );

      console.log('✅ Fichier créé:', filePath);

      // 5. Vérifier si le partage est disponible
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        return {
          success: false,
          message: 'Le partage n\'est pas disponible sur cet appareil'
        };
      }

      // 6. Partager le fichier
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Exporter vos données Fakt',
        UTI: 'public.json'
      });

      console.log('✅ Export terminé avec succès');

      return {
        success: true,
        message: 'Vos données ont été exportées avec succès'
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'export:', error);
      return {
        success: false,
        message: `Erreur lors de l'export: ${error}`
      };
    }
  }

  /**
   * Exporte toutes les données de l'utilisateur au format PDF
   * Format lisible pour consultation
   */
  async exportAllDataAsPDF(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📤 Début de l\'export PDF des données...');

      // 1. Récupérer toutes les données
      const consent = await consentService.getConsent();
      const settings = await hybridSettingsService.getSettings();
      const invoices = await LocalStorageService.getInvoices();

      // Récupérer les clients
      let clients = [];
      try {
        const clientsJson = await AsyncStorage.getItem('clients');
        if (clientsJson) {
          clients = JSON.parse(clientsJson);
        }
      } catch (error) {
        console.log('Aucun client trouvé');
      }

      // 2. Générer le HTML pour le PDF
      const html = this.generateExportHTML(settings, clients, invoices, consent);

      // 3. Générer le PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });

      console.log('✅ PDF créé:', uri);

      // 4. Renommer le fichier avec un nom plus explicite
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `fakt-export-${timestamp}.pdf`;
      const newPath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.moveAsync({
        from: uri,
        to: newPath
      });

      // 5. Partager le fichier
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        return {
          success: false,
          message: 'Le partage n\'est pas disponible sur cet appareil'
        };
      }

      await Sharing.shareAsync(newPath, {
        mimeType: 'application/pdf',
        dialogTitle: 'Exporter vos données Fakt (PDF)',
        UTI: 'com.adobe.pdf'
      });

      console.log('✅ Export PDF terminé avec succès');

      return {
        success: true,
        message: 'Vos données ont été exportées en PDF avec succès'
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'export PDF:', error);
      return {
        success: false,
        message: `Erreur lors de l'export PDF: ${error}`
      };
    }
  }

  /**
   * Génère le HTML pour l'export PDF
   */
  private generateExportHTML(
    settings: OwnerSettings | null,
    clients: Client[],
    invoices: StoredInvoice[],
    consent: GDPRConsent | null
  ): string {
    const exportDate = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      padding: 40px;
      color: #333;
      line-height: 1.6;
    }
    h1 {
      color: #003580;
      border-bottom: 3px solid #003580;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 {
      color: #0056b3;
      margin-top: 40px;
      margin-bottom: 20px;
      border-left: 4px solid #0056b3;
      padding-left: 15px;
    }
    h3 {
      color: #1976D2;
      margin-top: 25px;
      margin-bottom: 15px;
    }
    .section {
      margin-bottom: 40px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .info-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .info-label {
      font-weight: 600;
      color: #003580;
      width: 200px;
      flex-shrink: 0;
    }
    .info-value {
      color: #333;
      flex: 1;
    }
    .invoice-item {
      margin-bottom: 30px;
      padding: 20px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      page-break-inside: avoid;
    }
    .client-item {
      margin-bottom: 20px;
      padding: 15px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: #e3f2fd;
      color: #1976D2;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    th {
      background: #f0f0f0;
      font-weight: 600;
      color: #003580;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Export de vos données Fakt</h1>
    <p style="color: #666; margin-top: 10px;">Exporté le ${exportDate}</p>
  </div>

  <!-- Informations utilisateur -->
  <div class="section">
    <h2>👤 Vos informations</h2>
    <div class="info-row">
      <div class="info-label">Prénom</div>
      <div class="info-value">${settings?.ownerFirstName || 'Non renseigné'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Nom</div>
      <div class="info-value">${settings?.ownerLastName || 'Non renseigné'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Email</div>
      <div class="info-value">${settings?.email || 'Non renseigné'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Téléphone</div>
      <div class="info-value">${settings?.phoneNumber || 'Non renseigné'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Devise</div>
      <div class="info-value">${settings?.currency || 'EUR'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Assujetti à la TVA</div>
      <div class="info-value">${settings?.vatSettings?.isSubjectToVAT ? 'Oui' : 'Non'}${settings?.vatSettings?.isSubjectToVAT ? ` (${settings.vatSettings.vatRate}%)` : ''}</div>
    </div>
  </div>

  <!-- Propriétés -->
  <div class="section">
    <h2>🏠 Vos propriétés</h2>
    ${settings?.propertyTemplates?.length > 0
      ? settings.propertyTemplates.map((prop: PropertyTemplate) => `
        <div class="client-item">
          <h3>${prop.name || 'Propriété sans nom'}</h3>
          ${prop.properties?.map((p: { label: string; value: string }) => `
            <div class="info-row">
              <div class="info-label">${p.label}</div>
              <div class="info-value">${p.value || 'Non renseigné'}</div>
            </div>
          `).join('')}
        </div>
      `).join('')
      : '<p style="color: #666;">Aucune propriété enregistrée</p>'
    }
  </div>

  <!-- Clients -->
  <div class="section">
    <h2>👥 Vos clients (${clients.length})</h2>
    ${clients.length > 0
      ? clients.map((client: Client) => `
        <div class="client-item">
          <h3>${client.firstName} ${client.lastName}</h3>
          <div class="info-row">
            <div class="info-label">Email</div>
            <div class="info-value">${client.email || 'Non renseigné'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Téléphone</div>
            <div class="info-value">${client.phone || 'Non renseigné'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Adresse</div>
            <div class="info-value">${client.address || 'Non renseigné'}</div>
          </div>
        </div>
      `).join('')
      : '<p style="color: #666;">Aucun client enregistré</p>'
    }
  </div>

  <!-- Factures -->
  <div class="section">
    <h2>🧾 Vos factures (${invoices.length})</h2>
    ${invoices.length > 0
      ? invoices.map((invoice: StoredInvoice) => {
          const inv = invoice.data;
          const arrivalDate = new Date(inv.arrivalDate).toLocaleDateString('fr-FR');
          const departureDate = new Date(inv.departureDate).toLocaleDateString('fr-FR');
          const invoiceDate = new Date(inv.invoiceDate).toLocaleDateString('fr-FR');

          return `
        <div class="invoice-item">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0;">Facture ${inv.invoiceNumber}</h3>
            <span class="badge">${invoiceDate}</span>
          </div>

          <div class="info-row">
            <div class="info-label">Client</div>
            <div class="info-value">${inv.clientName}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Séjour</div>
            <div class="info-value">Du ${arrivalDate} au ${departureDate}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Propriété</div>
            <div class="info-value">${inv.propertyName || 'Non renseignée'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Montant HT</div>
            <div class="info-value">${inv.subtotal} ${inv.currency || '€'}</div>
          </div>
          ${inv.vatAmount > 0 ? `
          <div class="info-row">
            <div class="info-label">TVA</div>
            <div class="info-value">${inv.vatAmount} ${inv.currency || '€'}</div>
          </div>
          ` : ''}
          <div class="info-row">
            <div class="info-label"><strong>Total TTC</strong></div>
            <div class="info-value"><strong>${inv.total} ${inv.currency || '€'}</strong></div>
          </div>
        </div>
      `}).join('')
      : '<p style="color: #666;">Aucune facture enregistrée</p>'
    }
  </div>

  <!-- Consentement RGPD -->
  <div class="section">
    <h2>🔒 Consentement RGPD</h2>
    <div class="info-row">
      <div class="info-label">Statut</div>
      <div class="info-value">${consent ? '✅ Consentement donné' : '❌ Aucun consentement'}</div>
    </div>
    ${consent ? `
    <div class="info-row">
      <div class="info-label">Date</div>
      <div class="info-value">${new Date(consent.consentDate).toLocaleDateString('fr-FR')}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Version</div>
      <div class="info-value">${consent.policyVersion || 'N/A'}</div>
    </div>
    ` : ''}
  </div>

  <div class="footer">
    <p>Document généré par Fakt - Application de facturation</p>
    <p>Export conforme RGPD - Droit à la portabilité des données</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Obtient un résumé des données à exporter (pour affichage avant export)
   */
  async getDataSummary(): Promise<{
    invoicesCount: number;
    clientsCount: number;
    hasConsent: boolean;
    hasSettings: boolean;
  }> {
    try {
      const consent = await consentService.getConsent();
      const settings = await hybridSettingsService.getSettings();
      const invoices = await LocalStorageService.getInvoices();

      let clientsCount = 0;
      try {
        const clientsJson = await AsyncStorage.getItem('clients');
        if (clientsJson) {
          const clients = JSON.parse(clientsJson);
          clientsCount = clients.length;
        }
      } catch (error) {
        console.log('Aucun client trouvé');
      }

      return {
        invoicesCount: invoices.length,
        clientsCount,
        hasConsent: consent !== null,
        hasSettings: settings !== null,
      };
    } catch (error) {
      console.error('❌ Erreur récupération résumé:', error);
      return {
        invoicesCount: 0,
        clientsCount: 0,
        hasConsent: false,
        hasSettings: false,
      };
    }
  }
}

export default new DataExportService();
