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
  // Nouvelles traductions pour les templates
  invoice: string;
  issuer: string;
  contact: string;
  identifiers: string;
  details: string;
  client: string;
  date: string;
  amount: string;
  subtotal: string;
  tax: string;
  totalTtc: string;
  thankYou: string;
  phone: string;
  email: string;
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
    collectedByPlatform: 'Collectée par la plateforme',
    // Nouvelles traductions
    invoice: 'FACTURE',
    issuer: 'Émetteur',
    contact: 'Contact',
    identifiers: 'Identifiants',
    details: 'Détails de la facture',
    client: 'CLIENT',
    date: 'Date',
    amount: 'MONTANT',
    subtotal: 'Sous-total HT',
    tax: 'Taxe',
    totalTtc: 'TOTAL TTC',
    thankYou: 'Merci de votre confiance',
    phone: 'Tél',
    email: 'E-mail'
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
    collectedByPlatform: 'Collected by platform',
    // Nouvelles traductions
    invoice: 'INVOICE',
    issuer: 'Issuer',
    contact: 'Contact',
    identifiers: 'Identifiers',
    details: 'Invoice details',
    client: 'CLIENT',
    date: 'Date',
    amount: 'AMOUNT',
    subtotal: 'Subtotal',
    tax: 'Tax',
    totalTtc: 'TOTAL',
    thankYou: 'Thank you for your trust',
    phone: 'Tel',
    email: 'Email'
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
    collectedByPlatform: 'Recaudado por la plataforma',
    // Nouvelles traductions
    invoice: 'FACTURA',
    issuer: 'Emisor',
    contact: 'Contacto',
    identifiers: 'Identificadores',
    details: 'Detalles de la factura',
    client: 'CLIENTE',
    date: 'Fecha',
    amount: 'IMPORTE',
    subtotal: 'Subtotal',
    tax: 'Impuesto',
    totalTtc: 'TOTAL',
    thankYou: 'Gracias por su confianza',
    phone: 'Tel',
    email: 'Email'
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
    collectedByPlatform: 'Von der Plattform erhoben',
    // Nouvelles traductions
    invoice: 'RECHNUNG',
    issuer: 'Aussteller',
    contact: 'Kontakt',
    identifiers: 'Kennungen',
    details: 'Rechnungsdetails',
    client: 'KUNDE',
    date: 'Datum',
    amount: 'BETRAG',
    subtotal: 'Zwischensumme',
    tax: 'Steuer',
    totalTtc: 'GESAMT',
    thankYou: 'Vielen Dank für Ihr Vertrauen',
    phone: 'Tel',
    email: 'E-Mail'
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
    collectedByPlatform: 'Riscossa dalla piattaforma',
    // Nouvelles traductions
    invoice: 'FATTURA',
    issuer: 'Emittente',
    contact: 'Contatto',
    identifiers: 'Identificatori',
    details: 'Dettagli fattura',
    client: 'CLIENTE',
    date: 'Data',
    amount: 'IMPORTO',
    subtotal: 'Subtotale',
    tax: 'Tassa',
    totalTtc: 'TOTALE',
    thankYou: 'Grazie per la fiducia',
    phone: 'Tel',
    email: 'Email'
  }
};

export function getInvoiceTranslation(language: Language): InvoiceTranslations {
  return invoiceTranslations[language];
}