/**
 * Interfaces pour les services de l'application
 * Permet le découplage, les tests (mocking) et la documentation des contrats
 */

import { InvoiceData, InvoiceFormData } from '../types/invoice';
import { StoredInvoice } from '../services/localStorageService';
import { Client } from '../services/clientService';
import { PropertyTemplate } from '../types/common';
import { OwnerSettings } from '../features/settings/SettingsScreen';

// ============ STORAGE INTERFACES ============

/**
 * Interface pour le service de stockage des factures
 */
export interface IInvoiceStorageService {
  init(): Promise<void>;
  saveInvoice(invoiceData: InvoiceData, invoiceNumber?: string): Promise<StoredInvoice>;
  getInvoices(): Promise<StoredInvoice[]>;
  deleteInvoice(id: string): Promise<void>;
  clearAll(): Promise<void>;
}

/**
 * Interface pour le service hybride de factures (local + cloud)
 */
export interface IHybridInvoiceService {
  getInvoices(): Promise<StoredInvoice[]>;
  saveInvoice(
    invoiceData: InvoiceData,
    invoiceNumber: string,
    language?: 'fr' | 'en' | 'es' | 'de' | 'it'
  ): Promise<StoredInvoice>;
  deleteInvoice(invoiceId: string): Promise<void>;
  syncWithFirebase(): Promise<void>;
}

/**
 * Données pour créer/mettre à jour un client
 */
export type ClientInput = Omit<Client, 'id' | 'lastUsed'>;

/**
 * Interface pour le service de clients
 */
export interface IClientService {
  getClients(): Promise<Client[]>;
  saveClient(client: ClientInput): Promise<void>;
  saveClientFromInvoice(invoiceData: InvoiceFormData): Promise<void>;
  deleteClient(clientId: string): Promise<void>;
}

// ============ CACHE INTERFACES ============

/**
 * Options pour le cache
 */
export interface CacheOptions {
  ttl?: number;
  forceRefresh?: boolean;
}

/**
 * Statistiques du cache
 */
export interface CacheStats {
  size: number;
  keys: string[];
}

/**
 * Interface pour le service de cache
 */
export interface ICacheService {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T, ttl?: number): void;
  getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T>;
  invalidate(key: string): void;
  invalidatePrefix(prefix: string): void;
  clear(): void;
  has(key: string): boolean;
  getStats(): CacheStats;
}

// ============ PDF INTERFACES ============

/**
 * Résultat de la récupération d'un PDF
 */
export interface PDFCacheResult {
  pdfUri: string;
  wasRegenerated: boolean;
}

/**
 * Statistiques de validation des PDFs
 */
export interface PDFValidationStats {
  valid: number;
  missing: number;
  repaired: number;
}

/**
 * Interface pour le service de cache PDF
 */
export interface IPDFCacheService {
  init(): Promise<void>;
  getPDF(invoice: StoredInvoice): Promise<PDFCacheResult>;
  forceRegenerate(invoice: StoredInvoice): Promise<string>;
  validateAllPDFs(invoices: StoredInvoice[]): Promise<PDFValidationStats>;
  cleanupOrphanedPDFs(invoices: StoredInvoice[]): Promise<number>;
}

// ============ CLOUD INTERFACES ============

/**
 * Information utilisateur Google
 */
export interface GoogleUser {
  email: string;
  name: string;
  picture?: string;
}

/**
 * Interface pour le service Google Drive
 */
export interface IGoogleDriveService {
  init(): Promise<void>;
  isConnected(): boolean;
  isTokenExpired(): boolean;
  getTokenRemainingTime(): number | null;
  authenticate(): Promise<boolean>;
  disconnect(): Promise<void>;
  getUserInfo(): Promise<GoogleUser | null>;
  getSavedUserInfo(): Promise<GoogleUser | null>;
  syncInvoice(pdfPath: string, invoiceNumber: string, propertyName?: string): Promise<boolean>;
  setTokenExpiredCallback(callback: (() => void) | null): void;
}

/**
 * Interface pour le service de données utilisateur (Firebase)
 */
export interface IUserDataService {
  getUserId(): Promise<string | null>;
  isUserConnected(): Promise<boolean>;
  // Settings
  saveUserSettings(settings: OwnerSettings): Promise<void>;
  getUserSettings(): Promise<OwnerSettings | null>;
  // Invoices
  getInvoices(): Promise<Array<Record<string, unknown>>>;
  saveInvoice(invoice: Record<string, unknown>): Promise<string>;
  // Clients
  getClients(): Promise<Client[]>;
  saveClient(client: Client): Promise<void>;
  deleteClient(clientId: string): Promise<void>;
  // Counters
  getNextInvoiceNumber(): Promise<string>;
  // Sync
  migrateLocalDataToFirebase(): Promise<void>;
  syncWithFirebase(): Promise<void>;
}

// ============ UTILITY INTERFACES ============

/**
 * Niveau de log
 */
export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

/**
 * Interface pour le service de logging
 */
export interface ILoggerService {
  log(...args: unknown[]): void;
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  group(label: string): void;
  groupEnd(): void;
  time(label: string): void;
  timeEnd(label: string): void;
}

/**
 * Contexte d'erreur pour le reporting
 */
export interface ErrorContext {
  screen?: string;
  action?: string;
  userId?: string;
  extra?: Record<string, unknown>;
}

/**
 * Niveau de sévérité pour Sentry
 */
export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

/**
 * Interface pour le service d'erreurs
 */
export interface IErrorService {
  init(): void;
  captureException(error: Error, context?: ErrorContext): void;
  captureMessage(message: string, level?: SeverityLevel, context?: ErrorContext): void;
  setUser(userId: string, email?: string, name?: string): void;
  clearUser(): void;
  addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void;
  wrapAsync<T>(fn: () => Promise<T>, context?: ErrorContext): Promise<T | null>;
}

/**
 * Interface pour le service de compteur de factures
 */
export interface IInvoiceCounterService {
  getNextInvoiceNumber(): Promise<string>;
  formatInvoiceNumber(sequentialNumber: string, date: Date): Promise<string>;
  saveLastInvoiceNumber(number: number): Promise<void>;
  getLastInvoiceNumber(): Promise<number>;
  getCurrentInvoiceNumber(): Promise<string | null>;
  extractSequentialNumber(invoiceNumber: string): number;
  updateCounterIfNeeded(invoiceNumber: string): Promise<void>;
}

// ============ SERVICE REGISTRY ============

/**
 * Registre des services pour l'injection de dépendances
 * Permet de remplacer facilement les implémentations (tests, etc.)
 */
export interface IServiceRegistry {
  invoiceStorage: IInvoiceStorageService;
  hybridInvoice: IHybridInvoiceService;
  clients: IClientService;
  cache: ICacheService;
  pdfCache: IPDFCacheService;
  googleDrive: IGoogleDriveService;
  userData: IUserDataService;
  logger: ILoggerService;
  errors: IErrorService;
  invoiceCounter: IInvoiceCounterService;
}

/**
 * Type pour un service partiellement configuré (utile pour les tests)
 */
export type PartialServiceRegistry = Partial<IServiceRegistry>;
