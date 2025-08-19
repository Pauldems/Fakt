import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OwnerSettings {
  ownerName: string;
  companyName: string;
  companyAddress: string;
  companyPostalCode: string;
  companyCity: string;
  establishmentId: string;
  legalEntityId: string;
  phoneNumber: string;
  email: string;
  enableBcc: boolean;
  bccEmail: string;
}

export const SETTINGS_KEY = 'owner_settings';

export const DEFAULT_SETTINGS: OwnerSettings = {
  ownerName: '',
  companyName: '',
  companyAddress: '',
  companyPostalCode: '',
  companyCity: '',
  establishmentId: '',
  legalEntityId: '',
  phoneNumber: '',
  email: '',
  enableBcc: false,
  bccEmail: '',
};

export const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<OwnerSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  };


  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      Alert.alert('Succès', 'Les paramètres ont été sauvegardés');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder les paramètres');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefault = () => {
    Alert.alert(
      'Réinitialiser',
      'Voulez-vous vraiment réinitialiser tous les paramètres par défaut ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => {
            setSettings(DEFAULT_SETTINGS);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#003580', '#0052cc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Ionicons name="settings" size={30} color="white" />
          <Text style={styles.title}>Paramètres</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations propriétaire</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom du propriétaire</Text>
              <TextInput
                style={styles.input}
                value={settings.ownerName}
                onChangeText={(text) => setSettings({ ...settings, ownerName: text })}
                placeholder="Nom du propriétaire"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations de la location</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom de la maison</Text>
              <TextInput
                style={styles.input}
                value={settings.companyName}
                onChangeText={(text) => setSettings({ ...settings, companyName: text })}
                placeholder="Nom de la maison"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adresse</Text>
              <TextInput
                style={styles.input}
                value={settings.companyAddress}
                onChangeText={(text) => setSettings({ ...settings, companyAddress: text })}
                placeholder="Adresse"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Code postal</Text>
              <TextInput
                style={styles.input}
                value={settings.companyPostalCode}
                onChangeText={(text) => setSettings({ ...settings, companyPostalCode: text })}
                placeholder="Code postal"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ville</Text>
              <TextInput
                style={styles.input}
                value={settings.companyCity}
                onChangeText={(text) => setSettings({ ...settings, companyCity: text })}
                placeholder="Ville"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Identifiants légaux</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Identifiant établissement</Text>
              <TextInput
                style={styles.input}
                value={settings.establishmentId}
                onChangeText={(text) => setSettings({ ...settings, establishmentId: text })}
                placeholder="Identifiant établissement"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Entité juridique</Text>
              <TextInput
                style={styles.input}
                value={settings.legalEntityId}
                onChangeText={(text) => setSettings({ ...settings, legalEntityId: text })}
                placeholder="Entité juridique"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Coordonnées</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Téléphone</Text>
              <TextInput
                style={styles.input}
                value={settings.phoneNumber}
                onChangeText={(text) => setSettings({ ...settings, phoneNumber: text })}
                placeholder="Téléphone"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={settings.email}
                onChangeText={(text) => setSettings({ ...settings, email: text })}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Copie cachée des emails</Text>

            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.label}>Activer la copie cachée (BCC)</Text>
                <Text style={styles.switchDescription}>
                  Recevoir automatiquement une copie de chaque facture envoyée
                </Text>
              </View>
              <Switch
                value={settings.enableBcc}
                onValueChange={(value) => setSettings({ ...settings, enableBcc: value })}
                trackColor={{ false: '#e7e7e7', true: '#003580' }}
                thumbColor={settings.enableBcc ? '#fff' : '#f4f3f4'}
              />
            </View>

            {settings.enableBcc && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email de copie cachée</Text>
                <TextInput
                  style={styles.input}
                  value={settings.bccEmail}
                  onChangeText={(text) => setSettings({ ...settings, bccEmail: text })}
                  placeholder="Email pour la copie cachée"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={saveSettings}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={resetToDefault}
            >
              <Text style={styles.resetButtonText}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginTop: 10,
  },
  content: {
    flex: 1,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e7e7e7',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#1a1a1a',
  },
  buttonContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 40,
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#0071c2',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  resetButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#dc3545',
  },
  resetButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  switchDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});