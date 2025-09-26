import { SUPPORTED_CURRENCIES } from '../features/settings/SettingsScreen';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

/**
 * Récupère les informations d'une devise par son code
 */
export const getCurrencyInfo = (currencyCode: string): CurrencyInfo => {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency || SUPPORTED_CURRENCIES[0]; // Default to EUR
};

/**
 * Formate un montant selon la devise
 */
export const formatPrice = (amount: number, currencyCode: string): string => {
  const currency = getCurrencyInfo(currencyCode);
  
  // Formatage selon la devise
  switch (currencyCode) {
    case 'USD':
    case 'CAD':
    case 'AUD':
      return `${currency.symbol}${amount.toFixed(2)}`;
    
    case 'GBP':
      return `${currency.symbol}${amount.toFixed(2)}`;
    
    case 'JPY':
      return `${currency.symbol}${Math.round(amount)}`;
    
    case 'CHF':
      return `${amount.toFixed(2)} ${currency.symbol}`;
    
    case 'NOK':
    case 'SEK':
    case 'DKK':
      return `${amount.toFixed(2)} ${currency.symbol}`;
    
    case 'EUR':
    default:
      return `${amount.toFixed(2)} ${currency.symbol}`;
  }
};

/**
 * Récupère le symbole de devise pour affichage
 */
export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = getCurrencyInfo(currencyCode);
  return currency.symbol;
};