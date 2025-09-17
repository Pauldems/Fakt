import { InvoiceData } from '../../types/invoice';
import { OwnerSettings } from '../../features/settings/SettingsScreen';
import { getInvoiceTranslation } from '../invoiceTranslations';

export const generateModernTemplate = (
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
              <strong>${data.firstName} ${data.lastName}</strong><br>
              ${data.email}
              ${data.hasClientAddress ? `<br>${data.clientAddress}<br>${data.clientPostalCode} ${data.clientCity}` : ''}
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
                  ${data.isGeniusRate ? `<br><small style="color: #6c757d;">✓ ${translations.geniusRate}</small>` : ''}
                  ${data.isBookingReservation ? `<br><small style="color: #6c757d;">${translations.bookingReservation} ${data.bookingNumber || ''}</small>` : ''}
                </td>
                <td class="qty-cell">${numberOfNights}</td>
                <td class="price-cell">${pricePerNight.toFixed(2)} €</td>
                <td class="price-cell">${totalNights.toFixed(2)} €</td>
              </tr>
              ${taxAmount > 0 ? `
                <tr>
                  <td class="${data.isPlatformCollectingTax ? 'strikethrough' : ''}">
                    ${translations.stayTax}
                    ${data.isPlatformCollectingTax ? `<br><small style="color: #6c757d;">${translations.collectedByPlatform}</small>` : ''}
                  </td>
                  <td class="qty-cell ${data.isPlatformCollectingTax ? 'strikethrough' : ''}">1</td>
                  <td class="price-cell ${data.isPlatformCollectingTax ? 'strikethrough' : ''}">${taxAmount.toFixed(2)} €</td>
                  <td class="price-cell ${data.isPlatformCollectingTax ? 'strikethrough' : ''}">${taxAmount.toFixed(2)} €</td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
        
        <!-- Total -->
        <div class="total-section">
          <div class="total-content">
            <div class="total-label">${translations.total}</div>
            <div class="total-amount">${totalWithTax.toFixed(2)} €</div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          ${data.isClientInvoice ? `${translations.clientInvoice} ${data.clientInvoiceNumber}` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
};