import { InvoiceData } from '../../types/invoice';
import { OwnerSettings } from '../../features/settings/SettingsScreen';
import { getInvoiceTranslation } from '../invoiceTranslations';
import { translateExtras } from '../extrasTranslator';
import { formatPrice, getCurrencySymbol } from '../currencyFormatter';

export const generateModernTemplate = (
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
    // L'utilisateur entre le prix TTC, on calcule le HT
    const totalBeforeVAT = totalNights + totalExtras;
    totalTTC = totalBeforeVAT + finalTaxAmount;
    subtotalHT = totalTTC / (1 + vatRate / 100);
    vatAmount = totalTTC - subtotalHT;
  } else {
    // Pas de TVA, le total reste le même
    subtotalHT = totalNights + totalExtras + finalTaxAmount;
    vatAmount = 0;
    totalTTC = subtotalHT;
  }
  
  const totalWithTax = totalTTC;
  
  // Obtenir la devise pour le formatage
  const currencyCode = settings.currency || 'EUR';
  
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
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1a1a1a;
          font-size: 14px;
          padding: 20px;
          background: #f8f9fa;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          overflow: hidden;
        }
        
        /* Header moderne avec gradient */
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          position: relative;
        }
        .header::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
        }
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-title {
          font-size: 32px;
          font-weight: 300;
          letter-spacing: -1px;
        }
        .invoice-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          backdrop-filter: blur(10px);
        }
        
        /* Info entreprise moderne */
        .company-section {
          padding: 30px;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }
        .company-grid {
          display: flex;
          gap: 40px;
        }
        .company-block {
          flex: 1;
        }
        .company-label {
          font-size: 11px;
          text-transform: uppercase;
          color: #6c757d;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }
        .company-value {
          font-size: 14px;
          color: #1a1a1a;
          line-height: 1.6;
        }
        
        /* Section client moderne */
        .invoice-details {
          padding: 30px;
          display: flex;
          justify-content: space-between;
          gap: 40px;
        }
        .detail-block {
          flex: 1;
        }
        .detail-title {
          font-size: 12px;
          text-transform: uppercase;
          color: #6c757d;
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }
        .detail-content {
          font-size: 14px;
          line-height: 1.8;
          color: #1a1a1a;
        }
        .invoice-number {
          font-size: 18px;
          font-weight: 600;
          color: #667eea;
        }
        
        /* Tableau moderne */
        .table-container {
          padding: 0 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        table th {
          text-align: left;
          padding: 12px 0;
          font-size: 11px;
          text-transform: uppercase;
          color: #6c757d;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e9ecef;
        }
        table td {
          padding: 20px 0;
          font-size: 14px;
          border-bottom: 1px solid #f4f5f6;
          color: #1a1a1a;
        }
        table th:last-child,
        table td:last-child {
          text-align: right;
        }
        .qty-cell {
          text-align: center !important;
          width: 80px;
        }
        .price-cell {
          text-align: right;
          width: 120px;
        }
        .description-cell {
          font-weight: 500;
        }
        
        /* Total moderne */
        .total-section {
          padding: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin-top: 30px;
        }
        .total-content {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 30px;
          color: white;
        }
        .total-label {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          opacity: 0.9;
        }
        .total-amount {
          font-size: 32px;
          font-weight: 300;
          letter-spacing: -1px;
        }
        
        /* VAT Breakdown pour template moderne */
        .total-breakdown {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin: 0 30px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .total-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f4f5f6;
        }
        .total-line:last-child {
          border-bottom: none;
        }
        .total-line.total-final {
          border-top: 2px solid #667eea;
          margin-top: 10px;
          padding-top: 15px;
          background: rgba(102, 126, 234, 0.05);
          margin-left: -20px;
          margin-right: -20px;
          padding-left: 20px;
          padding-right: 20px;
        }
        .breakdown-label {
          font-size: 14px;
          color: #1a1a1a;
          font-weight: 500;
        }
        .breakdown-amount {
          font-size: 14px;
          color: #1a1a1a;
          font-weight: 600;
        }
        .breakdown-label-final {
          font-size: 16px;
          color: #667eea;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .breakdown-amount-final {
          font-size: 20px;
          color: #1a1a1a;
          font-weight: 700;
        }
        
        /* Footer */
        .footer {
          padding: 20px 30px;
          background: #f8f9fa;
          text-align: center;
          font-size: 12px;
          color: #6c757d;
        }
        
        .strikethrough {
          text-decoration: line-through;
          opacity: 0.5;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header moderne -->
        <div class="header">
          <div class="header-content">
            <div class="header-title">${translations.invoice}</div>
            <div class="invoice-badge">${invoiceNumber}</div>
          </div>
        </div>
        
        <!-- Section entreprise -->
        <div class="company-section">
          <div class="company-grid">
            <div class="company-block">
              <div class="company-label">${translations.issuer}</div>
              <div class="company-value">
                <strong>${settings.ownerFirstName} ${settings.ownerLastName}</strong><br>
                ${selectedPropertyTemplate ? selectedPropertyTemplate.name || settings.companyName : settings.companyName}<br>
                ${selectedPropertyTemplate ? selectedPropertyTemplate.properties.find(p => p.label === 'Adresse')?.value || settings.companyAddress : settings.companyAddress}<br>
                ${selectedPropertyTemplate ? `${selectedPropertyTemplate.properties.find(p => p.label === 'Code postal')?.value || settings.companyPostalCode} ${selectedPropertyTemplate.properties.find(p => p.label === 'Ville')?.value || settings.companyCity}` : `${settings.companyPostalCode} ${settings.companyCity}`}
              </div>
            </div>
            <div class="company-block">
              <div class="company-label">${translations.contact}</div>
              <div class="company-value">
                ${translations.phone}: ${settings.phoneNumber}<br>
                ${translations.email}: ${settings.email}
              </div>
            </div>
            <div class="company-block">
              <div class="company-label">${translations.identifiers}</div>
              <div class="company-value">
                ${translations.establishmentId}: ${selectedPropertyTemplate ? selectedPropertyTemplate.properties.find(p => p.label === 'Identifiant établissement')?.value || settings.establishmentId : settings.establishmentId}<br>
                ${translations.legalEntity}: ${selectedPropertyTemplate ? selectedPropertyTemplate.properties.find(p => p.label === 'Entité juridique')?.value || settings.legalEntityId : settings.legalEntityId}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Détails facture -->
        <div class="invoice-details">
          <div class="detail-block">
            <div class="detail-title">${translations.billedTo}</div>
            <div class="detail-content">
              <strong>${translatedData.firstName} ${translatedData.lastName}</strong><br>
              ${translatedData.email}
              ${translatedData.hasClientAddress ? `<br>${translatedData.clientAddress}<br>${translatedData.clientPostalCode} ${translatedData.clientCity}` : ''}
            </div>
          </div>
          <div class="detail-block">
            <div class="detail-title">${translations.details}</div>
            <div class="detail-content">
              <div class="invoice-number">${invoiceNumber}</div>
              ${translations.date}: ${formattedDate}
            </div>
          </div>
        </div>
        
        <!-- Tableau -->
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>${translations.description}</th>
                <th class="qty-cell">${translations.quantity}</th>
                <th class="price-cell">${translations.unitPrice}</th>
                <th class="price-cell">${translations.price}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="description-cell">
                  ${translations.accommodation} ${arrivalDate} ${translations.to} ${departureDate}
                  ${translatedData.isGeniusRate ? `<br><small style="color: #6c757d;">✓ ${translations.geniusRate}</small>` : ''}
                  ${translatedData.isBookingReservation ? `<br><small style="color: #6c757d;">${translations.bookingReservation} ${translatedData.bookingNumber || ''}</small>` : ''}
                </td>
                <td class="qty-cell">${numberOfNights}</td>
                <td class="price-cell">${formatPrice(pricePerNight, currencyCode)}</td>
                <td class="price-cell">${formatPrice(totalNights, currencyCode)}</td>
              </tr>
              ${translatedData.extras && translatedData.extras.length > 0 ? translatedData.extras.map(extra => `
                <tr>
                  <td class="description-cell">
                    ${extra.name}
                  </td>
                  <td class="qty-cell">${extra.quantity}</td>
                  <td class="price-cell">${formatPrice(extra.price, currencyCode)}</td>
                  <td class="price-cell">${formatPrice(extra.price * extra.quantity, currencyCode)}</td>
                </tr>
              `).join('') : ''}
              ${taxAmount > 0 ? `
                <tr>
                  <td class="${translatedData.isPlatformCollectingTax ? 'strikethrough' : ''}">
                    ${translations.stayTax}
                    ${translatedData.isPlatformCollectingTax ? `<br><small style="color: #6c757d;">${translations.collectedByPlatform}</small>` : ''}
                  </td>
                  <td class="qty-cell ${translatedData.isPlatformCollectingTax ? 'strikethrough' : ''}">1</td>
                  <td class="price-cell ${translatedData.isPlatformCollectingTax ? 'strikethrough' : ''}">${formatPrice(taxAmount, currencyCode)}</td>
                  <td class="price-cell ${translatedData.isPlatformCollectingTax ? 'strikethrough' : ''}">${formatPrice(taxAmount, currencyCode)}</td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
        
        <!-- Total avec détail TVA -->
        <div class="total-section">
          ${isVATSubject ? `
          <div class="total-breakdown">
            <div class="total-line">
              <div class="breakdown-label">${translations.subtotalHT}</div>
              <div class="breakdown-amount">${formatPrice(subtotalHT, currencyCode)}</div>
            </div>
            <div class="total-line">
              <div class="breakdown-label">${translations.vat} (${vatRate.toFixed(vatRate % 1 === 0 ? 0 : 1)}%)</div>
              <div class="breakdown-amount">${formatPrice(vatAmount, currencyCode)}</div>
            </div>
            <div class="total-line total-final">
              <div class="breakdown-label-final">${translations.totalTTC}</div>
              <div class="breakdown-amount-final">${formatPrice(totalTTC, currencyCode)}</div>
            </div>
          </div>
          ` : `
          <div class="total-content">
            <div class="total-label">${translations.total}</div>
            <div class="total-amount">${formatPrice(totalWithTax, currencyCode)}</div>
          </div>
          `}
        </div>
        
        <!-- Footer -->
        <div class="footer">
          ${translatedData.isClientInvoice ? `${translations.clientInvoice} ${translatedData.clientInvoiceNumber}` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
};