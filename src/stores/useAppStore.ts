/**
 * Store Zustand pour l'état global de l'application
 * Gère l'authentification, activation, et état de connexion
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  // Activation
  isActivated: boolean;
  activationCode: string | null;
  deviceId: string | null;

  // Connexion
  isGoogleDriveConnected: boolean;
  googleDriveEmail: string | null;

  // UI State
  isOnboarded: boolean;
  lastSyncDate: Date | null;

  // Actions
  setActivated: (isActivated: boolean, code?: string, deviceId?: string) => void;
  setGoogleDriveConnected: (connected: boolean, email?: string | null) => void;
  setOnboarded: (onboarded: boolean) => void;
  setLastSyncDate: (date: Date | null) => void;
  reset: () => void;
}

const initialState = {
  isActivated: false,
  activationCode: null,
  deviceId: null,
  isGoogleDriveConnected: false,
  googleDriveEmail: null,
  isOnboarded: false,
  lastSyncDate: null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setActivated: (isActivated, code, deviceId) => set({
        isActivated,
        activationCode: code || null,
        deviceId: deviceId || null,
      }),

      setGoogleDriveConnected: (connected, email) => set({
        isGoogleDriveConnected: connected,
        googleDriveEmail: email || null,
      }),

      setOnboarded: (isOnboarded) => set({ isOnboarded }),

      setLastSyncDate: (lastSyncDate) => set({ lastSyncDate }),

      reset: () => set(initialState),
    }),
    {
      name: 'fakt-app-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isOnboarded: state.isOnboarded,
        // Note: isActivated est géré par AuthContext, pas persisté ici
      }),
    }
  )
);

// Sélecteurs
export const selectIsActivated = (state: AppState) => state.isActivated;
export const selectIsGoogleDriveConnected = (state: AppState) => state.isGoogleDriveConnected;
export const selectGoogleDriveEmail = (state: AppState) => state.googleDriveEmail;
