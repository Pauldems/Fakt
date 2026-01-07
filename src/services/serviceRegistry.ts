/**
 * Registre de services pour l'injection de dépendances
 *
 * Usage:
 * - En production : services.invoiceStorage.getInvoices()
 * - En test : services.register('invoiceStorage', mockService)
 */

import {
  IServiceRegistry,
  IInvoiceStorageService,
  IHybridInvoiceService,
  IClientService,
  ICacheService,
  IPDFCacheService,
  IGoogleDriveService,
  IUserDataService,
  ILoggerService,
  IErrorService,
  IInvoiceCounterService,
} from '../interfaces/services';

type ServiceKey = keyof IServiceRegistry;
type ServiceType<K extends ServiceKey> = IServiceRegistry[K];

class ServiceRegistry {
  private services: Partial<IServiceRegistry> = {};
  private initialized = false;

  /**
   * Initialise le registre avec les services par défaut
   * Appelé une seule fois au démarrage de l'app
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Import dynamique pour éviter les dépendances circulaires
    const { LocalStorageService } = await import('./localStorageService');
    const hybridInvoiceService = (await import('./hybridInvoiceService')).default;
    const hybridClientService = (await import('./hybridClientService')).default;
    const cacheService = (await import('./cacheService')).default;
    const pdfCacheService = (await import('./pdfCacheService')).default;
    const googleDriveService = (await import('./googleDriveService')).default;
    const userDataService = (await import('./userDataService')).default;
    const logger = (await import('../utils/logger')).default;
    const errorService = (await import('./errorService')).default;
    const invoiceCounterService = (await import('./invoiceCounterService')).default;

    // Enregistrer les services par défaut
    // Note: LocalStorageService est une classe avec méthodes statiques, on crée un wrapper
    this.services.invoiceStorage = {
      init: () => LocalStorageService.init(),
      saveInvoice: (data, num) => LocalStorageService.saveInvoice(data, num),
      getInvoices: () => LocalStorageService.getInvoices(),
      deleteInvoice: (id) => LocalStorageService.deleteInvoice(id),
      clearAll: () => LocalStorageService.clearAll(),
    };

    this.services.hybridInvoice = hybridInvoiceService;
    this.services.clients = hybridClientService;
    this.services.cache = cacheService;
    this.services.pdfCache = pdfCacheService;
    this.services.googleDrive = googleDriveService;
    this.services.userData = userDataService;
    this.services.logger = logger;
    this.services.errors = errorService;
    this.services.invoiceCounter = invoiceCounterService;

    this.initialized = true;
  }

  /**
   * Récupère un service par sa clé
   */
  get<K extends ServiceKey>(key: K): ServiceType<K> {
    const service = this.services[key];
    if (!service) {
      throw new Error(`Service "${key}" non enregistré. Appelez initialize() d'abord.`);
    }
    return service as ServiceType<K>;
  }

  /**
   * Enregistre un service (ou le remplace)
   * Utile pour les tests ou pour remplacer une implémentation
   */
  register<K extends ServiceKey>(key: K, service: ServiceType<K>): void {
    this.services[key] = service;
  }

  /**
   * Vérifie si un service est enregistré
   */
  has(key: ServiceKey): boolean {
    return key in this.services && this.services[key] !== undefined;
  }

  /**
   * Réinitialise le registre (utile pour les tests)
   */
  reset(): void {
    this.services = {};
    this.initialized = false;
  }

  /**
   * Remplace temporairement un service et retourne une fonction de restauration
   * Utile pour les tests
   */
  mock<K extends ServiceKey>(
    key: K,
    mockService: Partial<ServiceType<K>>
  ): () => void {
    const original = this.services[key];

    // Créer un service qui utilise le mock pour les méthodes définies
    // et l'original pour les autres
    const merged = {
      ...original,
      ...mockService,
    } as ServiceType<K>;

    this.services[key] = merged;

    // Retourner une fonction pour restaurer l'original
    return () => {
      this.services[key] = original;
    };
  }
}

// Export d'une instance singleton
export const serviceRegistry = new ServiceRegistry();

// Export des getters typés pour un accès facile
export const services = {
  get invoiceStorage(): IInvoiceStorageService {
    return serviceRegistry.get('invoiceStorage');
  },
  get hybridInvoice(): IHybridInvoiceService {
    return serviceRegistry.get('hybridInvoice');
  },
  get clients(): IClientService {
    return serviceRegistry.get('clients');
  },
  get cache(): ICacheService {
    return serviceRegistry.get('cache');
  },
  get pdfCache(): IPDFCacheService {
    return serviceRegistry.get('pdfCache');
  },
  get googleDrive(): IGoogleDriveService {
    return serviceRegistry.get('googleDrive');
  },
  get userData(): IUserDataService {
    return serviceRegistry.get('userData');
  },
  get logger(): ILoggerService {
    return serviceRegistry.get('logger');
  },
  get errors(): IErrorService {
    return serviceRegistry.get('errors');
  },
  get invoiceCounter(): IInvoiceCounterService {
    return serviceRegistry.get('invoiceCounter');
  },
};

export default serviceRegistry;
