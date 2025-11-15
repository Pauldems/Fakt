import { InvoiceData } from '../../types/invoice';
import { OwnerSettings } from '../../features/settings/SettingsScreen';
import { getInvoiceTranslation } from '../invoiceTranslations';
import { translateExtras } from '../extrasTranslator';

export const generateClassicTemplate = (
  data: InvoiceData,
  invoiceNumber: string,
  settings: OwnerSettings,
  selectedPropertyTemplate: any,
  language: 'fr' | 'en' | 'es' | 'de' | 'it' = 'fr'
): string => {
  const translations = getInvoiceTranslation(language);
  const translatedData = { ...data, extras: data.extras ? translateExtras(data.extras, language) : undefined };
  
  const numberOfNights = typeof translatedData.numberOfNights === 'string' ? parseInt(translatedData.numberOfNights) : translatedData.numberOfNights;
  const pricePerNight = typeof translatedData.pricePerNight === 'string' ? parseFloat((translatedData.pricePerNight as string).replace(',', '.')) : translatedData.pricePerNight;
  const taxAmount = typeof translatedData.taxAmount === 'string' ? parseFloat((translatedData.taxAmount as string).replace(',', '.')) : translatedData.taxAmount;
  
  const totalNights = numberOfNights * pricePerNight;
  const totalExtras = translatedData.extras ? translatedData.extras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0) : 0;
  const finalTaxAmount = translatedData.isPlatformCollectingTax ? 0 : taxAmount;

  // Calculs TVA
  const isVATSubject = settings.vatSettings?.isSubjectToVAT || false;
  const vatRate = settings.vatSettings?.useCustomRate
    ? (settings.vatSettings?.customRate || 0)
    : (settings.vatSettings?.vatRate || 0);

  let subtotalHT = 0;
  let vatAmount = 0;
  let totalTTC = 0;

  if (isVATSubject) {
    // L'utilisateur entre le prix TTC (location + extras), on calcule le HT et la TVA
    // La taxe de séjour n'est pas soumise à TVA
    const subtotalTTC = totalNights + totalExtras;
    subtotalHT = subtotalTTC / (1 + vatRate / 100);
    vatAmount = subtotalTTC - subtotalHT;
    totalTTC = subtotalTTC + finalTaxAmount;
  } else {
    // Pas de TVA, le total reste le même
    subtotalHT = totalNights + totalExtras + finalTaxAmount;
    vatAmount = 0;
    totalTTC = subtotalHT;
  }

  const totalWithTax = totalTTC;
  
  const locale = language === 'en' ? 'en-US' : 
                language === 'es' ? 'es-ES' :
                language === 'de' ? 'de-DE' :
                language === 'it' ? 'it-IT' : 'fr-FR';
  
  const formattedDate = new Date(translatedData.invoiceDate).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const arrivalDate = translatedData.arrivalDate ? new Date(translatedData.arrivalDate).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) : '';
  
  const departureDate = translatedData.departureDate ? new Date(translatedData.departureDate).toLocaleDateString(locale, {
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
        
        /* Header avec logo */
        .header-with-logo {
          display: table;
          width: 100%;
          margin-bottom: 40px;
          border-bottom: 3px double #000;
          padding-bottom: 20px;
        }
        .logo-section {
          display: table-cell;
          width: 30%;
          vertical-align: middle;
          text-align: left;
        }
        .company-section {
          display: table-cell;
          width: 70%;
          vertical-align: middle;
          text-align: center;
        }
        .logo-image {
          max-width: 120px;
          max-height: 60px;
          width: auto;
          height: auto;
          object-fit: contain;
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
        ${settings.useLogo && settings.logoImage ? `
        <div class="header-with-logo">
          <div class="logo-section">
            <img src="${settings.logoImage}" alt="Logo" class="logo-image" />
          </div>
          <div class="company-section">
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
        </div>
        ` : `
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
        `}
        
        <!-- Titre FACTURE -->
        <div class="invoice-title">FACTURE</div>
        
        <!-- Informations -->
        <div class="info-section">
          <div class="info-left">
            <div class="info-block">
              <div class="info-label">${translations.billedTo}</div>
              <div class="info-content">
                ${translatedData.firstName} ${translatedData.lastName}<br>
                ${translatedData.email}
                ${translatedData.hasClientAddress ? `<br>${translatedData.clientAddress}<br>${translatedData.clientPostalCode} ${translatedData.clientCity}` : ''}
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
                ${translatedData.specialRateType ? `<br><small>✓ ${translatedData.specialRateType}</small>` : ''}
              </td>
              <td class="text-center">${numberOfNights}</td>
              <td class="text-right">${pricePerNight.toFixed(2)} €</td>
              <td class="text-right">${totalNights.toFixed(2)} €</td>
            </tr>
            ${translatedData.extras && translatedData.extras.length > 0 ? translatedData.extras.map(extra => `
              <tr>
                <td>${extra.name}</td>
                <td class="text-center">${extra.quantity}</td>
                <td class="text-right">${extra.price.toFixed(2)} €</td>
                <td class="text-right">${(extra.price * extra.quantity).toFixed(2)} €</td>
              </tr>
            `).join('') : ''}
            ${taxAmount > 0 ? `
              <tr>
                <td class="${translatedData.isPlatformCollectingTax ? 'strikethrough' : ''}">
                  ${translations.stayTax}
                  ${translatedData.isPlatformCollectingTax ? `<br><small>${translations.collectedByPlatform}</small>` : ''}
                </td>
                <td class="text-center ${translatedData.isPlatformCollectingTax ? 'strikethrough' : ''}">1</td>
                <td class="text-right ${translatedData.isPlatformCollectingTax ? 'strikethrough' : ''}">${taxAmount.toFixed(2)} €</td>
                <td class="text-right ${translatedData.isPlatformCollectingTax ? 'strikethrough' : ''}">${taxAmount.toFixed(2)} €</td>
              </tr>
            ` : ''}
          </tbody>
        </table>
        
        <!-- Totaux -->
        <div class="totals-section">
          ${isVATSubject ? `
            <div class="total-row">
              <span class="total-label">Sous-total HT:</span>
              <span class="total-value">${subtotalHT.toFixed(2)} €</span>
            </div>
            <div class="total-row">
              <span class="total-label">TVA (${vatRate.toFixed(vatRate % 1 === 0 ? 0 : 1)}%):</span>
              <span class="total-value">${vatAmount.toFixed(2)} €</span>
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
          ` : `
            <div class="total-row">
              <span class="total-label">Sous-total:</span>
              <span class="total-value">${(totalNights + totalExtras).toFixed(2)} €</span>
            </div>
            ${finalTaxAmount > 0 ? `
              <div class="total-row">
                <span class="total-label">Taxe de séjour:</span>
                <span class="total-value">${finalTaxAmount.toFixed(2)} €</span>
              </div>
            ` : ''}
            <div class="total-row grand-total">
              <span class="total-label">TOTAL:</span>
              <span class="total-value">${totalWithTax.toFixed(2)} €</span>
            </div>
          `}
        </div>
        
        <!-- Identifiants -->
        <div class="identifiers">
          ${translations.establishmentId}: ${selectedPropertyTemplate ? selectedPropertyTemplate.properties.find(p => p.label === 'Identifiant établissement')?.value || settings.establishmentId : settings.establishmentId}
          | ${translations.legalEntity}: ${selectedPropertyTemplate ? selectedPropertyTemplate.properties.find(p => p.label === 'Entité juridique')?.value || settings.legalEntityId : settings.legalEntityId}
        </div>
        
        ${translatedData.isClientInvoice ? `
        <!-- Pied de page -->
        <div class="footer">
          ${translations.clientInvoice} ${translatedData.clientInvoiceNumber}
        </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
};