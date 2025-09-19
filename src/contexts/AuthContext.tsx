import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import activationService, { ActivationData } from '../services/activationService';

interface AuthContextType {
  activationData: ActivationData | null;
  isLoading: boolean;
  isActivated: boolean;
  resetApp: () => Promise<void>;
  refreshActivation: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activationData, setActivationData] = useState<ActivationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkActivationStatus();
    // Plus de vérification périodique
  }, []);

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
        // Ne réinitialise l'activation que si elle était déjà nulle
        // Pour éviter de déconnecter l'utilisateur en cas d'erreur temporaire
        if (activationData === null) {
          setActivationData(null);
        }
      }
    } catch (error) {
      console.error('💥 Erreur lors de la vérification d\'activation:', error);
      // En cas d'erreur, ne pas réinitialiser si déjà activé
      // Garde l'état actuel pour éviter les déconnexions intempestives
      if (activationData === null) {
        setActivationData(null);
      }
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


  return (
    <AuthContext.Provider
      value={{
        activationData,
        isLoading,
        isActivated,
        resetApp,
        refreshActivation,
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