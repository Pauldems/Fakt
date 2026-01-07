/**
 * Service de cache en mémoire avec TTL (Time To Live)
 * Évite les rechargements inutiles lors de la navigation
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheConfig {
  defaultTTL: number; // en millisecondes
}

const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes par défaut
};

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Récupère une valeur du cache si elle existe et n'est pas expirée
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Stocke une valeur dans le cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.config.defaultTTL,
    });
  }

  /**
   * Récupère une valeur du cache ou exécute la fonction pour la récupérer
   * Pattern "stale-while-revalidate" simplifié
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: { ttl?: number; forceRefresh?: boolean }
  ): Promise<T> {
    const { ttl, forceRefresh = false } = options || {};

    // Si pas de forceRefresh, vérifier le cache
    if (!forceRefresh) {
      const cached = this.get<T>(key);
      if (cached !== null) {
        console.log(`[Cache] HIT: ${key}`);
        return cached;
      }
    }

    // Sinon, récupérer les données
    console.log(`[Cache] MISS: ${key} - Fetching...`);
    const data = await fetchFn();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Invalide une entrée du cache
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    console.log(`[Cache] Invalidated: ${key}`);
  }

  /**
   * Invalide toutes les entrées qui commencent par un préfixe
   */
  invalidatePrefix(prefix: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`[Cache] Invalidated ${keysToDelete.length} entries with prefix: ${prefix}`);
  }

  /**
   * Vide tout le cache
   */
  clear(): void {
    this.cache.clear();
    console.log('[Cache] Cleared all entries');
  }

  /**
   * Vérifie si une clé existe et n'est pas expirée
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Retourne les statistiques du cache
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Instance singleton
const cacheService = new CacheService();

// Clés de cache prédéfinies
export const CACHE_KEYS = {
  INVOICES: 'invoices',
  CLIENTS: 'clients',
  PROPERTIES: 'properties',
  SETTINGS: 'settings',
  USER_INFO: 'user_info',
} as const;

// TTL prédéfinis (en ms)
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 15 * 60 * 1000,      // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 heure
} as const;

export default cacheService;
