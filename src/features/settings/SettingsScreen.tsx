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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export interface OwnerSettings {
  ownerName: string;
  ownerFirstName: string;
  ownerLastName: string;
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
  useCustomEmail: boolean;
  customEmailSubject: string;
  customEmailBody: string;
  useSignature: boolean;
  signatureImage: string;
}

export const SETTINGS_KEY = 'owner_settings';

export const DEFAULT_SETTINGS: OwnerSettings = {
  ownerName: '',
  ownerFirstName: '',
  ownerLastName: '',
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
  useCustomEmail: false,
  customEmailSubject: '',
  customEmailBody: '',
  useSignature: false,
  signatureImage: '',
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
        const parsedSettings = JSON.parse(savedSettings);
        
        // Migration: si ownerName existe mais pas ownerFirstName/ownerLastName
        if (parsedSettings.ownerName && (!parsedSettings.ownerFirstName || !parsedSettings.ownerLastName)) {
          const nameParts = parsedSettings.ownerName.trim().split(' ');
          if (nameParts.length >= 2) {
            parsedSettings.ownerFirstName = nameParts[0];
            parsedSettings.ownerLastName = nameParts.slice(1).join(' ');
          } else {
            parsedSettings.ownerFirstName = '';
            parsedSettings.ownerLastName = parsedSettings.ownerName;
          }
        }
        
        // Migration: ajouter les nouvelles propriétés si elles n'existent pas
        if (parsedSettings.useSignature === undefined) {
          parsedSettings.useSignature = false;
        }
        if (parsedSettings.signatureImage === undefined) {
          parsedSettings.signatureImage = '';
        }
        
        setSettings(parsedSettings);
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

  const showVariablesHelp = () => {
    Alert.alert(
      'Variables disponibles',
      `Vous pouvez utiliser ces variables dans vos emails personnalisés :

• {VILLE} - Le nom de votre ville/location
• {NOM} - Le nom de famille du client (en majuscules)
• {PRENOM} - Le prénom du client
• {NOM-PROPRIETAIRE} - Votre nom de famille
• {PRENOM-PROPRIETAIRE} - Votre prénom
• {MOIS} - Le mois du séjour (janvier, février...)
• {ANNEE} - L'année du séjour

Exemple d'utilisation :
"Bonjour {PRENOM}, voici votre facture pour {VILLE} du mois de {MOIS} {ANNEE}."

Les variables seront automatiquement remplacées par les vraies valeurs lors de l'envoi.`,
      [{ text: 'Compris', style: 'default' }]
    );
  };

  const pickSignatureImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission requise', 'Vous devez autoriser l\'accès à la galerie photo pour sélectionner une signature.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 2],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0] && result.assets[0].base64) {
      const base64Image = `data:image/png;base64,${result.assets[0].base64}`;
      setSettings({ ...settings, signatureImage: base64Image });
    }
  };

  const removeSignature = () => {
    Alert.alert(
      'Supprimer la signature',
      'Voulez-vous vraiment supprimer la signature ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setSettings({ ...settings, signatureImage: '', useSignature: false });
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
              <Text style={styles.label}>Prénom du propriétaire</Text>
              <TextInput
                style={styles.input}
                value={settings.ownerFirstName}
                onChangeText={(text) => setSettings({ ...settings, ownerFirstName: text })}
                placeholder="Prénom du propriétaire"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom du propriétaire</Text>
              <TextInput
                style={styles.input}
                value={settings.ownerLastName}
                onChangeText={(text) => setSettings({ ...settings, ownerLastName: text })}
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


          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personnalisation de l'email</Text>

            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.label}>Utiliser un email personnalisé</Text>
                <Text style={styles.switchDescription}>
                  Personnaliser le sujet et le contenu de l'email envoyé avec la facture
                </Text>
              </View>
              <Switch
                value={settings.useCustomEmail}
                onValueChange={(value) => {
                  if (value && !settings.customEmailSubject && !settings.customEmailBody) {
                    // Pré-remplir avec les valeurs par défaut
                    setSettings({ 
                      ...settings, 
                      useCustomEmail: value,
                      customEmailSubject: 'Facture séjour {VILLE} - {NOM} {PRENOM}',
                      customEmailBody: `Bonjour,

Veuillez trouver ci-joint la facture de votre séjour {VILLE} pour le mois de {MOIS} {ANNEE}.

En vous souhaitant bonne réception,

{PRENOM-PROPRIETAIRE} {NOM-PROPRIETAIRE}`
                    });
                  } else {
                    setSettings({ ...settings, useCustomEmail: value });
                  }
                }}
                trackColor={{ false: '#e7e7e7', true: '#003580' }}
                thumbColor={settings.useCustomEmail ? '#fff' : '#f4f3f4'}
              />
            </View>

            {settings.useCustomEmail && (
              <>
                <View style={styles.inputGroup}>
                  <View style={styles.labelWithHelp}>
                    <Text style={styles.label}>Sujet de l'email</Text>
                    <TouchableOpacity onPress={showVariablesHelp} style={styles.helpIcon}>
                      <Ionicons name="help-circle-outline" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={settings.customEmailSubject}
                    onChangeText={(text) => setSettings({ ...settings, customEmailSubject: text })}
                    placeholder="Ex: Facture séjour {VILLE} - {NOM} {PRENOM}"
                  />
                  <Text style={styles.helpText}>
                    Variables disponibles: {'{VILLE}'}, {'{NOM}'}, {'{PRENOM}'}, {'{MOIS}'}, {'{ANNEE}'}
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelWithHelp}>
                    <Text style={styles.label}>Contenu de l'email</Text>
                    <TouchableOpacity onPress={showVariablesHelp} style={styles.helpIcon}>
                      <Ionicons name="help-circle-outline" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={settings.customEmailBody}
                    onChangeText={(text) => setSettings({ ...settings, customEmailBody: text })}
                    placeholder="Ex: Bonjour,

Veuillez trouver ci-joint la facture..."
                    multiline={true}
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                  <Text style={styles.helpText}>
                    Variables disponibles: {'{VILLE}'}, {'{NOM}'}, {'{PRENOM}'}, {'{NOM-PROPRIETAIRE}'}, {'{PRENOM-PROPRIETAIRE}'}, {'{MOIS}'}, {'{ANNEE}'}
                  </Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Signature email</Text>

            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.label}>Ajouter une signature à l'email</Text>
                <Text style={styles.switchDescription}>
                  Ajoute une image de signature à la fin de chaque email envoyé
                </Text>
              </View>
              <Switch
                value={settings.useSignature}
                onValueChange={(value) => setSettings({ ...settings, useSignature: value })}
                trackColor={{ false: '#e7e7e7', true: '#003580' }}
                thumbColor={settings.useSignature ? '#fff' : '#f4f3f4'}
              />
            </View>

            {settings.useSignature && (
              <>
                {settings.signatureImage ? (
                  <View style={styles.signatureContainer}>
                    <Text style={styles.label}>Signature actuelle</Text>
                    <Image 
                      source={{ uri: settings.signatureImage }} 
                      style={styles.signatureImage}
                      resizeMode="contain"
                    />
                    <View style={styles.signatureButtons}>
                      <TouchableOpacity
                        style={[styles.button, styles.changeSignatureButton]}
                        onPress={pickSignatureImage}
                      >
                        <Text style={styles.changeSignatureText}>Changer la signature</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button, styles.removeSignatureButton]}
                        onPress={removeSignature}
                      >
                        <Text style={styles.removeSignatureText}>Supprimer</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.button, styles.selectSignatureButton]}
                    onPress={pickSignatureImage}
                  >
                    <Ionicons name="image-outline" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.selectSignatureText}>Sélectionner une signature PNG</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.helpText}>
                  Recommandé : Image PNG avec fond transparent, dimensions max 600x300px
                </Text>
              </>
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
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  saveButton: {
    backgroundColor: '#0056b3',
    borderWidth: 0,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resetButton: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#dc3545',
  },
  resetButtonText: {
    color: '#dc3545',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
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
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  labelWithHelp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  helpIcon: {
    padding: 6,
  },
  signatureContainer: {
    marginTop: 16,
  },
  signatureImage: {
    width: '100%',
    height: 100,
    marginVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e7e7e7',
    backgroundColor: '#f9f9f9',
  },
  signatureButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  selectSignatureButton: {
    backgroundColor: '#003580',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  selectSignatureText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  changeSignatureButton: {
    flex: 1,
    backgroundColor: '#0056b3',
  },
  changeSignatureText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  removeSignatureButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#dc3545',
  },
  removeSignatureText: {
    color: '#dc3545',
    fontSize: 14,
    fontWeight: '600',
  },
});