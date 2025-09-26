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
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
