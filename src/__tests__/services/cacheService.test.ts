/**
 * Tests pour le service de cache
 */

import cacheService, { CACHE_KEYS, CACHE_TTL } from '../../services/cacheService';

describe('CacheService', () => {
  beforeEach(() => {
    // Nettoyer le cache avant chaque test
    cacheService.clear();
  });

  describe('get/set', () => {
    it('should return null for non-existent key', () => {
      const result = cacheService.get('non-existent');
      expect(result).toBeNull();
    });

    it('should store and retrieve a value', () => {
      const testData = { name: 'Test', value: 123 };
      cacheService.set('test-key', testData);

      const result = cacheService.get('test-key');
      expect(result).toEqual(testData);
    });

    it('should return null for expired entries', async () => {
      const testData = { name: 'Test' };
      cacheService.set('test-key', testData, 50); // 50ms TTL

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = cacheService.get('test-key');
      expect(result).toBeNull();
    });

    it('should use default TTL when not specified', () => {
      const testData = { name: 'Test' };
      cacheService.set('test-key', testData);

      // Should still exist immediately
      const result = cacheService.get('test-key');
      expect(result).toEqual(testData);
    });
  });

  describe('has', () => {
    it('should return false for non-existent key', () => {
      expect(cacheService.has('non-existent')).toBe(false);
    });

    it('should return true for existing key', () => {
      cacheService.set('test-key', 'value');
      expect(cacheService.has('test-key')).toBe(true);
    });

    it('should return false for expired key', async () => {
      cacheService.set('test-key', 'value', 50);
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(cacheService.has('test-key')).toBe(false);
    });
  });

  describe('invalidate', () => {
    it('should remove a specific key', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');

      cacheService.invalidate('key1');

      expect(cacheService.get('key1')).toBeNull();
      expect(cacheService.get('key2')).toEqual('value2');
    });
  });

  describe('invalidatePrefix', () => {
    it('should remove all keys with given prefix', () => {
      cacheService.set('user:1', { id: 1 });
      cacheService.set('user:2', { id: 2 });
      cacheService.set('invoice:1', { id: 1 });

      cacheService.invalidatePrefix('user:');

      expect(cacheService.get('user:1')).toBeNull();
      expect(cacheService.get('user:2')).toBeNull();
      expect(cacheService.get('invoice:1')).toEqual({ id: 1 });
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      cacheService.set('key3', 'value3');

      cacheService.clear();

      expect(cacheService.get('key1')).toBeNull();
      expect(cacheService.get('key2')).toBeNull();
      expect(cacheService.get('key3')).toBeNull();
    });
  });

  describe('getOrFetch', () => {
    it('should return cached value if exists', async () => {
      const fetcher = jest.fn().mockResolvedValue('fetched');
      cacheService.set('test-key', 'cached');

      const result = await cacheService.getOrFetch('test-key', fetcher);

      expect(result).toBe('cached');
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should fetch and cache if not in cache', async () => {
      const fetcher = jest.fn().mockResolvedValue('fetched');

      const result = await cacheService.getOrFetch('test-key', fetcher);

      expect(result).toBe('fetched');
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(cacheService.get('test-key')).toBe('fetched');
    });

    it('should force refresh when option is set', async () => {
      const fetcher = jest.fn().mockResolvedValue('new-value');
      cacheService.set('test-key', 'old-value');

      const result = await cacheService.getOrFetch('test-key', fetcher, { forceRefresh: true });

      expect(result).toBe('new-value');
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should use custom TTL when specified', async () => {
      const fetcher = jest.fn().mockResolvedValue('value');

      await cacheService.getOrFetch('test-key', fetcher, { ttl: 100 });

      // Value should exist
      expect(cacheService.get('test-key')).toBe('value');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cacheService.get('test-key')).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return correct stats', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');

      const stats = cacheService.getStats();

      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
    });

    it('should return empty stats after clear', () => {
      cacheService.set('key1', 'value1');
      cacheService.clear();

      const stats = cacheService.getStats();

      expect(stats.size).toBe(0);
      expect(stats.keys).toHaveLength(0);
    });
  });
});

describe('Cache Constants', () => {
  it('should have predefined cache keys', () => {
    expect(CACHE_KEYS.INVOICES).toBe('invoices');
    expect(CACHE_KEYS.CLIENTS).toBe('clients');
    expect(CACHE_KEYS.PROPERTIES).toBe('properties');
    expect(CACHE_KEYS.SETTINGS).toBe('settings');
    expect(CACHE_KEYS.USER_INFO).toBe('user_info');
  });

  it('should have predefined TTL values', () => {
    expect(CACHE_TTL.SHORT).toBe(60000);      // 1 minute
    expect(CACHE_TTL.MEDIUM).toBe(300000);    // 5 minutes
    expect(CACHE_TTL.LONG).toBe(900000);      // 15 minutes
    expect(CACHE_TTL.VERY_LONG).toBe(3600000); // 1 hour
  });
});
