import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import googleDriveService from '../../services/googleDriveService';

export const GoogleDriveSection: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    await googleDriveService.init();
    const connected = googleDriveService.isConnected();
    setIsConnected(connected);
    
    if (connected) {
      const user = await googleDriveService.getSavedUserInfo();
      setUserInfo(user);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const success = await googleDriveService.authenticate();
      if (success) {
        setIsConnected(true);
        const user = await googleDriveService.getSavedUserInfo();
        setUserInfo(user);
        Alert.alert('✅ Succès', 'Connexion à Google Drive réussie !');
      } else {
        // Informer l'utilisateur de la limitation Expo Go
        Alert.alert(
          '⚠️ Limitation Expo Go',
          'L\'authentification Google Drive ne fonctionne pas parfaitement avec Expo Go.\n\n' +
          'Alternatives :\n' +
          '• Sauvegarder les PDFs localement\n' +
          '• Les envoyer par email\n' +
          '• Utiliser l\'app finale (pas Expo Go)\n\n' +
          'Souhaitez-vous continuer sans Google Drive ?',
          [
            { text: 'Continuer sans Drive', style: 'default' },
            { text: 'Réessayer', onPress: () => handleConnect() }
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        '❌ Erreur d\'authentification',
        'Problème avec Expo Go et Google OAuth.\n\n' +
        'L\'authentification Google Drive sera disponible dans la version finale de l\'app.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Déconnexion Google Drive',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            await googleDriveService.disconnect();
            setIsConnected(false);
            setUserInfo(null);
            Alert.alert('✅', 'Déconnexion réussie');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="cloud-outline" size={24} color="#0056b3" />
        <Text style={styles.title}>Google Drive</Text>
      </View>

      <Text style={styles.description}>
        Sauvegardez automatiquement vos factures dans Google Drive, 
        organisées par propriété pour une meilleure traçabilité.
      </Text>

      <View style={styles.warningBox}>
        <Ionicons name="information-circle" size={16} color="#ff9500" />
        <Text style={styles.warningText}>
          Note : L'authentification Google peut avoir des limitations avec Expo Go. 
          Fonctionnalité complète disponible dans l'app finale.
        </Text>
      </View>

      {!isConnected ? (
        <TouchableOpacity
          style={[styles.button, styles.connectButton]}
          onPress={handleConnect}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Image 
                source={{ uri: 'https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png' }}
                style={styles.googleIcon}
              />
              <Text style={styles.buttonText}>Se connecter à Google Drive</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.connectedContainer}>
          <View style={styles.userInfo}>
            <View style={styles.userDetails}>
              <Text style={styles.connectedLabel}>Connecté en tant que :</Text>
              <Text style={styles.userEmail}>{userInfo?.email}</Text>
              {userInfo?.name && (
                <Text style={styles.userName}>{userInfo.name}</Text>
              )}
            </View>
            {userInfo?.picture && (
              <Image source={{ uri: userInfo.picture }} style={styles.userAvatar} />
            )}
          </View>

          <View style={styles.syncInfo}>
            <Ionicons name="checkmark-circle" size={20} color="#28a745" />
            <Text style={styles.syncText}>
              Synchronisation automatique activée
            </Text>
          </View>

          <Text style={styles.infoText}>
            📁 Vos factures sont sauvegardées dans :
            {'\n'}Drive / Factures / [Nom de la propriété]
          </Text>

          <TouchableOpacity
            style={[styles.button, styles.disconnectButton]}
            onPress={handleDisconnect}
          >
            <Ionicons name="log-out-outline" size={20} color="#dc3545" />
            <Text style={[styles.buttonText, { color: '#dc3545' }]}>
              Déconnecter
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  connectButton: {
    backgroundColor: '#4285F4',
  },
  disconnectButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  connectedContainer: {
    marginTop: 8,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  userDetails: {
    flex: 1,
  },
  connectedLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  userName: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 12,
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  syncText: {
    fontSize: 14,
    color: '#155724',
    marginLeft: 8,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 6,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});