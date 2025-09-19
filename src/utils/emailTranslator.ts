export type Language = 'fr' | 'en' | 'es' | 'de' | 'it';

interface EmailTerms {
  greeting: string;
  closing: string;
  attachment: string;
  stay: string;
  month: string;
  year: string;
  regards: string;
  invoiceOfYourStay: string;
  invoice: string;
  yourStay: string;
  for: string;
}

const emailTerms: Record<Language, EmailTerms> = {
  fr: {
    greeting: 'Bonjour',
    closing: 'En vous souhaitant bonne réception',
    attachment: 'Veuillez trouver ci-joint',
    stay: 'séjour',
    month: 'mois',
    year: 'année',
    regards: 'Cordialement',
    invoiceOfYourStay: 'la facture de votre séjour',
    invoice: 'facture',
    yourStay: 'votre séjour',
    for: 'pour'
  },
  en: {
    greeting: 'Hello',
    closing: 'Best regards',
    attachment: 'Please find attached',
    stay: 'stay',
    month: 'month',
    year: 'year',
    regards: 'Kind regards',
    invoiceOfYourStay: 'the invoice for your stay',
    invoice: 'invoice',
    yourStay: 'your stay',
    for: 'for'
  },
  es: {
    greeting: 'Hola',
    closing: 'Saludos cordiales',
    attachment: 'Adjunto encontrará',
    stay: 'estancia',
    month: 'mes',
    year: 'año',
    regards: 'Atentamente',
    invoiceOfYourStay: 'la factura de su estancia',
    invoice: 'factura',
    yourStay: 'su estancia',
    for: 'para'
  },
  de: {
    greeting: 'Guten Tag',
    closing: 'Mit freundlichen Grüßen',
    attachment: 'Im Anhang finden Sie',
    stay: 'Aufenthalt',
    month: 'Monat',
    year: 'Jahr',
    regards: 'Freundliche Grüße',
    invoiceOfYourStay: 'die Rechnung für Ihren Aufenthalt',
    invoice: 'Rechnung',
    yourStay: 'Ihren Aufenthalt',
    for: 'für'
  },
  it: {
    greeting: 'Buongiorno',
    closing: 'Cordiali saluti',
    attachment: 'In allegato trova',
    stay: 'soggiorno',
    month: 'mese',
    year: 'anno',
    regards: 'Distinti saluti',
    invoiceOfYourStay: 'la fattura del suo soggiorno',
    invoice: 'fattura',
    yourStay: 'il suo soggiorno',
    for: 'per'
  }
};

export function translateEmailText(text: string, fromLanguage: Language, toLanguage: Language): string {
  if (fromLanguage === toLanguage) return text;
  
  let translatedText = text;
  const fromTerms = emailTerms[fromLanguage];
  const toTerms = emailTerms[toLanguage];
  
  // Ordre de priorité pour traiter les expressions longues en premier
  const termsOrder = [
    'invoiceOfYourStay',
    'yourStay', 
    'greeting',
    'closing',
    'attachment',
    'stay',
    'month',
    'year',
    'regards',
    'invoice',
    'for'
  ];
  
  // Remplacer les termes par ordre de priorité
  termsOrder.forEach(key => {
    const fromTerm = fromTerms[key as keyof EmailTerms];
    const toTerm = toTerms[key as keyof EmailTerms];
    
    // Échapper les caractères spéciaux pour la regex
    const escapedFromTerm = fromTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Pour le mot "pour", être plus spécifique pour éviter les mauvaises traductions
    let regex;
    if (key === 'for') {
      // Traduire "pour" seulement quand il est suivi de "le mois", "l'année", etc.
      regex = new RegExp(`\\b${escapedFromTerm}\\s+(le\\s+mois|l'année|\\{MOIS\\}|\\{ANNEE\\})`, 'gi');
    } else {
      regex = new RegExp(`${escapedFromTerm}`, 'gi');
    }
    
    translatedText = translatedText.replace(regex, (match) => {
      if (key === 'for') {
        // Pour "pour le mois" -> "for {MOIS}" ou "para {MOIS}", etc.
        const parts = match.split(/\s+/);
        parts[0] = toTerm;
        return parts.join(' ');
      } else {
        // Préserver la casse du texte original
        if (match === fromTerm.toUpperCase()) return toTerm.toUpperCase();
        if (match === fromTerm.toLowerCase()) return toTerm.toLowerCase();
        if (match[0] === match[0].toUpperCase()) {
          return toTerm.charAt(0).toUpperCase() + toTerm.slice(1).toLowerCase();
        }
        return toTerm.toLowerCase();
      }
    });
  });
  
  return translatedText;
}