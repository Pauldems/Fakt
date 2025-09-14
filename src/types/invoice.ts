export interface InvoiceData {
  firstName: string;
  lastName: string;
  email: string;
  arrivalDate: Date;
  departureDate: Date;
  numberOfNights: number;
  pricePerNight: number;
  taxAmount: number;
  invoiceDate: Date;
  isGeniusRate: boolean;
  isBookingReservation: boolean;
  bookingNumber?: string;
  isClientInvoice: boolean;
  clientInvoiceNumber?: string;
  hasClientAddress: boolean;
  clientAddress?: string;
  clientPostalCode?: string;
  clientCity?: string;
  selectedPropertyId?: string;
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
  invoiceDate: string;
  invoiceNumber: string;
  isGeniusRate: boolean;
  isBookingReservation: boolean;
  bookingNumber?: string;
  isClientInvoice: boolean;
  clientInvoiceNumber?: string;
  hasClientAddress: boolean;
  clientAddress?: string;
  clientPostalCode?: string;
  clientCity?: string;
  selectedPropertyId?: string;
}