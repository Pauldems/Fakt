export interface Extra {
  name: string;
  price: number;
  quantity: number;
  translationKey?: string; // Clé pour traduire les extras prédéfinis
}

export interface InvoiceData {
  firstName: string;
  lastName: string;
  email: string;
  arrivalDate: Date;
  departureDate: Date;
  numberOfNights: number;
  pricePerNight: number;
  taxAmount: number;
  isPlatformCollectingTax: boolean;
  invoiceDate: Date;
  specialRateType?: string; // Ex: "Tarif Genius", "Réservation Booking", etc.
  isClientInvoice: boolean;
  clientInvoiceNumber?: string;
  hasClientAddress: boolean;
  clientAddress?: string;
  clientPostalCode?: string;
  clientCity?: string;
  selectedPropertyId?: string;
  extras?: Extra[];
  paymentMethod?: 'platform' | 'cash' | 'card' | 'transfer' | 'check';
}

export interface InvoiceFormData {
  firstName: string;
  lastName: string;
  email: string;
  arrivalDate: string;
  departureDate: string;
  numberOfNights: string | number;
  pricePerNight: string | number;
  taxAmount: string | number;
  isPlatformCollectingTax: boolean;
  invoiceDate: string;
  invoiceNumber: string;
  specialRateType?: string; // Ex: "Tarif Genius", "Réservation Booking", etc.
  isClientInvoice: boolean;
  clientInvoiceNumber?: string;
  hasClientAddress: boolean;
  clientAddress?: string;
  clientPostalCode?: string;
  clientCity?: string;
  selectedPropertyId?: string;
  extras?: Extra[];
  invoiceLanguage?: 'fr' | 'en' | 'es' | 'de' | 'it';
  emailLanguage?: 'fr' | 'en' | 'es' | 'de' | 'it';
  paymentMethod?: 'platform' | 'cash' | 'card' | 'transfer' | 'check';
}