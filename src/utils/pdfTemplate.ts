import { InvoiceData } from '../types/invoice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SETTINGS_KEY, DEFAULT_SETTINGS, OwnerSettings } from '../features/settings/SettingsScreen';

export const generateInvoiceHTML = async (data: InvoiceData, invoiceNumber: string): Promise<string> => {
  // Charger les paramètres
  let settings: OwnerSettings = DEFAULT_SETTINGS;
  try {
    const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      settings = JSON.parse(savedSettings);
      
      // Migration: si ownerName existe mais pas ownerFirstName/ownerLastName
      if (settings.ownerName && (!settings.ownerFirstName || !settings.ownerLastName)) {
        const nameParts = settings.ownerName.trim().split(' ');
        if (nameParts.length >= 2) {
          settings.ownerFirstName = nameParts[0];
          settings.ownerLastName = nameParts.slice(1).join(' ');
        } else {
          settings.ownerFirstName = '';
          settings.ownerLastName = settings.ownerName;
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres:', error);
  }
  // Convertir les valeurs en nombres si elles sont des strings
  const numberOfNights = typeof data.numberOfNights === 'string' ? parseInt(data.numberOfNights) : data.numberOfNights;
  const pricePerNight = typeof data.pricePerNight === 'string' ? parseFloat(data.pricePerNight.replace(',', '.')) : data.pricePerNight;
  const taxAmount = typeof data.taxAmount === 'string' ? parseFloat(data.taxAmount.replace(',', '.')) : data.taxAmount;
  
  const totalNights = numberOfNights * pricePerNight;
  const totalWithTax = totalNights + taxAmount;
  const formattedDate = new Date(data.invoiceDate).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Formater les dates d'arrivée et départ
  const arrivalDate = data.arrivalDate ? new Date(data.arrivalDate).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '/') : '';
  
  const departureDate = data.departureDate ? new Date(data.departureDate).toLocaleDateString('fr-FR', {
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
        
        /* Infos supplémentaires */
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header avec nom -->
        <div class="header-name">
          ${settings.ownerFirstName} ${settings.ownerLastName}
        </div>
        
        <!-- Section entreprise -->
        <div class="company-section">
          <div class="company-row">
            <div class="company-left">
              <p>${settings.companyName}</p>
              <p>${settings.companyAddress}</p>
              <p>${settings.companyPostalCode} ${settings.companyCity}</p>
              <p>Identifiant Etablissement:${settings.establishmentId}</p>
              <p>Entité Juridique : ${settings.legalEntityId}</p>
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
            <h3>Facturé à :</h3>
            <p>Monsieur ${data.firstName} ${data.lastName.toUpperCase()}</p>
          </div>
          <div class="invoice-section">
            <p>N° Facture : ${invoiceNumber}</p>
            <p>Date de facturation : ${formattedDate}</p>
          </div>
        </div>
        
        <!-- Tableau -->
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Qté</th>
              <th>Prix unitaire</th>
              <th>Prix</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="vertical-align: top;">
                Hébergement du ${arrivalDate} AU ${departureDate}${data.isGeniusRate ? ' - tarif génius' : ''}
              </td>
              <td style="vertical-align: top;">${numberOfNights.toFixed(2)}</td>
              <td style="vertical-align: top;">${pricePerNight.toFixed(2)} €</td>
              <td style="vertical-align: top;">${totalNights.toFixed(2)} €</td>
            </tr>
            <tr>
              <td style="vertical-align: top; padding-top: 20px;">
                Taxe de séjour
              </td>
              <td style="padding-top: 20px;"></td>
              <td style="padding-top: 20px;"></td>
              <td style="vertical-align: top; padding-top: 20px;">${taxAmount.toFixed(2)} €</td>
            </tr>
            <tr>
              <td style="border-bottom: none; padding-top: 30px;">
                Durée du séjour : ${numberOfNights} nuits
                ${data.isBookingReservation && data.bookingNumber ? `<br><br>Réservation tarif via Booking –${data.bookingNumber}` : ''}
                <br><br>
                Règlement effectué directement sur ce site
              </td>
              <td style="border-bottom: none;"></td>
              <td style="border-bottom: none;"></td>
              <td style="border-bottom: none;"></td>
            </tr>
          </tbody>
        </table>
        
        <!-- Total -->
        <div class="total-section">
          <div class="total-box">
            <span class="total-label">TOTAL</span>
            <span class="total-amount">${totalWithTax.toFixed(2)} €</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};