import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TabNavigator } from './src/navigation/TabNavigator';
import { StorageService } from './src/services/storageService';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ActivationScreen } from './src/features/activation/ActivationScreen';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import errorService from './src/services/errorService';
import pdfCacheService from './src/services/pdfCacheService';
import { serviceRegistry } from './src/services/serviceRegistry';

// Initialiser les services au démarrage
errorService.init();
pdfCacheService.init();

// Initialiser le registre de services (async, en arrière-plan)
serviceRegistry.initialize().catch(err => {
  console.error('Erreur initialisation service registry:', err);
});

function AppContent() {
  const { isLoading, isActivated } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    // Initialiser le service de stockage
    StorageService.init();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background.primary }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Si l'app n'est pas activée, afficher l'écran d'activation
  if (!isActivated) {
    return <ActivationScreen onActivationSuccess={() => {}} />;
  }

  return (
    <NavigationContainer>
      <StatusBar 
        style="light" 
        backgroundColor={theme.gradients.header[0]} 
      />
      <TabNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
