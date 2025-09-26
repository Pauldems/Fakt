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
  // Traductions pour les extras
  extrasTitle: string;
  cleaning: string;
  breakfast: string;
  linens: string;
  parking: string;
  airportTransfer: string;
  addCustomExtra: string;
  extrasTotal: string;
  extrasHelp: string;
  extrasHelpText: string;
  extraNamePlaceholder: string;
  extraPricePlaceholder: string;
  extraQuantityPlaceholder: string;
  // Traductions TVA
  subtotalHT: string;
  vat: string;
  totalTTC: string;
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
    email: 'E-mail',
    extrasTitle: 'Suppléments / Extras',
    cleaning: 'Ménage',
    breakfast: 'Petit déjeuner',
    linens: 'Linge de maison',
    parking: 'Parking',
    airportTransfer: 'Transfert aéroport',
    addCustomExtra: 'Appuyer pour ajouter un extra personnalisé',
    extrasTotal: 'Total',
    extrasHelp: 'Aide - Extras',
    extrasHelpText: 'Vous pouvez :\n\n• Sélectionner un extra prédéfini en appuyant sur une icône\n• Modifier le nom, le prix et la quantité de chaque extra ajouté\n• Ajouter un extra personnalisé en appuyant sur le bouton en bas\n• Supprimer un extra avec l\'icône poubelle',
    extraNamePlaceholder: 'Nom de l\'extra',
    extraPricePlaceholder: 'Prix',
    extraQuantityPlaceholder: 'Qt',
    // TVA
    subtotalHT: 'Sous-total HT',
    vat: 'TVA',
    totalTTC: 'Total TTC'
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
    email: 'Email',
    extrasTitle: 'Supplements / Extras',
    cleaning: 'Cleaning',
    breakfast: 'Breakfast',
    linens: 'Linens',
    parking: 'Parking',
    airportTransfer: 'Airport transfer',
    addCustomExtra: 'Tap to add a custom extra',
    extrasTotal: 'Total',
    extrasHelp: 'Help - Extras',
    extrasHelpText: 'You can:\n\n• Select a predefined extra by tapping an icon\n• Modify the name, price and quantity of each added extra\n• Add a custom extra by tapping the button below\n• Remove an extra with the trash icon',
    extraNamePlaceholder: 'Extra name',
    extraPricePlaceholder: 'Price',
    extraQuantityPlaceholder: 'Qty',
    // VAT
    subtotalHT: 'Subtotal (ex. VAT)',
    vat: 'VAT',
    totalTTC: 'Total (inc. VAT)'
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
    email: 'Email',
    extrasTitle: 'Suplementos / Extras',
    cleaning: 'Limpieza',
    breakfast: 'Desayuno',
    linens: 'Ropa de cama',
    parking: 'Parking',
    airportTransfer: 'Traslado al aeropuerto',
    addCustomExtra: 'Pulsa para añadir un extra personalizado',
    extrasTotal: 'Total',
    extrasHelp: 'Ayuda - Extras',
    extrasHelpText: 'Puedes:\n\n• Seleccionar un extra predefinido tocando un icono\n• Modificar el nombre, precio y cantidad de cada extra añadido\n• Añadir un extra personalizado tocando el botón de abajo\n• Eliminar un extra con el icono de papelera',
    extraNamePlaceholder: 'Nombre del extra',
    extraPricePlaceholder: 'Precio',
    extraQuantityPlaceholder: 'Cant',
    // IVA
    subtotalHT: 'Subtotal (sin IVA)',
    vat: 'IVA',
    totalTTC: 'Total (con IVA)'
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
    email: 'E-Mail',
    extrasTitle: 'Zusatzleistungen / Extras',
    cleaning: 'Reinigung',
    breakfast: 'Frühstück',
    linens: 'Bettwäsche',
    parking: 'Parkplatz',
    airportTransfer: 'Flughafentransfer',
    addCustomExtra: 'Tippen um ein benutzerdefiniertes Extra hinzuzufügen',
    extrasTotal: 'Gesamt',
    extrasHelp: 'Hilfe - Extras',
    extrasHelpText: 'Du kannst:\n\n• Ein vordefiniertes Extra auswählen, indem du auf ein Symbol tippst\n• Namen, Preis und Menge jedes hinzugefügten Extras ändern\n• Ein benutzerdefiniertes Extra hinzufügen, indem du auf die Schaltfläche unten tippst\n• Ein Extra mit dem Papierkorbsymbol entfernen',
    extraNamePlaceholder: 'Extra Name',
    extraPricePlaceholder: 'Preis',
    extraQuantityPlaceholder: 'Anz',
    // MwSt
    subtotalHT: 'Zwischensumme (ohne MwSt.)',
    vat: 'MwSt.',
    totalTTC: 'Gesamt (inkl. MwSt.)'
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
    email: 'Email',
    extrasTitle: 'Supplementi / Extra',
    cleaning: 'Pulizia',
    breakfast: 'Colazione',
    linens: 'Biancheria',
    parking: 'Parcheggio',
    airportTransfer: 'Trasferimento aeroporto',
    addCustomExtra: 'Tocca per aggiungere un extra personalizzato',
    extrasTotal: 'Totale',
    extrasHelp: 'Aiuto - Extra',
    extrasHelpText: 'Puoi:\n\n• Selezionare un extra predefinito toccando un\'icona\n• Modificare nome, prezzo e quantità di ogni extra aggiunto\n• Aggiungere un extra personalizzato toccando il pulsante in basso\n• Rimuovere un extra con l\'icona del cestino',
    extraNamePlaceholder: 'Nome extra',
    extraPricePlaceholder: 'Prezzo',
    extraQuantityPlaceholder: 'Qt',
    // IVA
    subtotalHT: 'Subtotale (senza IVA)',
    vat: 'IVA',
    totalTTC: 'Totale (con IVA)'
  }
};

export function getInvoiceTranslation(language: Language): InvoiceTranslations {
  return invoiceTranslations[language];
}