export type Language = 'fr' | 'en' | 'es' | 'de' | 'it';

interface EmailTerms {
  greeting: string;
  closing: string;
  attachment: string;
  stay: string;
  month: string;
  year: string;
  regards: string;
}

const emailTerms: Record<Language, EmailTerms> = {
  fr: {
    greeting: 'Bonjour',
    closing: 'En vous souhaitant bonne réception',
    attachment: 'Veuillez trouver ci-joint',
    stay: 'séjour',
    month: 'mois',
    year: 'année',
    regards: 'Cordialement'
  },
  en: {
    greeting: 'Hello',
    closing: 'Best regards',
    attachment: 'Please find attached',
    stay: 'stay',
    month: 'month',
    year: 'year',
    regards: 'Kind regards'
  },
  es: {
    greeting: 'Hola',
    closing: 'Saludos cordiales',
    attachment: 'Adjunto encontrará',
    stay: 'estancia',
    month: 'mes',
    year: 'año',
    regards: 'Atentamente'
  },
  de: {
    greeting: 'Guten Tag',
    closing: 'Mit freundlichen Grüßen',
    attachment: 'Im Anhang finden Sie',
    stay: 'Aufenthalt',
    month: 'Monat',
    year: 'Jahr',
    regards: 'Freundliche Grüße'
  },
  it: {
    greeting: 'Buongiorno',
    closing: 'Cordiali saluti',
    attachment: 'In allegato trova',
    stay: 'soggiorno',
    month: 'mese',
    year: 'anno',
    regards: 'Distinti saluti'
  }
};

export function translateEmailText(text: string, fromLanguage: Language, toLanguage: Language): string {
  if (fromLanguage === toLanguage) return text;
  
  let translatedText = text;
  const fromTerms = emailTerms[fromLanguage];
  const toTerms = emailTerms[toLanguage];
  
  // Remplacer les termes français par leur équivalent dans la langue cible
  Object.keys(fromTerms).forEach(key => {
    const fromTerm = fromTerms[key as keyof EmailTerms];
    const toTerm = toTerms[key as keyof EmailTerms];
    
    // Remplacer en respectant la casse
    const regex = new RegExp(`\\b${fromTerm}\\b`, 'gi');
    translatedText = translatedText.replace(regex, (match) => {
      // Préserver la casse du texte original
      if (match === fromTerm.toUpperCase()) return toTerm.toUpperCase();
      if (match === fromTerm.toLowerCase()) return toTerm.toLowerCase();
      if (match[0] === match[0].toUpperCase()) {
        return toTerm.charAt(0).toUpperCase() + toTerm.slice(1).toLowerCase();
      }
      return toTerm.toLowerCase();
    });
  });
  
  return translatedText;
}