export type Language = 'fr' | 'en' | 'es' | 'de' | 'it';

interface InvoiceTranslations {
  billedTo: string;
  invoiceNumber: string;
  invoiceDate: string;
  description: string;
  quantity: string;
  unitPrice: string;
  price: string;
  accommodation: string;
  from: string;
  to: string;
  geniusRate: string;
  stayTax: string;
  stayDuration: string;
  nights: string;
  bookingReservation: string;
  clientInvoice: string;
  paymentMade: string;
  total: string;
  mister: string;
  establishmentId: string;
  legalEntity: string;
  collectedByPlatform: string;
}

export const invoiceTranslations: Record<Language, InvoiceTranslations> = {
  fr: {
    billedTo: 'Facturé à :',
    invoiceNumber: 'N° Facture :',
    invoiceDate: 'Date de facturation :',
    description: 'Description',
    quantity: 'Qté',
    unitPrice: 'Prix unitaire',
    price: 'Prix',
    accommodation: 'Hébergement du',
    from: 'du',
    to: 'AU',
    geniusRate: '- tarif génius',
    stayTax: 'Taxe de séjour',
    stayDuration: 'Durée du séjour :',
    nights: 'nuits',
    bookingReservation: 'Réservation tarif via Booking –',
    clientInvoice: 'Facture client N°',
    paymentMade: 'Règlement effectué directement sur ce site',
    total: 'TOTAL',
    mister: 'Monsieur',
    establishmentId: 'Identifiant Etablissement',
    legalEntity: 'Entité Juridique',
    collectedByPlatform: 'Collectée par la plateforme'
  },
  en: {
    billedTo: 'Billed to:',
    invoiceNumber: 'Invoice N°:',
    invoiceDate: 'Invoice date:',
    description: 'Description',
    quantity: 'Qty',
    unitPrice: 'Unit price',
    price: 'Price',
    accommodation: 'Accommodation from',
    from: 'from',
    to: 'TO',
    geniusRate: '- genius rate',
    stayTax: 'Tourist tax',
    stayDuration: 'Stay duration:',
    nights: 'nights',
    bookingReservation: 'Booking reservation –',
    clientInvoice: 'Client invoice N°',
    paymentMade: 'Payment made directly on this site',
    total: 'TOTAL',
    mister: 'Mr.',
    establishmentId: 'Establishment ID',
    legalEntity: 'Legal Entity',
    collectedByPlatform: 'Collected by platform'
  },
  es: {
    billedTo: 'Facturado a:',
    invoiceNumber: 'N° Factura:',
    invoiceDate: 'Fecha de facturación:',
    description: 'Descripción',
    quantity: 'Cant.',
    unitPrice: 'Precio unitario',
    price: 'Precio',
    accommodation: 'Alojamiento del',
    from: 'del',
    to: 'AL',
    geniusRate: '- tarifa genius',
    stayTax: 'Tasa turística',
    stayDuration: 'Duración de la estancia:',
    nights: 'noches',
    bookingReservation: 'Reserva vía Booking –',
    clientInvoice: 'Factura cliente N°',
    paymentMade: 'Pago realizado directamente en este sitio',
    total: 'TOTAL',
    mister: 'Sr.',
    establishmentId: 'ID Establecimiento',
    legalEntity: 'Entidad Legal',
    collectedByPlatform: 'Recaudado por la plataforma'
  },
  de: {
    billedTo: 'Rechnungsempfänger:',
    invoiceNumber: 'Rechnung Nr.:',
    invoiceDate: 'Rechnungsdatum:',
    description: 'Beschreibung',
    quantity: 'Anz.',
    unitPrice: 'Einzelpreis',
    price: 'Preis',
    accommodation: 'Unterkunft vom',
    from: 'vom',
    to: 'BIS',
    geniusRate: '- Genius-Tarif',
    stayTax: 'Kurtaxe',
    stayDuration: 'Aufenthaltsdauer:',
    nights: 'Nächte',
    bookingReservation: 'Buchung über Booking –',
    clientInvoice: 'Kundenrechnung Nr.',
    paymentMade: 'Zahlung direkt über diese Website',
    total: 'GESAMT',
    mister: 'Herr',
    establishmentId: 'Betriebskennung',
    legalEntity: 'Juristische Person',
    collectedByPlatform: 'Von der Plattform erhoben'
  },
  it: {
    billedTo: 'Fatturato a:',
    invoiceNumber: 'N° Fattura:',
    invoiceDate: 'Data fatturazione:',
    description: 'Descrizione',
    quantity: 'Qtà',
    unitPrice: 'Prezzo unitario',
    price: 'Prezzo',
    accommodation: 'Alloggio dal',
    from: 'dal',
    to: 'AL',
    geniusRate: '- tariffa genius',
    stayTax: 'Tassa di soggiorno',
    stayDuration: 'Durata soggiorno:',
    nights: 'notti',
    bookingReservation: 'Prenotazione via Booking –',
    clientInvoice: 'Fattura cliente N°',
    paymentMade: 'Pagamento effettuato direttamente su questo sito',
    total: 'TOTALE',
    mister: 'Sig.',
    establishmentId: 'ID Struttura',
    legalEntity: 'Entità Legale',
    collectedByPlatform: 'Riscossa dalla piattaforma'
  }
};

export function getInvoiceTranslation(language: Language): InvoiceTranslations {
  return invoiceTranslations[language];
}