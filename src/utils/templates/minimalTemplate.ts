import { InvoiceData } from '../../types/invoice';
import { OwnerSettings } from '../../features/settings/SettingsScreen';
import { getInvoiceTranslation } from '../invoiceTranslations';

export const generateMinimalTemplate = (
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
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #333;
          font-size: 14px;
          padding: 20px;
          line-height: 1.4;
        }
        .container {
          max-width: 700px;
          margin: 0 auto;
        }
        
        /* En-tête minimaliste */
        .header {
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .logo-section {
          flex: 1;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-label {
          font-size: 24px;
          font-weight: 100;
          letter-spacing: 2px;
          color: #000;
          margin-bottom: 8px;
        }
        .invoice-number {
          font-size: 14px;
          color: #444;
          font-weight: 300;
        }
        .invoice-date {
          font-size: 14px;
          color: #444;
          margin-top: 5px;
        }
        
        /* Info entreprise minimaliste */
        .company-info {
          font-size: 13px;
          color: #444;
          line-height: 1.6;
          margin-bottom: 25px;
        }
        .company-name {
          font-size: 18px;
          font-weight: 500;
          color: #000;
          margin-bottom: 8px;
        }
        
        /* Section client minimaliste */
        .client-section {
          margin: 25px 0;
          padding: 20px 0;
          border-top: 1px solid #e0e0e0;
          border-bottom: 1px solid #e0e0e0;
        }
        .client-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #555;
          margin-bottom: 10px;
        }
        .client-info {
          font-size: 14px;
          color: #333;
          line-height: 1.6;
        }
        
        /* Tableau ultra simple */
        .items-section {
          margin: 25px 0;
        }
        .item-row {
          padding: 15px 0;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .item-description {
          flex: 1;
          font-size: 14px;
          color: #333;
        }
        .item-details {
          text-align: right;
          font-size: 14px;
          color: #333;
        }
        .item-subtitle {
          font-size: 12px;
          color: #555;
          margin-top: 5px;
        }
        
        /* Total minimaliste */
        .total-section {
          margin-top: 25px;
          padding-top: 15px;
          text-align: right;
        }
        .subtotal-row {
          margin: 8px 0;
          font-size: 14px;
          color: #444;
        }
        .total-row {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 2px solid #000;
          font-size: 18px;
          font-weight: 500;
          color: #000;
        }
        
        /* Footer minimaliste */
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #f0f0f0;
          font-size: 11px;
          color: #555;
          text-align: center;
        }
        
        .strikethrough {
          text-decoration: line-through;
          opacity: 0.4;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- En-tête -->
        <div class="header">
          <div class="logo-section">
            <div class="company-name">${settings.ownerFirstName} ${settings.ownerLastName}</div>
          </div>
          <div class="invoice-info">
            <div class="invoice-label">FACTURE</div>
            <div class="invoice-number">${invoiceNumber}</div>
            <div class="invoice-date">${formattedDate}</div>
          </div>
        </div>
        
        <!-- Info entreprise -->
        <div class="company-info">
          ${selectedPropertyTemplate ? selectedPropertyTemplate.name || settings.companyName : settings.companyName}<br>
          ${selectedPropertyTemplate ? selectedPropertyTemplate.properties.find(p => p.label === 'Adresse')?.value || settings.companyAddress : settings.companyAddress}<br>
          ${selectedPropertyTemplate ? `${selectedPropertyTemplate.properties.find(p => p.label === 'Code postal')?.value || settings.companyPostalCode} ${selectedPropertyTemplate.properties.find(p => p.label === 'Ville')?.value || settings.companyCity}` : `${settings.companyPostalCode} ${settings.companyCity}`}<br>
          ${settings.phoneNumber} • ${settings.email}<br>
          <small>${translations.establishmentId}: ${selectedPropertyTemplate ? selectedPropertyTemplate.properties.find(p => p.label === 'Identifiant établissement')?.value || settings.establishmentId : settings.establishmentId} • ${translations.legalEntity}: ${selectedPropertyTemplate ? selectedPropertyTemplate.properties.find(p => p.label === 'Entité juridique')?.value || settings.legalEntityId : settings.legalEntityId}</small>
        </div>
        
        <!-- Client -->
        <div class="client-section">
          <div class="client-label">${translations.billedTo}</div>
          <div class="client-info">
            ${data.firstName} ${data.lastName}<br>
            ${data.email}
            ${data.hasClientAddress ? `<br>${data.clientAddress}<br>${data.clientPostalCode} ${data.clientCity}` : ''}
          </div>
        </div>
        
        <!-- Articles -->
        <div class="items-section">
          <div class="item-row">
            <div class="item-description">
              ${translations.accommodation}
              <div class="item-subtitle">
                ${arrivalDate} → ${departureDate} • ${numberOfNights} ${translations.nights}
                ${data.isGeniusRate ? ` • ${translations.geniusRate}` : ''}
                ${data.isBookingReservation ? ` • Booking ${data.bookingNumber || ''}` : ''}
              </div>
            </div>
            <div class="item-details">
              ${totalNights.toFixed(2)} €
            </div>
          </div>
          
          ${taxAmount > 0 ? `
            <div class="item-row">
              <div class="item-description ${data.isPlatformCollectingTax ? 'strikethrough' : ''}">
                ${translations.stayTax}
                ${data.isPlatformCollectingTax ? `<div class="item-subtitle">${translations.collectedByPlatform}</div>` : ''}
              </div>
              <div class="item-details ${data.isPlatformCollectingTax ? 'strikethrough' : ''}">
                ${taxAmount.toFixed(2)} €
              </div>
            </div>
          ` : ''}
        </div>
        
        <!-- Total -->
        <div class="total-section">
          ${finalTaxAmount > 0 ? `
            <div class="subtotal-row">
              Sous-total: ${totalNights.toFixed(2)} €
            </div>
            <div class="subtotal-row">
              Taxe: ${finalTaxAmount.toFixed(2)} €
            </div>
          ` : ''}
          <div class="total-row">
            Total: ${totalWithTax.toFixed(2)} €
          </div>
        </div>
        
        ${data.isClientInvoice ? `
        <!-- Footer -->
        <div class="footer">
          ${translations.clientInvoice} ${data.clientInvoiceNumber}
        </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
};