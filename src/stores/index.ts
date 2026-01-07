/**
 * Export central des stores Zustand
 *
 * Usage:
 * import { useInvoicesStore, useSettingsStore, useAppStore } from '@/stores';
 *
 * // Dans un composant
 * const invoices = useInvoicesStore((state) => state.invoices);
 * const { setSearchQuery } = useInvoicesStore();
 */

export { useSettingsStore, selectProperties, selectSelectedTemplate, selectInvoiceNumberFormat } from './useSettingsStore';

export { useInvoicesStore, selectInvoices, selectFilteredInvoices, selectIsLoading, selectTotalAmount } from './useInvoicesStore';

export { useAppStore, selectIsActivated, selectIsGoogleDriveConnected, selectGoogleDriveEmail } from './useAppStore';
