export type Language = 'fr' | 'en' | 'es' | 'de' | 'it';

interface EmailTranslations {
  defaultSubject: string;
  defaultBody: string;
  months: string[];
  greeting: string;
  closing: string;
  attachmentText: string;
}

export const emailTranslations: Record<Language, EmailTranslations> = {
  fr: {
    defaultSubject: 'Facture séjour {VILLE} - {NOM} {PRENOM}',
    defaultBody: `Bonjour,

Veuillez trouver ci-joint la facture de votre séjour {VILLE} pour le mois de {MOIS} {ANNEE}.

En vous souhaitant bonne réception,

{PRENOM-PROPRIETAIRE} {NOM-PROPRIETAIRE}`,
    months: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
             'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
    greeting: 'Bonjour',
    closing: 'En vous souhaitant bonne réception',
    attachmentText: 'Veuillez trouver ci-joint la facture de votre séjour'
  },
  en: {
    defaultSubject: 'Invoice for stay in {VILLE} - {NOM} {PRENOM}',
    defaultBody: `Hello,

Please find attached the invoice for your stay in {VILLE} for {MOIS} {ANNEE}.

Best regards,

{PRENOM-PROPRIETAIRE} {NOM-PROPRIETAIRE}`,
    months: ['January', 'February', 'March', 'April', 'May', 'June',
             'July', 'August', 'September', 'October', 'November', 'December'],
    greeting: 'Hello',
    closing: 'Best regards',
    attachmentText: 'Please find attached the invoice for your stay'
  },
  es: {
    defaultSubject: 'Factura estancia {VILLE} - {NOM} {PRENOM}',
    defaultBody: `Hola,

Adjunto encontrará la factura de su estancia en {VILLE} para {MOIS} {ANNEE}.

Saludos cordiales,

{PRENOM-PROPRIETAIRE} {NOM-PROPRIETAIRE}`,
    months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
             'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    greeting: 'Hola',
    closing: 'Saludos cordiales',
    attachmentText: 'Adjunto encontrará la factura de su estancia'
  },
  de: {
    defaultSubject: 'Rechnung Aufenthalt {VILLE} - {NOM} {PRENOM}',
    defaultBody: `Guten Tag,

Im Anhang finden Sie die Rechnung für Ihren Aufenthalt in {VILLE} für {MOIS} {ANNEE}.

Mit freundlichen Grüßen,

{PRENOM-PROPRIETAIRE} {NOM-PROPRIETAIRE}`,
    months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
             'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    greeting: 'Guten Tag',
    closing: 'Mit freundlichen Grüßen',
    attachmentText: 'Im Anhang finden Sie die Rechnung für Ihren Aufenthalt'
  },
  it: {
    defaultSubject: 'Fattura soggiorno {VILLE} - {NOM} {PRENOM}',
    defaultBody: `Buongiorno,

In allegato trova la fattura del suo soggiorno a {VILLE} per {MOIS} {ANNEE}.

Cordiali saluti,

{PRENOM-PROPRIETAIRE} {NOM-PROPRIETAIRE}`,
    months: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
             'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
    greeting: 'Buongiorno',
    closing: 'Cordiali saluti',
    attachmentText: 'In allegato trova la fattura del suo soggiorno'
  }
};

export function getMonthName(monthIndex: number, language: Language): string {
  return emailTranslations[language].months[monthIndex];
}

export function getEmailTemplate(language: Language): { subject: string; body: string } {
  return {
    subject: emailTranslations[language].defaultSubject,
    body: emailTranslations[language].defaultBody
  };
}