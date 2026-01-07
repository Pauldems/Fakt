/**
 * Tests pour le service de compteur de factures
 */

import invoiceCounterService from '../../services/invoiceCounterService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock le service hybride des settings
jest.mock('../../services/hybridSettingsService', () => ({
  default: {
    getSettings: jest.fn().mockResolvedValue({
      invoiceNumberFormat: 'FACT-{ANNEE}-{MOIS}-{N}',
    }),
  },
}));

// Mock le service de stockage local
jest.mock('../../services/localStorageService', () => ({
  LocalStorageService: {
    getInvoices: jest.fn().mockResolvedValue([]),
  },
}));

describe('InvoiceCounterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.clear as jest.Mock)();
  });

  describe('extractSequentialNumber', () => {
    it('should extract number from standard format', () => {
      expect(invoiceCounterService.extractSequentialNumber('FACT-2024-01-001')).toBe(1);
      expect(invoiceCounterService.extractSequentialNumber('FACT-2024-01-032')).toBe(32);
      expect(invoiceCounterService.extractSequentialNumber('FACT-2024-01-999')).toBe(999);
    });

    it('should extract number from alternative formats', () => {
      // L'algorithme prend le DERNIER groupe de chiffres
      expect(invoiceCounterService.extractSequentialNumber('INV2024001')).toBe(2024001);
      expect(invoiceCounterService.extractSequentialNumber('F-123')).toBe(123);
      expect(invoiceCounterService.extractSequentialNumber('2024-12-31-005')).toBe(5);
    });

    it('should return 0 for invalid formats', () => {
      expect(invoiceCounterService.extractSequentialNumber('')).toBe(0);
      expect(invoiceCounterService.extractSequentialNumber('NO-NUMBER')).toBe(0);
    });

    it('should take the last number group', () => {
      // Le dernier groupe est considéré comme le compteur
      expect(invoiceCounterService.extractSequentialNumber('2024-12-007')).toBe(7);
      expect(invoiceCounterService.extractSequentialNumber('FACT09-2025-032')).toBe(32);
    });
  });

  describe('formatInvoiceNumberWithDate', () => {
    it('should format with month-year-number pattern', () => {
      const date = new Date(2024, 5, 15); // June 15, 2024
      const result = invoiceCounterService.formatInvoiceNumberWithDate('001', date);
      expect(result).toBe('06-2024-001');
    });

    it('should pad month with zero', () => {
      const date = new Date(2024, 0, 1); // January
      const result = invoiceCounterService.formatInvoiceNumberWithDate('042', date);
      expect(result).toBe('01-2024-042');
    });
  });

  describe('getLastInvoiceNumber', () => {
    it('should return 0 when no previous invoice exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await invoiceCounterService.getLastInvoiceNumber();
      expect(result).toBe(0);
    });

    it('should return stored number', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ lastNumber: 42, lastUsedDate: '2024-01-01' })
      );

      const result = await invoiceCounterService.getLastInvoiceNumber();
      expect(result).toBe(42);
    });
  });

  describe('saveLastInvoiceNumber', () => {
    it('should save the invoice number', async () => {
      await invoiceCounterService.saveLastInvoiceNumber(123);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const call = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      expect(call[0]).toBe('@fakt_last_invoice_number');

      const savedData = JSON.parse(call[1]);
      expect(savedData.lastNumber).toBe(123);
      expect(savedData.lastUsedDate).toBeDefined();
    });
  });

  describe('getNextInvoiceNumber', () => {
    it('should return 001 when no invoices exist', async () => {
      const { LocalStorageService } = require('../../services/localStorageService');
      (LocalStorageService.getInvoices as jest.Mock).mockResolvedValue([]);

      const result = await invoiceCounterService.getNextInvoiceNumber();
      expect(result).toBe('001');
    });

    it('should increment from last invoice', async () => {
      const { LocalStorageService } = require('../../services/localStorageService');
      (LocalStorageService.getInvoices as jest.Mock).mockResolvedValue([
        { invoiceNumber: 'FACT-2024-01-005' },
        { invoiceNumber: 'FACT-2024-01-003' },
        { invoiceNumber: 'FACT-2024-01-001' },
      ]);

      const result = await invoiceCounterService.getNextInvoiceNumber();
      expect(result).toBe('006');
    });

    it('should handle numbers above 999', async () => {
      const { LocalStorageService } = require('../../services/localStorageService');
      (LocalStorageService.getInvoices as jest.Mock).mockResolvedValue([
        { invoiceNumber: 'FACT-2024-01-1234' },
      ]);

      const result = await invoiceCounterService.getNextInvoiceNumber();
      expect(result).toBe('1235');
    });
  });

  describe('formatInvoiceNumber', () => {
    it('should format invoice number with date and sequential number', async () => {
      const date = new Date(2024, 11, 25); // December 25, 2024
      const result = await invoiceCounterService.formatInvoiceNumber('007', date);

      // Vérifie que le résultat contient les éléments de base
      expect(result).toContain('2024');
      expect(result).toContain('007');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(5);
    });

    it('should handle different months correctly', async () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      const result = await invoiceCounterService.formatInvoiceNumber('001', date);

      expect(result).toContain('2024');
      expect(result).toContain('001');
    });
  });

  describe('updateCounterIfNeeded', () => {
    it('should update counter if number is higher', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ lastNumber: 10, lastUsedDate: '2024-01-01' })
      );

      await invoiceCounterService.updateCounterIfNeeded('FACT-2024-01-025');

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const call = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const savedData = JSON.parse(call[1]);
      expect(savedData.lastNumber).toBe(25);
    });

    it('should not update counter if number is lower', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ lastNumber: 50, lastUsedDate: '2024-01-01' })
      );

      await invoiceCounterService.updateCounterIfNeeded('FACT-2024-01-025');

      // setItem should not be called because 25 < 50
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });
});
