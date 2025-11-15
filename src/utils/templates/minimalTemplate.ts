import { InvoiceData } from '../../types/invoice';
import { OwnerSettings } from '../../features/settings/SettingsScreen';
import { getInvoiceTranslation } from '../invoiceTranslations';
import { translateExtras } from '../extrasTranslator';

export const generateMinimalTemplate = (
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
        
        /* Header avec logo */
        .header-with-logo {
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .logo-and-name-section {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .logo-image {
          max-width: 120px;
          max-height: 60px;
          width: auto;
          height: auto;
          object-fit: contain;
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
        ${settings.useLogo && settings.logoImage ? `
        <div class="header-with-logo">
          <div class="logo-and-name-section">
            <img src="${settings.logoImage}" alt="Logo" class="logo-image" />
            <div class="company-name">${settings.ownerFirstName} ${settings.ownerLastName}</div>
          </div>
          <div class="invoice-info">
            <div class="invoice-label">FACTURE</div>
            <div class="invoice-number">${invoiceNumber}</div>
            <div class="invoice-date">${formattedDate}</div>
          </div>
        </div>
        ` : `
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
        `}
        
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
            ${translatedData.firstName} ${translatedData.lastName}<br>
            ${translatedData.email}
            ${translatedData.hasClientAddress ? `<br>${translatedData.clientAddress}<br>${translatedData.clientPostalCode} ${translatedData.clientCity}` : ''}
          </div>
        </div>
        
        <!-- Articles -->
        <div class="items-section">
          <div class="item-row">
            <div class="item-description">
              ${translations.accommodation}
              <div class="item-subtitle">
                ${arrivalDate} → ${departureDate} • ${numberOfNights} ${translations.nights}
                ${translatedData.specialRateType ? ` • ${translatedData.specialRateType}` : ''}
              </div>
            </div>
            <div class="item-details">
              ${totalNights.toFixed(2)} €
            </div>
          </div>
          
          ${translatedData.extras && translatedData.extras.length > 0 ? translatedData.extras.map(extra => `
            <div class="item-row">
              <div class="item-description">
                ${extra.name}
                <div class="item-subtitle">
                  ${extra.quantity} x ${extra.price.toFixed(2)} €
                </div>
              </div>
              <div class="item-details">
                ${(extra.price * extra.quantity).toFixed(2)} €
              </div>
            </div>
          `).join('') : ''}
          
          ${taxAmount > 0 ? `
            <div class="item-row">
              <div class="item-description ${translatedData.isPlatformCollectingTax ? 'strikethrough' : ''}">
                ${translations.stayTax}
                ${translatedData.isPlatformCollectingTax ? `<div class="item-subtitle">${translations.collectedByPlatform}</div>` : ''}
              </div>
              <div class="item-details ${translatedData.isPlatformCollectingTax ? 'strikethrough' : ''}">
                ${taxAmount.toFixed(2)} €
              </div>
            </div>
          ` : ''}
        </div>
        
        <!-- Total -->
        <div class="total-section">
          ${isVATSubject ? `
            <div class="subtotal-row">
              Sous-total HT: ${subtotalHT.toFixed(2)} €
            </div>
            <div class="subtotal-row">
              TVA (${vatRate.toFixed(vatRate % 1 === 0 ? 0 : 1)}%): ${vatAmount.toFixed(2)} €
            </div>
            ${finalTaxAmount > 0 ? `
              <div class="subtotal-row">
                Taxe de séjour: ${finalTaxAmount.toFixed(2)} €
              </div>
            ` : ''}
            <div class="total-row">
              Total TTC: ${totalWithTax.toFixed(2)} €
            </div>
          ` : `
            ${finalTaxAmount > 0 ? `
              <div class="subtotal-row">
                Sous-total: ${(totalNights + totalExtras).toFixed(2)} €
              </div>
              <div class="subtotal-row">
                Taxe: ${finalTaxAmount.toFixed(2)} €
              </div>
            ` : ''}
            <div class="total-row">
              Total: ${totalWithTax.toFixed(2)} €
            </div>
          `}
        </div>
        
        ${translatedData.isClientInvoice ? `
        <!-- Footer -->
        <div class="footer">
          ${translations.clientInvoice} ${translatedData.clientInvoiceNumber}
        </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
};