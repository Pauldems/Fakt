import { InvoiceData } from '../types/invoice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SETTINGS_KEY, DEFAULT_SETTINGS, OwnerSettings } from '../features/settings/SettingsScreen';
import { getInvoiceTranslation } from './invoiceTranslations';
import { generateModernTemplate } from './templates/modernTemplate';
import { generateClassicTemplate } from './templates/classicTemplate';
import { generateMinimalTemplate } from './templates/minimalTemplate';
import { translateExtras } from './extrasTranslator';
import hybridSettingsService from '../services/hybridSettingsService';
import { formatPrice, getCurrencySymbol } from './currencyFormatter';

export type InvoiceTemplateType = 'modern' | 'classic' | 'minimal' | 'original';

export const generateInvoiceHTML = async (data: InvoiceData, invoiceNumber: string, language?: 'fr' | 'en' | 'es' | 'de' | 'it'): Promise<string> => {
  // Charger les paramètres avec service hybride (Firebase + infos activation)
  let settings: OwnerSettings = DEFAULT_SETTINGS;
  let selectedPropertyTemplate = null;
  
  let selectedTemplate: InvoiceTemplateType = 'original'; // Par défaut
  
  try {
    // Utiliser le service hybride pour récupérer les bonnes infos utilisateur
    settings = await hybridSettingsService.getSettings();
    console.log('📄 Paramètres pour PDF:', {
      ownerName: settings.ownerName,
      ownerFirstName: settings.ownerFirstName, 
      ownerLastName: settings.ownerLastName,
      email: settings.email
    });
    
    // Récupérer le template sélectionné
    if (settings.invoiceTemplate) {
      selectedTemplate = settings.invoiceTemplate as InvoiceTemplateType;
    }

    // Trouver la propriété sélectionnée
    if (data.selectedPropertyId && settings.propertyTemplates) {
      selectedPropertyTemplate = settings.propertyTemplates.find(
        template => template.id === data.selectedPropertyId
      );
    }
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres:', error);
  }
  
  // Utiliser le bon template
  const selectedLanguage = language || 'fr';
  
  // Traduire les extras selon la langue sélectionnée
  const translatedData = {
    ...data,
    extras: data.extras ? translateExtras(data.extras, selectedLanguage) : undefined
  };
  
  switch(selectedTemplate) {
    case 'modern':
      return generateModernTemplate(translatedData, invoiceNumber, settings, selectedPropertyTemplate, selectedLanguage);
    case 'classic':
      return generateClassicTemplate(translatedData, invoiceNumber, settings, selectedPropertyTemplate, selectedLanguage);
    case 'minimal':
      return generateMinimalTemplate(translatedData, invoiceNumber, settings, selectedPropertyTemplate, selectedLanguage);
    default:
      // Continuer avec le template original ci-dessous avec les données traduites
      data = translatedData;
      break;
  }
  // Convertir les valeurs en nombres si elles sont des strings
  const numberOfNights = typeof data.numberOfNights === 'string' ? parseInt(data.numberOfNights) : data.numberOfNights;
  const pricePerNight = typeof data.pricePerNight === 'string' ? parseFloat((data.pricePerNight as string).replace(',', '.')) : data.pricePerNight;
  const taxAmount = typeof data.taxAmount === 'string' ? parseFloat((data.taxAmount as string).replace(',', '.')) : data.taxAmount;
  
  const totalNights = numberOfNights * pricePerNight;
  
  // Calculer le total des extras
  const totalExtras = data.extras ? data.extras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0) : 0;
  
  // Inclure la taxe dans le total seulement si la plateforme ne la collecte pas
  const finalTaxAmount = data.isPlatformCollectingTax ? 0 : taxAmount;
  
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
  
  // Obtenir la langue et les traductions (déjà défini plus haut)
  const translations = getInvoiceTranslation(selectedLanguage);
  
  // Formater les dates selon la langue
  const locale = selectedLanguage === 'en' ? 'en-US' : 
                 selectedLanguage === 'es' ? 'es-ES' :
                 selectedLanguage === 'de' ? 'de-DE' :
                 selectedLanguage === 'it' ? 'it-IT' : 'fr-FR';
  
  const formattedDate = new Date(data.invoiceDate).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Formater les dates d'arrivée et départ
  const arrivalDate = data.arrivalDate ? new Date(data.arrivalDate).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '/') : '';
  
  const departureDate = data.departureDate ? new Date(data.departureDate).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '/') : '';

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
          font-family: Arial, sans-serif;
          color: #333;
          font-size: 14px;
          padding: 20px;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        
        /* Header avec nom */
        .header-name {
          background-color: #1a6b7a;
          color: white;
          padding: 15px 20px;
          font-size: 20px;
          font-weight: bold;
        }
        
        /* Header avec logo */
        .header-with-logo {
          background-color: #1a6b7a;
          color: white;
          padding: 15px 20px;
          display: table;
          width: 100%;
        }
        .header-logo-section {
          display: table-cell;
          width: 30%;
          vertical-align: middle;
        }
        .header-name-section {
          display: table-cell;
          width: 70%;
          vertical-align: middle;
          text-align: right;
        }
        .header-name-with-logo {
          font-size: 20px;
          font-weight: bold;
        }
        .logo-image {
          max-width: 120px;
          max-height: 60px;
          width: auto;
          height: auto;
          object-fit: contain;
        }
        
        /* Info entreprise */
        .company-section {
          background-color: #7fc8d6;
          display: table;
          width: 100%;
        }
        .company-row {
          display: table-row;
        }
        .company-left, .company-right {
          display: table-cell;
          padding: 15px 20px;
          width: 50%;
          vertical-align: top;
        }
        .company-left {
          border-right: 1px solid #6bb5c3;
        }
        .company-left p, .company-right p {
          margin: 3px 0;
          color: #1a4a52;
          font-size: 14px;
        }
        
        /* Section client et facture */
        .invoice-header {
          margin-top: 30px;
          margin-bottom: 40px;
          display: table;
          width: 100%;
        }
        .client-section, .invoice-section {
          display: table-cell;
          width: 50%;
          vertical-align: top;
        }
        .client-section h3 {
          color: #1a6b7a;
          font-size: 16px;
          margin-bottom: 10px;
        }
        .client-section p {
          margin: 5px 0;
          font-size: 14px;
        }
        .invoice-section {
          text-align: right;
        }
        .invoice-section p {
          margin: 5px 0;
          font-size: 14px;
        }
        
        /* Tableau */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        table th {
          border-bottom: 2px solid #1a6b7a;
          padding: 10px;
          text-align: left;
          color: #1a6b7a;
          font-weight: normal;
          font-size: 16px;
        }
        table td {
          padding: 15px 10px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 14px;
        }
        table th:nth-child(2),
        table td:nth-child(2) {
          text-align: center;
          width: 80px;
        }
        table th:nth-child(3),
        table td:nth-child(3),
        table th:nth-child(4),
        table td:nth-child(4) {
          text-align: right;
          width: 120px;
        }
        
        /* Total */
        .total-section {
          margin-top: 40px;
          text-align: right;
        }
        .total-box {
          display: inline-block;
          border: 2px solid #1a6b7a;
          padding: 15px 30px;
          background-color: white;
        }
        .total-label {
          display: inline-block;
          margin-right: 50px;
          font-size: 16px;
          color: #1a6b7a;
        }
        .total-amount {
          display: inline-block;
          font-size: 16px;
          font-weight: bold;
          color: #333;
        }
        
        /* TVA Breakdown */
        .total-breakdown {
          display: inline-block;
          border: 2px solid #1a6b7a;
          background-color: white;
          min-width: 350px;
        }
        .total-line {
          display: flex;
          justify-content: space-between;
          padding: 10px 20px;
          border-bottom: 1px solid #e0e0e0;
        }
        .total-line:last-child {
          border-bottom: none;
        }
        .total-line.total-final {
          border-top: 2px solid #1a6b7a;
          background-color: #f8fafb;
        }
        .total-label-breakdown {
          font-size: 14px;
          color: #333;
        }
        .total-amount-breakdown {
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }
        .total-label-final {
          font-size: 16px;
          color: #1a6b7a;
          font-weight: bold;
        }
        .total-amount-final {
          font-size: 16px;
          color: #333;
          font-weight: bold;
        }
        
        /* Infos supplémentaires */
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header avec nom -->
        ${settings.useLogo && settings.logoImage ? `
        <div class="header-with-logo">
          <div class="header-logo-section">
            <img src="${settings.logoImage}" alt="Logo" class="logo-image" />
          </div>
          <div class="header-name-section">
            <div class="header-name-with-logo">
              ${settings.ownerFirstName} ${settings.ownerLastName}
            </div>
          </div>
        </div>
        ` : `
        <div class="header-name">
          ${settings.ownerFirstName} ${settings.ownerLastName}
        </div>
        `}
        
        <!-- Section entreprise -->
        <div class="company-section">
          <div class="company-row">
            <div class="company-left">
              <p>${selectedPropertyTemplate ? selectedPropertyTemplate.name || settings.companyName : settings.companyName}</p>
              <p>${selectedPropertyTemplate ? selectedPropertyTemplate.properties.find(p => p.label === 'Adresse')?.value || settings.companyAddress : settings.companyAddress}</p>
              <p>${selectedPropertyTemplate ? `${selectedPropertyTemplate.properties.find(p => p.label === 'Code postal')?.value || settings.companyPostalCode} ${selectedPropertyTemplate.properties.find(p => p.label === 'Ville')?.value || settings.companyCity}` : `${settings.companyPostalCode} ${settings.companyCity}`}</p>
              <p>${translations.establishmentId}: ${selectedPropertyTemplate ? selectedPropertyTemplate.properties.find(p => p.label === 'Identifiant établissement')?.value || settings.establishmentId : settings.establishmentId}</p>
              <p>${translations.legalEntity}: ${selectedPropertyTemplate ? selectedPropertyTemplate.properties.find(p => p.label === 'Entité juridique')?.value || settings.legalEntityId : settings.legalEntityId}</p>
              ${selectedPropertyTemplate ? selectedPropertyTemplate.properties.filter(prop => prop.label && prop.value && !['Adresse', 'Code postal', 'Ville', 'Identifiant établissement', 'Entité juridique'].includes(prop.label)).map(prop => `<p>${prop.label}: ${prop.value}</p>`).join('') : (settings.customProperties ? settings.customProperties.filter(prop => prop.label && prop.value).map(prop => `<p>${prop.label}: ${prop.value}</p>`).join('') : '')}
            </div>
            <div class="company-right">
              <p>Tél. : ${settings.phoneNumber}</p>
              <p>&nbsp;</p>
              <p>&nbsp;</p>
              <p>E-mail : ${settings.email}</p>
            </div>
          </div>
        </div>
        
        <!-- Client et numéro facture -->
        <div class="invoice-header">
          <div class="client-section">
            <h3>${translations.billedTo}</h3>
            <p>${translations.mister} ${data.firstName} ${data.lastName.toUpperCase()}</p>
            ${data.hasClientAddress && data.clientAddress ? `
              <p>${data.clientAddress}</p>
              <p>${data.clientPostalCode} ${data.clientCity}</p>
            ` : ''}
          </div>
          <div class="invoice-section">
            <p>${translations.invoiceNumber} ${invoiceNumber}</p>
            <p>${translations.invoiceDate} ${formattedDate}</p>
          </div>
        </div>
        
        <!-- Tableau -->
        <table>
          <thead>
            <tr>
              <th>${translations.description}</th>
              <th>${translations.quantity}</th>
              <th>${translations.unitPrice}</th>
              <th>${translations.price}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="vertical-align: top;">
                ${translations.accommodation} ${arrivalDate} ${translations.to} ${departureDate}${data.isGeniusRate ? ` ${translations.geniusRate}` : ''}
              </td>
              <td style="vertical-align: top;">${numberOfNights.toFixed(2)}</td>
              <td style="vertical-align: top;">${formatPrice(pricePerNight, currencyCode)}</td>
              <td style="vertical-align: top;">${formatPrice(totalNights, currencyCode)}</td>
            </tr>
            ${data.extras && data.extras.length > 0 ? data.extras.map(extra => `
            <tr>
              <td style="vertical-align: top; padding-top: 10px;">
                ${extra.name}${extra.quantity > 1 ? ` (x${extra.quantity})` : ''}
              </td>
              <td style="padding-top: 10px;">${extra.quantity}</td>
              <td style="padding-top: 10px;">${formatPrice(extra.price, currencyCode)}</td>
              <td style="vertical-align: top; padding-top: 10px;">${formatPrice(extra.price * extra.quantity, currencyCode)}</td>
            </tr>
            `).join('') : ''}
            <tr>
              <td style="vertical-align: top; padding-top: 20px;">
                ${translations.stayTax}
                ${data.isPlatformCollectingTax ? `<br><small style="color: #666; font-style: italic;">(${translations.collectedByPlatform || 'Collectée par la plateforme'})</small>` : ''}
              </td>
              <td style="padding-top: 20px;"></td>
              <td style="padding-top: 20px;"></td>
              <td style="vertical-align: top; padding-top: 20px;">
                ${data.isPlatformCollectingTax ? 
                  `<span style="text-decoration: line-through; color: #666;">${formatPrice(taxAmount, currencyCode)}</span><br><small style="color: #666;">${formatPrice(0, currencyCode)}</small>` : 
                  `${formatPrice(taxAmount, currencyCode)}`
                }
              </td>
            </tr>
            <tr>
              <td style="border-bottom: none; padding-top: 30px;">
                ${translations.stayDuration} ${numberOfNights} ${translations.nights}
                ${data.isBookingReservation && data.bookingNumber ? `<br><br>${translations.bookingReservation}${data.bookingNumber}` : ''}
                ${data.isClientInvoice && data.clientInvoiceNumber ? `<br><br>${translations.clientInvoice} ${data.clientInvoiceNumber}` : ''}
                <br><br>
                ${(() => {
                  if (data.paymentMethod === 'cash') return translations.paymentCash;
                  if (data.paymentMethod === 'card') return translations.paymentCard;
                  if (data.paymentMethod === 'transfer') return translations.paymentTransfer;
                  if (data.paymentMethod === 'check') return translations.paymentCheck;
                  return translations.paymentPlatform || translations.paymentMade || 'Règlement effectué directement sur la plateforme';
                })()}
              </td>
              <td style="border-bottom: none;"></td>
              <td style="border-bottom: none;"></td>
              <td style="border-bottom: none;"></td>
            </tr>
          </tbody>
        </table>
        
        <!-- Total avec détail TVA -->
        <div class="total-section">
          ${isVATSubject ? `
          <div class="total-breakdown">
            <div class="total-line">
              <span class="total-label-breakdown">${translations.subtotalHT || 'Sous-total HT'}</span>
              <span class="total-amount-breakdown">${formatPrice(subtotalHT, currencyCode)}</span>
            </div>
            <div class="total-line">
              <span class="total-label-breakdown">${translations.vat || 'TVA'} (${vatRate.toFixed(vatRate % 1 === 0 ? 0 : 1)}%)</span>
              <span class="total-amount-breakdown">${formatPrice(vatAmount, currencyCode)}</span>
            </div>
            <div class="total-line total-final">
              <span class="total-label-final">${translations.totalTTC || 'Total TTC'}</span>
              <span class="total-amount-final">${formatPrice(totalTTC, currencyCode)}</span>
            </div>
          </div>
          ` : `
          <div class="total-box">
            <span class="total-label">${translations.total}</span>
            <span class="total-amount">${formatPrice(totalWithTax, currencyCode)}</span>
          </div>
          `}
        </div>
      </div>
    </body>
    </html>
  `;
};