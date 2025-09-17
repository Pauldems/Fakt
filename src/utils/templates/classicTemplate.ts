import { InvoiceData } from '../../types/invoice';
import { OwnerSettings } from '../../features/settings/SettingsScreen';
import { getInvoiceTranslation } from '../invoiceTranslations';

export const generateClassicTemplate = (
  data: InvoiceData,
  invoiceNumber: string,
  settings: OwnerSettings,
  selectedPropertyTemplate: any,
  language: 'fr' | 'en' | 'es' | 'de' | 'it' = 'fr'
): string => {
  const translations = getInvoiceTranslation(language);
  
  const numberOfNights = typeof data.numberOfNights === 'string' ? parseInt(data.numberOfNights) : data.numberOfNights;
  const pricePerNight = typeof data.pricePerNight === 'string' ? parseFloat((data.pricePerNight as string).replace(',', '.')) : data.pricePerNight;
  const taxAmount = typeof data.taxAmount === 'string' ? parseFloat((data.taxAmount as string).replace(',', '.')) : data.taxAmount;
  
  const totalNights = numberOfNights * pricePerNight;
  const finalTaxAmount = data.isPlatformCollectingTax ? 0 : taxAmount;
  const totalWithTax = totalNights + finalTaxAmount;
  
  const locale = language === 'en' ? 'en-US' : 
                language === 'es' ? 'es-ES' :
                language === 'de' ? 'de-DE' :
                language === 'it' ? 'it-IT' : 'fr-FR';
  
  const formattedDate = new Date(data.invoiceDate).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const arrivalDate = data.arrivalDate ? new Date(data.arrivalDate).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) : '';
  
  const departureDate = data.departureDate ? new Date(data.departureDate).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          color: #000;
          font-size: 12pt;
          padding: 20px;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        
        /* En-tête classique */
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 3px double #000;
          padding-bottom: 20px;
        }
        .company-name {
          font-size: 24pt;
          font-weight: bold;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .company-details {
          font-size: 10pt;
          line-height: 1.5;
          margin-top: 10px;
        }
        
        /* Titre FACTURE */
        .invoice-title {
          text-align: center;
          font-size: 20pt;
          font-weight: bold;
          margin: 30px 0;
          letter-spacing: 3px;
        }
        
        /* Informations facture et client */
        .info-section {
          margin-bottom: 40px;
          display: table;
          width: 100%;
        }
        .info-left, .info-right {
          display: table-cell;
          width: 50%;
          vertical-align: top;
        }
        .info-right {
          text-align: right;
        }
        .info-block {
          margin-bottom: 20px;
        }
        .info-label {
          font-weight: bold;
          margin-bottom: 5px;
          font-size: 11pt;
          text-transform: uppercase;
        }
        .info-content {
          font-size: 11pt;
          line-height: 1.4;
        }
        
        /* Tableau classique */
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
        }
        table th {
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          padding: 10px;
          text-align: left;
          font-size: 11pt;
          font-weight: bold;
          text-transform: uppercase;
        }
        table td {
          border-bottom: 1px solid #ccc;
          padding: 12px 10px;
          font-size: 11pt;
        }
        table tr:last-child td {
          border-bottom: 2px solid #000;
        }
        .text-center {
          text-align: center;
        }
        .text-right {
          text-align: right;
        }
        
        /* Totaux */
        .totals-section {
          margin-top: 30px;
          text-align: right;
        }
        .total-row {
          margin: 8px 0;
          font-size: 11pt;
        }
        .total-label {
          display: inline-block;
          width: 200px;
          text-align: right;
          margin-right: 20px;
        }
        .total-value {
          display: inline-block;
          width: 120px;
          text-align: right;
        }
        .grand-total {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 2px solid #000;
          font-size: 14pt;
          font-weight: bold;
        }
        
        /* Pied de page */
        .footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #000;
          text-align: center;
          font-size: 9pt;
          color: #666;
        }
        
        .strikethrough {
          text-decoration: line-through;
          opacity: 0.6;
        }
        
        /* Identifiants */
        .identifiers {
          margin-top: 20px;
          font-size: 10pt;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- En-tête -->
        <div class="header">
          <div class="company-name">
            ${settings.ownerFirstName} ${settings.ownerLastName}
          </div>
          <div class="company-details">
            ${selectedPropertyTemplate ? selectedPropertyTemplate.name || settings.companyName : settings.companyName}<br>
            ${selectedPropertyTemplate ? selectedPropertyTemplate.properties.find(p => p.label === 'Adresse')?.value || settings.companyAddress : settings.companyAddress}<br>
            ${selectedPropertyTemplate ? `${selectedPropertyTemplate.properties.find(p => p.label === 'Code postal')?.value || settings.companyPostalCode} ${selectedPropertyTemplate.properties.find(p => p.label === 'Ville')?.value || settings.companyCity}` : `${settings.companyPostalCode} ${settings.companyCity}`}<br>
            Tél: ${settings.phoneNumber} - Email: ${settings.email}
          </div>
        </div>
        
        <!-- Titre FACTURE -->
        <div class="invoice-title">FACTURE</div>
        
        <!-- Informations -->
        <div class="info-section">
          <div class="info-left">
            <div class="info-block">
              <div class="info-label">${translations.billedTo}</div>
              <div class="info-content">
                ${data.firstName} ${data.lastName}<br>
                ${data.email}
                ${data.hasClientAddress ? `<br>${data.clientAddress}<br>${data.clientPostalCode} ${data.clientCity}` : ''}
              </div>
            </div>
          </div>
          <div class="info-right">
            <div class="info-block">
              <div class="info-content">
                <strong>Facture N°:</strong> ${invoiceNumber}<br>
                <strong>Date:</strong> ${formattedDate}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Tableau -->
        <table>
          <thead>
            <tr>
              <th style="width: 50%">${translations.description}</th>
              <th class="text-center" style="width: 15%">${translations.quantity}</th>
              <th class="text-right" style="width: 17.5%">${translations.unitPrice}</th>
              <th class="text-right" style="width: 17.5%">MONTANT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                ${translations.accommodation}<br>
                Du ${arrivalDate} au ${departureDate}
                ${data.isGeniusRate ? `<br><small>✓ ${translations.geniusRate}</small>` : ''}
                ${data.isBookingReservation ? `<br><small>${translations.bookingReservation} ${data.bookingNumber || ''}</small>` : ''}
              </td>
              <td class="text-center">${numberOfNights}</td>
              <td class="text-right">${pricePerNight.toFixed(2)} €</td>
              <td class="text-right">${totalNights.toFixed(2)} €</td>
            </tr>
            ${taxAmount > 0 ? `
              <tr>
                <td class="${data.isPlatformCollectingTax ? 'strikethrough' : ''}">
                  ${translations.stayTax}
                  ${data.isPlatformCollectingTax ? `<br><small>${translations.collectedByPlatform}</small>` : ''}
                </td>
                <td class="text-center ${data.isPlatformCollectingTax ? 'strikethrough' : ''}">1</td>
                <td class="text-right ${data.isPlatformCollectingTax ? 'strikethrough' : ''}">${taxAmount.toFixed(2)} €</td>
                <td class="text-right ${data.isPlatformCollectingTax ? 'strikethrough' : ''}">${taxAmount.toFixed(2)} €</td>
              </tr>
            ` : ''}
          </tbody>
        </table>
        
        <!-- Totaux -->
        <div class="totals-section">
          <div class="total-row">
            <span class="total-label">Sous-total HT:</span>
            <span class="total-value">${totalNights.toFixed(2)} €</span>
          </div>
          ${finalTaxAmount > 0 ? `
            <div class="total-row">
              <span class="total-label">Taxe de séjour:</span>
              <span class="total-value">${finalTaxAmount.toFixed(2)} €</span>
            </div>
          ` : ''}
          <div class="total-row grand-total">
            <span class="total-label">TOTAL TTC:</span>
            <span class="total-value">${totalWithTax.toFixed(2)} €</span>
          </div>
        </div>
        
        <!-- Identifiants -->
        <div class="identifiers">
          ${translations.establishmentId}: ${selectedPropertyTemplate ? selectedPropertyTemplate.properties.find(p => p.label === 'Identifiant établissement')?.value || settings.establishmentId : settings.establishmentId}
          | ${translations.legalEntity}: ${selectedPropertyTemplate ? selectedPropertyTemplate.properties.find(p => p.label === 'Entité juridique')?.value || settings.legalEntityId : settings.legalEntityId}
        </div>
        
        ${data.isClientInvoice ? `
        <!-- Pied de page -->
        <div class="footer">
          ${translations.clientInvoice} ${data.clientInvoiceNumber}
        </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
};