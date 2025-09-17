import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import activationService, { ActivationData } from '../services/activationService';

interface AuthContextType {
  activationData: ActivationData | null;
  isLoading: boolean;
  isActivated: boolean;
  resetApp: () => Promise<void>;
  refreshActivation: () => Promise<void>;
  pausePeriodicCheck: () => void;
  resumePeriodicCheck: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activationData, setActivationData] = useState<ActivationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    checkActivationStatus();
    startPeriodicCheck();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const startPeriodicCheck = () => {
    // Vérification périodique toutes les 30 secondes (pour contrôle à distance)
    const interval = setInterval(() => {
      console.log('⏰ Timer périodique - isPaused:', isPausedRef.current);
      if (!isPausedRef.current) {
        console.log('🔄 Vérification périodique de l\'activation...');
        checkActivationStatus();
      } else {
        console.log('⏸️ Vérification périodique en pause');
      }
    }, 30000); // 30 secondes

    setIntervalId(interval);
  };

  const checkActivationStatus = async () => {
    console.log('🔍 Vérification du statut d\'activation...');
    setIsLoading(true);
    try {
      const isActivated = await activationService.isAppActivated();
      console.log('📊 App activée:', isActivated);
      if (isActivated) {
        const data = await activationService.getActivationData();
        console.log('📋 Données d\'activation:', data);
        setActivationData(data);
      } else {
        console.log('❌ Aucune activation trouvée');
        setActivationData(null);
      }
    } catch (error) {
      console.error('💥 Erreur lors de la vérification d\'activation:', error);
      setActivationData(null);
    } finally {
      setIsLoading(false);
      console.log('✅ Vérification terminée, isLoading = false');
    }
  };

  const isActivated = !!activationData;

  const resetApp = async () => {
    await activationService.resetActivation();
    setActivationData(null);
  };

  const refreshActivation = async () => {
    console.log('🔄 Rechargement de l\'état d\'activation...');
    await checkActivationStatus();
  };

  const pausePeriodicCheck = () => {
    console.log('⏸️ APPEL pausePeriodicCheck() - Pause des vérifications périodiques');
    isPausedRef.current = true;
    console.log('⏸️ isPaused maintenant:', isPausedRef.current);
  };

  const resumePeriodicCheck = () => {
    console.log('▶️ APPEL resumePeriodicCheck() - Reprise des vérifications périodiques');
    isPausedRef.current = false;
    console.log('▶️ isPaused maintenant:', isPausedRef.current);
  };

  return (
    <AuthContext.Provider
      value={{
        activationData,
        isLoading,
        isActivated,
        resetApp,
        refreshActivation,
        pausePeriodicCheck,
        resumePeriodicCheck,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};