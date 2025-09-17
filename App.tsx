import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TabNavigator } from './src/navigation/TabNavigator';
import { StorageService } from './src/services/storageService';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ActivationScreen } from './src/features/activation/ActivationScreen';

function AppContent() {
  const { isLoading, isActivated } = useAuth();

  useEffect(() => {
    // Initialiser le service de stockage
    StorageService.init();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003580" />
      </View>
    );
  }

  // Si l'app n'est pas activée, afficher l'écran d'activation
  if (!isActivated) {
    return <ActivationScreen onActivationSuccess={() => {}} />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#667eea" />
      <TabNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});
