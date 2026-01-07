/**
 * Store Zustand pour les factures
 * Gère l'état des factures et les opérations CRUD
 */

import { create } from 'zustand';
import { StoredInvoice } from '../services/localStorageService';

interface InvoicesState {
  // État
  invoices: StoredInvoice[];
  filteredInvoices: StoredInvoice[];
  isLoading: boolean;
  error: string | null;

  // Filtres
  searchQuery: string;
  selectedPropertyId: string | null;
  dateFilter: 'all' | 'today' | 'week' | 'month' | 'year';
  startDate: Date | null;
  endDate: Date | null;

  // Actions - État
  setInvoices: (invoices: StoredInvoice[]) => void;
  addInvoice: (invoice: StoredInvoice) => void;
  updateInvoice: (id: string, updates: Partial<StoredInvoice>) => void;
  removeInvoice: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Actions - Filtres
  setSearchQuery: (query: string) => void;
  setSelectedPropertyId: (propertyId: string | null) => void;
  setDateFilter: (filter: 'all' | 'today' | 'week' | 'month' | 'year') => void;
  setDateRange: (startDate: Date | null, endDate: Date | null) => void;
  clearFilters: () => void;
  applyFilters: () => void;

  // Computed
  getTotalAmount: () => number;
  getInvoiceById: (id: string) => StoredInvoice | undefined;
}

const initialFilters = {
  searchQuery: '',
  selectedPropertyId: null,
  dateFilter: 'all' as const,
  startDate: null,
  endDate: null,
};

export const useInvoicesStore = create<InvoicesState>()((set, get) => ({
  // État initial
  invoices: [],
  filteredInvoices: [],
  isLoading: false,
  error: null,
  ...initialFilters,

  // Actions - État
  setInvoices: (invoices) => {
    set({ invoices });
    get().applyFilters();
  },

  addInvoice: (invoice) => {
    set((state) => ({
      invoices: [invoice, ...state.invoices],
    }));
    get().applyFilters();
  },

  updateInvoice: (id, updates) => {
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === id ? { ...inv, ...updates } : inv
      ),
    }));
    get().applyFilters();
  },

  removeInvoice: (id) => {
    set((state) => ({
      invoices: state.invoices.filter((inv) => inv.id !== id),
    }));
    get().applyFilters();
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  // Actions - Filtres
  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    get().applyFilters();
  },

  setSelectedPropertyId: (selectedPropertyId) => {
    set({ selectedPropertyId });
    get().applyFilters();
  },

  setDateFilter: (dateFilter) => {
    set({ dateFilter });
    get().applyFilters();
  },

  setDateRange: (startDate, endDate) => {
    set({ startDate, endDate });
    get().applyFilters();
  },

  clearFilters: () => {
    set(initialFilters);
    get().applyFilters();
  },

  applyFilters: () => {
    const state = get();
    let filtered = [...state.invoices];

    // Filtre par recherche
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter((inv) =>
        inv.data.firstName.toLowerCase().includes(query) ||
        inv.data.lastName.toLowerCase().includes(query) ||
        inv.data.email.toLowerCase().includes(query) ||
        inv.invoiceNumber.toLowerCase().includes(query)
      );
    }

    // Filtre par propriété
    if (state.selectedPropertyId) {
      filtered = filtered.filter(
        (inv) => inv.data.selectedPropertyId === state.selectedPropertyId
      );
    }

    // Filtre par dates
    if (state.startDate) {
      filtered = filtered.filter(
        (inv) => new Date(inv.data.invoiceDate) >= state.startDate!
      );
    }
    if (state.endDate) {
      const endDate = new Date(state.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (inv) => new Date(inv.data.invoiceDate) <= endDate
      );
    }

    set({ filteredInvoices: filtered });
  },

  // Computed
  getTotalAmount: () => {
    const { filteredInvoices } = get();
    return filteredInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  },

  getInvoiceById: (id) => {
    return get().invoices.find((inv) => inv.id === id);
  },
}));

// Sélecteurs
export const selectInvoices = (state: InvoicesState) => state.invoices;
export const selectFilteredInvoices = (state: InvoicesState) => state.filteredInvoices;
export const selectIsLoading = (state: InvoicesState) => state.isLoading;
export const selectTotalAmount = (state: InvoicesState) => state.getTotalAmount();
