/**
 * Store Zustand pour les paramètres de l'application
 * Gère les settings utilisateur, propriétés, et préférences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PropertyTemplate, OwnerSettings } from '../features/settings/SettingsScreen';

interface SettingsState {
  // État
  settings: OwnerSettings | null;
  properties: PropertyTemplate[];
  selectedTemplate: 'modern' | 'classic' | 'minimal' | 'original';
  invoiceNumberFormat: string;
  isLoading: boolean;

  // Actions
  setSettings: (settings: OwnerSettings) => void;
  setProperties: (properties: PropertyTemplate[]) => void;
  addProperty: (property: PropertyTemplate) => void;
  updateProperty: (id: string, updates: Partial<PropertyTemplate>) => void;
  deleteProperty: (id: string) => void;
  setSelectedTemplate: (template: 'modern' | 'classic' | 'minimal' | 'original') => void;
  setInvoiceNumberFormat: (format: string) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  settings: null,
  properties: [],
  selectedTemplate: 'modern' as const,
  invoiceNumberFormat: 'FACT-{ANNEE}-{MOIS}-{N}',
  isLoading: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSettings: (settings) => set({
        settings,
        properties: settings.propertyTemplates || [],
        selectedTemplate: settings.selectedTemplate || 'modern',
        invoiceNumberFormat: settings.invoiceNumberFormat || 'FACT-{ANNEE}-{MOIS}-{N}',
      }),

      setProperties: (properties) => set({ properties }),

      addProperty: (property) => set((state) => ({
        properties: [...state.properties, property],
      })),

      updateProperty: (id, updates) => set((state) => ({
        properties: state.properties.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      })),

      deleteProperty: (id) => set((state) => ({
        properties: state.properties.filter((p) => p.id !== id),
      })),

      setSelectedTemplate: (template) => set({ selectedTemplate: template }),

      setInvoiceNumberFormat: (format) => set({ invoiceNumberFormat: format }),

      setLoading: (isLoading) => set({ isLoading }),

      reset: () => set(initialState),
    }),
    {
      name: 'fakt-settings-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        selectedTemplate: state.selectedTemplate,
        invoiceNumberFormat: state.invoiceNumberFormat,
      }),
    }
  )
);

// Sélecteurs pour optimiser les re-renders
export const selectProperties = (state: SettingsState) => state.properties;
export const selectSelectedTemplate = (state: SettingsState) => state.selectedTemplate;
export const selectInvoiceNumberFormat = (state: SettingsState) => state.invoiceNumberFormat;
