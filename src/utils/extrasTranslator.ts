import { Extra } from '../types/invoice';
import { getInvoiceTranslation, Language } from './invoiceTranslations';

export const translateExtra = (extra: Extra, language: Language): string => {
  // Si l'extra a une clé de traduction, l'utiliser
  if (extra.translationKey) {
    const translations = getInvoiceTranslation(language);
    switch (extra.translationKey) {
      case 'cleaning':
        return translations.cleaning;
      case 'breakfast':
        return translations.breakfast;
      case 'linens':
        return translations.linens;
      case 'parking':
        return translations.parking;
      case 'airportTransfer':
        return translations.airportTransfer;
      default:
        return extra.name;
    }
  }
  
  // Sinon, retourner le nom tel quel (pour les extras personnalisés)
  return extra.name;
};

export const translateExtras = (extras: Extra[], language: Language): Extra[] => {
  return extras.map(extra => ({
    ...extra,
    name: translateExtra(extra, language)
  }));
};