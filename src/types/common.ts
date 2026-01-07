/**
 * Types communs utilisés à travers l'application
 */

// Type pour les erreurs Firebase/génériques
export interface AppError extends Error {
  code?: string;
  details?: unknown;
}

// Type pour les réponses de services
export interface ServiceResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Type pour les documents Firestore
export interface FirestoreDocument {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Type pour les données utilisateur Firebase
export interface FirebaseUserData {
  deviceId: string;
  name?: string;
  email?: string;
  activationCode?: string;
  activationType?: string;
  activatedAt?: Date;
  expiresAt?: Date | null;
}

// Type pour les paramètres de l'application
export interface AppSettings {
  propertyTemplates?: PropertyTemplate[];
  ownerInfo?: OwnerInfo;
  taxRate?: number;
  currency?: string;
  language?: SupportedLanguage;
}

// Type pour les propriétés
export interface PropertyTemplate {
  id: string;
  name: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  siret?: string;
  tvaNumber?: string;
  iban?: string;
  bic?: string;
  taxRate?: number;
}

// Type pour les informations du propriétaire
export interface OwnerInfo {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  siret?: string;
  tvaNumber?: string;
}

// Type pour les clients
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Type pour les langues supportées
export type SupportedLanguage = 'fr' | 'en' | 'es' | 'de' | 'it';

// Type pour les méthodes de paiement
export type PaymentMethod = 'platform' | 'cash' | 'card' | 'transfer' | 'check';

// Type pour les types d'activation
export type ActivationType = 'trial' | 'monthly' | 'quarterly' | 'annual' | 'lifetime';

// Type pour le statut des codes d'activation
export type ActivationCodeStatus = 'unused' | 'used' | 'disabled';

// Type générique pour les handlers d'événements
export type EventHandler<T = void> = (event: T) => void;

// Type pour les fonctions async avec erreur
export type AsyncFunction<T = void> = () => Promise<T>;

// Type pour les callbacks de navigation
export type NavigationCallback = () => void;

// Type pour les objets avec clés string
export type StringRecord<T = unknown> = Record<string, T>;

// Type pour les timestamps Firebase
export interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
}

// Type guard pour vérifier si c'est un FirebaseTimestamp
export function isFirebaseTimestamp(value: unknown): value is FirebaseTimestamp {
  return (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    'nanoseconds' in value &&
    typeof (value as FirebaseTimestamp).toDate === 'function'
  );
}

// Type pour convertir les dates Firebase en Date JS
export function toJSDate(value: Date | FirebaseTimestamp | string | undefined): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (isFirebaseTimestamp(value)) return value.toDate();
  return undefined;
}
