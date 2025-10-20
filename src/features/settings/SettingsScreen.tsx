import React, { useState, useEffect, useCallback } from 'react';
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
  Image,
  Modal,
  Switch,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import hybridSettingsService from '../../services/hybridSettingsService';
import * as ImagePicker from 'expo-image-picker';
import { TemplateSelector, TemplateType } from '../../components/TemplateSelector';
import { SubscriptionSection } from './SubscriptionSection';
// import { GoogleDriveSection } from './GoogleDriveSection'; // Désactivé temporairement
import { useTheme } from '../../theme/ThemeContext';
import { CurrencyDropdown } from '../../components/CurrencyDropdown';

export interface CustomProperty {
  id: string;
  label: string;
  value: string;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

export interface PropertyTemplate {
  id: string;
  name: string; // Nom du template (ex: "Location Paris", "Chalet Alpes")
  properties: CustomProperty[];
  defaultPrice?: number; // Prix par défaut pour cette propriété (optionnel)
}

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
  useLogo: boolean;
  logoImage: string;
  customProperties: CustomProperty[];
  propertyTemplates: PropertyTemplate[];
  invoiceTemplate?: 'modern' | 'classic' | 'minimal' | 'original';
  invoiceNumberFormat: string; // Format personnalisé : ex "FACT-{ANNEE}-{N}"
  vatSettings: {
    isSubjectToVAT: boolean;
    vatRate: number;
    customRate?: number;
    useCustomRate: boolean;
  };
  currency: string;
}

export const SETTINGS_KEY = 'owner_settings';

// Devises supportées
export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', flag: '🇳🇴' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', flag: '🇩🇰' },
];

// Paramètres complètement vides pour un nouveau compte
export const DEFAULT_SETTINGS: OwnerSettings = {
  ownerName: '', // Ne plus utiliser - sera récupéré depuis l'activation
  ownerFirstName: '', // Ne plus utiliser - sera récupéré depuis l'activation
  ownerLastName: '', // Ne plus utiliser - sera récupéré depuis l'activation
  companyName: '',
  companyAddress: '',
  companyPostalCode: '',
  companyCity: '',
  establishmentId: '',
  legalEntityId: '',
  phoneNumber: '', // Vide par défaut
  email: '', // Ne plus utiliser - sera récupéré depuis l'activation
  enableBcc: false,
  bccEmail: '',
  useCustomEmail: false,
  customEmailSubject: '',
  customEmailBody: '',
  useSignature: false,
  signatureImage: '',
  useLogo: false,
  logoImage: '',
  customProperties: [],
  propertyTemplates: [], // Vide par défaut - utilisateur doit créer ses propriétés
  invoiceTemplate: 'original',
  invoiceNumberFormat: 'FACT-{ANNEE}-{MOIS}-{JOUR}-{N}', // Format par défaut : FACT-YYYY-MM-DD-NNN
  vatSettings: {
    isSubjectToVAT: false,
    vatRate: 10, // TVA 10% pour locations meublées par défaut
    customRate: 10,
    useCustomRate: false,
  },
  currency: 'EUR', // Euro par défaut
};

export const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<OwnerSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PropertyTemplate | null>(null);
  const [showVatInfo, setShowVatInfo] = useState(false);
  const [vatInfoAnimation] = useState(new Animated.Value(0));
  const [showCurrencyInfo, setShowCurrencyInfo] = useState(false);
  const [currencyInfoAnimation] = useState(new Animated.Value(0));
  const [showEmailInfo, setShowEmailInfo] = useState(false);
  const [emailInfoAnimation] = useState(new Animated.Value(0));
  const { theme } = useTheme();

  // Animation pour l'info TVA
  const toggleVatInfo = () => {
    const toValue = showVatInfo ? 0 : 1;
    setShowVatInfo(!showVatInfo);
    
    Animated.timing(vatInfoAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Animation pour l'info Devise
  const toggleCurrencyInfo = () => {
    const toValue = showCurrencyInfo ? 0 : 1;
    setShowCurrencyInfo(!showCurrencyInfo);
    
    Animated.timing(currencyInfoAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Animation pour l'info Email
  const toggleEmailInfo = () => {
    const toValue = showEmailInfo ? 0 : 1;
    setShowEmailInfo(!showEmailInfo);
    
    Animated.timing(emailInfoAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Fonction pour formater le numéro de téléphone
  const formatPhoneNumber = (text: string) => {
    // Garder le +, supprimer seulement les espaces en trop
    let cleaned = text.replace(/\s+/g, ' ').trim();
    
    // Si ça commence par +, traiter différemment
    if (cleaned.startsWith('+')) {
      const prefix = cleaned.substring(0, 3); // +33
      const numbers = cleaned.substring(3).replace(/\D/g, '');
      const formatted = numbers.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/g, '$1 $2 $3 $4 $5');
      return prefix + (numbers ? ' ' + formatted : '');
    } else {
      // Supprimer tout sauf les chiffres et ajouter des espaces
      const onlyNumbers = cleaned.replace(/\D/g, '');
      return onlyNumbers.replace(/(\d{2})(?=\d)/g, '$1 ');
    }
  };

  // Fonction pour sauvegarder automatiquement
  const autoSaveSettings = useCallback(async (newSettings: OwnerSettings) => {
    try {
      await hybridSettingsService.saveSettings(newSettings);
      console.log('Paramètres sauvegardés automatiquement');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde automatique:', error);
    }
  }, []);

  // Fonction pour mettre à jour les settings avec sauvegarde auto
  const updateSettings = useCallback((newSettings: OwnerSettings | ((prev: OwnerSettings) => OwnerSettings)) => {
    const updatedSettings = typeof newSettings === 'function' ? newSettings(settings) : newSettings;
    setSettings(updatedSettings);
    autoSaveSettings(updatedSettings);
  }, [settings, autoSaveSettings]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Utiliser le service hybride qui gère Firebase + infos d'activation
      const loadedSettings = await hybridSettingsService.getSettings();
      setSettings(loadedSettings);
      console.log('✅ Paramètres chargés avec infos d\'activation');
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      setSettings(DEFAULT_SETTINGS);
    }
  };


  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await hybridSettingsService.saveSettings(settings);
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
      updateSettings(prev => ({ ...prev, signatureImage: base64Image }));
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
            updateSettings(prev => ({ ...prev, signatureImage: '', useSignature: false }));
          },
        },
      ]
    );
  };

  const pickLogoImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission requise', 'Vous devez autoriser l\'accès à la galerie photo pour sélectionner un logo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [2, 1], // Format paysage recommandé pour un logo
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0] && result.assets[0].base64) {
      const base64Image = `data:image/png;base64,${result.assets[0].base64}`;
      updateSettings(prev => ({ ...prev, logoImage: base64Image }));
    }
  };

  const removeLogo = () => {
    Alert.alert(
      'Supprimer le logo',
      'Voulez-vous vraiment supprimer le logo ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            updateSettings(prev => ({ ...prev, logoImage: '', useLogo: false }));
          },
        },
      ]
    );
  };

  const addCustomProperty = () => {
    const newId = Date.now().toString();
    const newProperty: CustomProperty = {
      id: newId,
      label: '',
      value: ''
    };
    updateSettings(prev => ({
      ...prev,
      customProperties: [...prev.customProperties, newProperty]
    }));
  };

  const updateCustomProperty = (id: string, field: 'label' | 'value', newValue: string) => {
    updateSettings(prev => ({
      ...prev,
      customProperties: prev.customProperties.map(prop =>
        prop.id === id ? { ...prop, [field]: newValue } : prop
      )
    }));
  };

  const removeCustomProperty = (id: string) => {
    updateSettings(prev => ({
      ...prev,
      customProperties: prev.customProperties.filter(prop => prop.id !== id)
    }));
  };

  // Fonctions pour les templates
  const addPropertyTemplate = () => {
    const newTemplate: PropertyTemplate = {
      id: Date.now().toString(),
      name: '',
      properties: [
        { id: '1', label: 'Adresse', value: '' },
        { id: '2', label: 'Code postal', value: '' },
        { id: '3', label: 'Ville', value: '' },
        { id: '4', label: 'Identifiant établissement', value: '' },
        { id: '5', label: 'Entité juridique', value: '' },
      ]
    };
    setEditingTemplate(newTemplate);
  };

  const savePropertyTemplate = async (template: PropertyTemplate) => {
    if (!template.name.trim()) {
      Alert.alert('Erreur', 'Veuillez donner un nom au template');
      return;
    }

    const existingIndex = settings.propertyTemplates.findIndex(t => t.id === template.id);
    let updatedTemplates;
    
    if (existingIndex >= 0) {
      updatedTemplates = settings.propertyTemplates.map(t => 
        t.id === template.id ? template : t
      );
    } else {
      updatedTemplates = [...settings.propertyTemplates, template];
    }

    const updatedSettings = {
      ...settings,
      propertyTemplates: updatedTemplates
    };

    updateSettings(updatedSettings);
    
    setEditingTemplate(null);
  };

  const editPropertyTemplate = (template: PropertyTemplate) => {
    // S'assurer que toutes les propriétés requises sont présentes
    const requiredProperties = [
      'Adresse', 'Code postal', 'Ville', 'Identifiant établissement', 'Entité juridique'
    ];
    
    const updatedProperties = [...template.properties];
    
    requiredProperties.forEach((label, index) => {
      const existing = updatedProperties.find(p => p.label === label);
      if (!existing) {
        updatedProperties.push({
          id: (index + 1).toString(),
          label,
          value: ''
        });
      }
    });
    
    setEditingTemplate({ 
      ...template, 
      properties: updatedProperties 
    });
  };

  const updatePropertyField = (label: string, value: string) => {
    if (!editingTemplate) return;
    
    setEditingTemplate({
      ...editingTemplate,
      properties: editingTemplate.properties.map(prop =>
        prop.label === label ? { ...prop, value } : prop
      )
    });
  };

  const deletePropertyTemplate = (id: string) => {
    Alert.alert(
      'Supprimer le template',
      'Voulez-vous vraiment supprimer ce template ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const updatedSettings = {
              ...settings,
              propertyTemplates: settings.propertyTemplates.filter(t => t.id !== id)
            };
            
            updateSettings(updatedSettings);
          },
        },
      ]
    );
  };


  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <LinearGradient
        colors={theme.gradients.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Ionicons name="settings" size={30} color={theme.text.inverse} />
          <Text style={[styles.title, { color: theme.text.inverse }]}>Paramètres</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 1. Vos informations */}
          <View style={[styles.section, { backgroundColor: theme.surface.primary }]}>
            <View style={styles.headerWithIcon}>
              <Ionicons name="person-outline" size={24} color={theme.primary} />
              <Text style={[styles.sectionTitleWithIcon, { color: theme.text.primary }]}>Vos informations</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Votre prénom</Text>
              <TextInput
                style={styles.input}
                value={settings.ownerFirstName}
                onChangeText={(text) => updateSettings(prev => ({ ...prev, ownerFirstName: text }))}
                placeholder="Prénom du propriétaire"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Votre nom</Text>
              <TextInput
                style={styles.input}
                value={settings.ownerLastName}
                onChangeText={(text) => updateSettings(prev => ({ ...prev, ownerLastName: text }))}
                placeholder="Nom du propriétaire"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Téléphone</Text>
              <TextInput
                style={styles.input}
                value={settings.phoneNumber}
                onChangeText={(text) => {
                  const formatted = formatPhoneNumber(text);
                  updateSettings(prev => ({ ...prev, phoneNumber: formatted }));
                }}
                placeholder="Ex: +33 1 12 34 56 78"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={settings.email}
                onChangeText={(text) => updateSettings(prev => ({ ...prev, email: text }))}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* 2. Section Format de numérotation */}
          <View style={[styles.section, { backgroundColor: theme.surface.primary }]}>
            <View style={styles.headerWithIcon}>
              <Ionicons name="calculator-outline" size={24} color={theme.primary} />
              <Text style={[styles.sectionTitleWithIcon, { color: theme.text.primary }]}>Format de numérotation</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text.secondary }]}>Format personnalisé</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface.secondary,
                    color: theme.text.primary,
                    borderColor: theme.text.disabled
                  }
                ]}
                placeholder="Ex: FACT-{ANNEE}-{MOIS}-{N}"
                placeholderTextColor={theme.text.disabled}
                value={settings.invoiceNumberFormat}
                onChangeText={(text) => updateSettings(prev => ({ ...prev, invoiceNumberFormat: text }))}
              />
              <Text style={[styles.hint, { color: theme.text.disabled }]}>
                Variables : {'{ANNEE}'} (2025), {'{MOIS}'} (01-12), {'{JOUR}'} (01-31), {'{N}'} (compteur)
              </Text>
            </View>
          </View>

          {/* 3. Gestion des propriétés */}
          <View style={[styles.section, { backgroundColor: theme.surface.primary }]}>
            <View style={styles.headerWithIcon}>
              <Ionicons name="home-outline" size={24} color={theme.primary} />
              <Text style={[styles.sectionTitleWithIcon, { color: theme.text.primary }]}>Gestion des propriétés</Text>
            </View>
            
            <Text style={styles.sectionDescription}>
              Créez des templates pour vos différentes propriétés (nom, adresse, identifiants, etc.)
            </Text>

            <TouchableOpacity
              style={[styles.button, styles.addTemplateButton]}
              onPress={addPropertyTemplate}
            >
              <Ionicons name="add" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.addTemplateText}>Ajouter une propriété</Text>
            </TouchableOpacity>

            {settings.propertyTemplates.map((template) => (
              <View key={template.id} style={styles.templateItem}>
                <View style={styles.templateHeader}>
                  <Text style={styles.templateName}>{template.name || 'Nouveau template'}</Text>
                  <View style={styles.templateActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => editPropertyTemplate(template)}
                    >
                      <Ionicons name="pencil" size={16} color="#0071c2" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deletePropertyTemplate(template.id)}
                    >
                      <Ionicons name="trash" size={16} color="#d32f2f" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.templateInfo}>
                  {template.properties.find(p => p.label === 'Adresse')?.value || 'Adresse non renseignée'} • {template.properties.find(p => p.label === 'Ville')?.value || 'Ville non renseignée'}
                </Text>
              </View>
            ))}
          </View>

          {/* 3. Section Devise */}
          <View style={[styles.section, { backgroundColor: theme.surface.primary }]}>
            <View style={styles.headerWithIcon}>
              <Ionicons name="cash-outline" size={24} color={theme.primary} />
              <Text style={[styles.sectionTitleWithIcon, { color: theme.text.primary }]}>Devise</Text>
              <TouchableOpacity onPress={toggleCurrencyInfo} style={styles.infoButton}>
                <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
              </TouchableOpacity>
            </View>

            <Animated.View style={[
              styles.currencyExpandedInfo,
              {
                height: currencyInfoAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 150],
                }),
                opacity: currencyInfoAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              }
            ]}>
              <View style={styles.currencyInfoBox}>
                <Ionicons name="information-circle" size={16} color="#0ea5e9" />
                <View style={styles.currencyInfoText}>
                  <Text style={styles.currencyInfoTitle}>Information Devise :</Text>
                  <Text style={styles.currencyInfoDescription}>
                    • Cette devise sera utilisée pour tous les prix et totaux dans vos factures{"\n"}
                    • Vous pouvez la changer à tout moment{"\n"}
                    • Les symboles monétaires s'afficheront automatiquement
                  </Text>
                </View>
              </View>
            </Animated.View>

            <CurrencyDropdown
              currencies={SUPPORTED_CURRENCIES}
              selectedCurrency={settings.currency}
              onCurrencyChange={(currencyCode) => 
                updateSettings(prev => ({ ...prev, currency: currencyCode }))
              }
            />
          </View>

          {/* 4. Section TVA */}
          <View style={[styles.section, { backgroundColor: theme.surface.primary }]}>
            <View style={styles.headerWithIcon}>
              <Ionicons name="calculator-outline" size={24} color={theme.primary} />
              <Text style={[styles.sectionTitleWithIcon, { color: theme.text.primary }]}>TVA (Taxe sur la Valeur Ajoutée)</Text>
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <View style={styles.labelWithInfo}>
                  <Text style={styles.label}>Assujetti à la TVA</Text>
                  <TouchableOpacity onPress={toggleVatInfo} style={styles.infoButton}>
                    <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              <Switch
                value={settings.vatSettings.isSubjectToVAT}
                onValueChange={(value) => updateSettings(prev => ({ 
                  ...prev, 
                  vatSettings: { ...prev.vatSettings, isSubjectToVAT: value } 
                }))}
                trackColor={{ false: '#e7e7e7', true: '#003580' }}
                thumbColor={settings.vatSettings.isSubjectToVAT ? '#fff' : '#f4f3f4'}
              />
            </View>

            <Animated.View style={[
              styles.vatExpandedInfo,
              {
                height: vatInfoAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 200],
                }),
                opacity: vatInfoAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              }
            ]}>
              <View style={styles.vatInfoBox}>
                <Ionicons name="information-circle" size={16} color="#0ea5e9" />
                <View style={styles.vatInfoText}>
                  <Text style={styles.vatInfoTitle}>Information TVA :</Text>
                  <Text style={styles.vatInfoDescription}>
                    • Si vous louez un bien meublé, vous devez généralement appliquer la TVA à 10%{"\n"}
                    • Si vous louez un bien nu (non meublé), vous n'êtes pas assujetti à la TVA{"\n"}
                    • En cas de doute, consultez votre comptable ou le service des impôts
                  </Text>
                </View>
              </View>
            </Animated.View>

            {settings.vatSettings.isSubjectToVAT && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Taux de TVA (%)</Text>
                  <TextInput
                    style={styles.vatInput}
                    value={settings.vatSettings.vatRate?.toString() || ''}
                    onChangeText={(text) => {
                      const rate = parseFloat(text.replace(',', '.')) || 0;
                      updateSettings(prev => ({ 
                        ...prev, 
                        vatSettings: { 
                          ...prev.vatSettings, 
                          vatRate: rate
                        } 
                      }));
                    }}
                    placeholder="Ex: 10"
                    keyboardType="decimal-pad"
                    maxLength={6}
                  />
                  <Text style={styles.helpText}>
                    Entrez votre taux de TVA (ex: 10 pour 10%, 20 pour 20%)
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* 5. Section Template de facture */}
          <TemplateSelector
            selectedTemplate={(settings.invoiceTemplate || 'original') as TemplateType}
            onSelectTemplate={(template) => updateSettings(prev => ({ ...prev, invoiceTemplate: template }))}
          />

          {/* 6. Personnalisation de l'email */}
          <View style={[styles.section, { backgroundColor: theme.surface.primary }]}>
            <View style={styles.headerWithIcon}>
              <Ionicons name="mail-outline" size={24} color={theme.primary} />
              <Text style={[styles.sectionTitleWithIcon, { color: theme.text.primary }]}>Personnalisation de l'email</Text>
              <TouchableOpacity onPress={toggleEmailInfo} style={styles.infoButton}>
                <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
              </TouchableOpacity>
            </View>

            <Animated.View style={[
              styles.emailExpandedInfo,
              {
                height: emailInfoAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 180],
                }),
                opacity: emailInfoAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              }
            ]}>
              <View style={styles.emailInfoBox}>
                <Ionicons name="information-circle" size={16} color="#0ea5e9" />
                <View style={styles.emailInfoText}>
                  <Text style={styles.emailInfoTitle}>Personnalisation Email :</Text>
                  <Text style={styles.emailInfoDescription}>
                    • Personnalisez le sujet et le contenu de vos emails de facture{"\n"}
                    • Utilisez les variables pour insérer automatiquement les informations{"\n"}
                    • Vous pouvez réinitialiser à tout moment
                  </Text>
                </View>
              </View>
            </Animated.View>

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
                    updateSettings(prev => ({ 
                      ...prev, 
                      useCustomEmail: value,
                      customEmailSubject: 'Facture séjour {VILLE} - {NOM} {PRENOM}',
                      customEmailBody: `Bonjour,

Veuillez trouver ci-joint la facture de votre séjour {VILLE} pour le mois de {MOIS} {ANNEE}.

En vous souhaitant bonne réception,

{PRENOM-PROPRIETAIRE} {NOM-PROPRIETAIRE}`
                    }));
                  } else {
                    updateSettings(prev => ({ ...prev, useCustomEmail: value }));
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
                    onChangeText={(text) => updateSettings(prev => ({ ...prev, customEmailSubject: text }))}
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
                    onChangeText={(text) => updateSettings(prev => ({ ...prev, customEmailBody: text }))}
                    placeholder="Ex: Bonjour,

Veuillez trouver ci-joint la facture..."
                    multiline={true}
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                  <Text style={styles.helpText}>
                    Variables disponibles: {'{VILLE}'}, {'{NOM}'}, {'{PRENOM}'}, {'{NOM-PROPRIETAIRE}'}, {'{PRENOM-PROPRIETAIRE}'}, {'{MOIS}'}, {'{ANNEE}'}
                  </Text>
                  <Text style={[styles.helpText, { color: '#4CAF50', fontStyle: 'italic' }]}>
                    📧 Traduction automatique disponible selon la langue sélectionnée lors de l'envoi
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={[styles.button, styles.resetEmailButton]}
                  onPress={() => {
                    Alert.alert(
                      'Réinitialiser l\'email',
                      'Voulez-vous vraiment réinitialiser l\'email personnalisé ? Vos modifications actuelles seront perdues.',
                      [
                        { text: 'Annuler', style: 'cancel' },
                        {
                          text: 'Réinitialiser',
                          style: 'destructive',
                          onPress: () => {
                            updateSettings(prev => ({ 
                              ...prev,
                              customEmailSubject: 'Facture séjour {VILLE} - {NOM} {PRENOM}',
                              customEmailBody: `Bonjour,

Veuillez trouver ci-joint la facture de votre séjour {VILLE} pour le mois de {MOIS} {ANNEE}.

En vous souhaitant bonne réception,

{PRENOM-PROPRIETAIRE} {NOM-PROPRIETAIRE}`
                            }));
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Ionicons name="refresh-outline" size={16} color="#1976D2" style={{ marginRight: 8 }} />
                  <Text style={styles.resetEmailText}>Réinitialiser l'email</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* 7. Signature email */}
          <View style={[styles.section, { backgroundColor: theme.surface.primary }]}>
            <View style={styles.headerWithIcon}>
              <Ionicons name="create-outline" size={24} color={theme.primary} />
              <Text style={[styles.sectionTitleWithIcon, { color: theme.text.primary }]}>Signature email</Text>
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.label}>Ajouter une signature à l'email</Text>
                <Text style={styles.switchDescription}>
                  Ajoute une image de signature à la fin de chaque email envoyé
                </Text>
              </View>
              <Switch
                value={settings.useSignature}
                onValueChange={(value) => updateSettings(prev => ({ ...prev, useSignature: value }))}
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

          {/* 8. Logo entreprise */}
          <View style={[styles.section, { backgroundColor: theme.surface.primary }]}>
            <View style={styles.headerWithIcon}>
              <Ionicons name="business-outline" size={24} color={theme.primary} />
              <Text style={[styles.sectionTitleWithIcon, { color: theme.text.primary }]}>Logo entreprise</Text>
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.label}>Ajouter un logo sur les factures</Text>
                <Text style={styles.switchDescription}>
                  Affiche votre logo en haut à gauche de chaque facture
                </Text>
              </View>
              <Switch
                value={settings.useLogo}
                onValueChange={(value) => updateSettings(prev => ({ ...prev, useLogo: value }))}
                trackColor={{ false: '#e7e7e7', true: '#003580' }}
                thumbColor={settings.useLogo ? '#fff' : '#f4f3f4'}
              />
            </View>

            {settings.useLogo && (
              <>
                {settings.logoImage ? (
                  <View style={styles.logoContainer}>
                    <Text style={styles.label}>Logo actuel</Text>
                    <Image 
                      source={{ uri: settings.logoImage }} 
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
                    <View style={styles.logoButtons}>
                      <TouchableOpacity
                        style={[styles.button, styles.changeLogoButton]}
                        onPress={pickLogoImage}
                      >
                        <Text style={styles.changeLogoText}>Changer le logo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button, styles.removeLogoButton]}
                        onPress={removeLogo}
                      >
                        <Text style={styles.removeLogoText}>Supprimer</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.button, styles.selectLogoButton]}
                    onPress={pickLogoImage}
                  >
                    <Ionicons name="image-outline" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.selectLogoText}>Sélectionner un logo</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.helpText}>
                  Recommandé : Image PNG/JPG avec fond transparent, format paysage, dimensions max 300x150px
                </Text>
              </>
            )}
          </View>

          {/* 9. Copie cachée des emails */}
          <View style={[styles.section, { backgroundColor: theme.surface.primary }]}>
            <View style={styles.headerWithIcon}>
              <Ionicons name="copy-outline" size={24} color={theme.primary} />
              <Text style={[styles.sectionTitleWithIcon, { color: theme.text.primary }]}>Copie cachée des emails</Text>
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.label}>Activer la copie cachée (BCC)</Text>
                <Text style={styles.switchDescription}>
                  Recevoir automatiquement une copie de chaque facture envoyée
                </Text>
              </View>
              <Switch
                value={settings.enableBcc}
                onValueChange={(value) => updateSettings(prev => ({ ...prev, enableBcc: value }))}
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
                  onChangeText={(text) => updateSettings(prev => ({ ...prev, bccEmail: text }))}
                  placeholder="Email pour la copie cachée"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            )}
          </View>

          <View style={styles.autoSaveInfo}>
            <Text style={styles.autoSaveText}>
              💾 Toutes les modifications sont sauvegardées automatiquement
            </Text>
          </View>


          {/* Section Abonnement - EN DERNIER */}
          <SubscriptionSection />
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Interface d'édition de template */}
      <Modal
        visible={editingTemplate !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingTemplate(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTemplate && settings.propertyTemplates.find(t => t.id === editingTemplate.id) ? 'Modifier' : 'Créer'} une propriété
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setEditingTemplate(null)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom de la propriété</Text>
                <TextInput
                  style={styles.input}
                  value={editingTemplate?.name || ''}
                  onChangeText={(text) => editingTemplate && setEditingTemplate({
                    ...editingTemplate,
                    name: text
                  })}
                  placeholder="Ex: Appartement Paris, Chalet Courchevel..."
                />
              </View>

              <Text style={styles.sectionSubtitle}>Informations de la propriété</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Adresse</Text>
                <TextInput
                  style={styles.input}
                  value={editingTemplate?.properties.find(p => p.label === 'Adresse')?.value || ''}
                  onChangeText={(text) => editingTemplate && updatePropertyField('Adresse', text)}
                  placeholder="Adresse"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Code postal</Text>
                <TextInput
                  style={styles.input}
                  value={editingTemplate?.properties.find(p => p.label === 'Code postal')?.value || ''}
                  onChangeText={(text) => editingTemplate && updatePropertyField('Code postal', text)}
                  placeholder="Code postal"
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ville</Text>
                <TextInput
                  style={styles.input}
                  value={editingTemplate?.properties.find(p => p.label === 'Ville')?.value || ''}
                  onChangeText={(text) => editingTemplate && updatePropertyField('Ville', text)}
                  placeholder="Ville"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Identifiant établissement</Text>
                <TextInput
                  style={styles.input}
                  value={editingTemplate?.properties.find(p => p.label === 'Identifiant établissement')?.value || ''}
                  onChangeText={(text) => editingTemplate && updatePropertyField('Identifiant établissement', text)}
                  placeholder="Identifiant établissement"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Entité juridique</Text>
                <TextInput
                  style={styles.input}
                  value={editingTemplate?.properties.find(p => p.label === 'Entité juridique')?.value || ''}
                  onChangeText={(text) => editingTemplate && updatePropertyField('Entité juridique', text)}
                  placeholder="Entité juridique"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Prix par défaut (€) - Optionnel</Text>
                <TextInput
                  style={styles.input}
                  value={editingTemplate?.defaultPrice?.toString() || ''}
                  onChangeText={(text) => editingTemplate && setEditingTemplate({
                    ...editingTemplate,
                    defaultPrice: text ? parseFloat(text) || 0 : undefined
                  })}
                  placeholder="Ex: 120"
                  keyboardType="decimal-pad"
                />
                <Text style={styles.helpText}>
                  Ce prix sera pré-rempli automatiquement lors de la création d'une facture
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setEditingTemplate(null)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveTemplateButton]}
                onPress={() => editingTemplate && savePropertyTemplate(editingTemplate)}
              >
                <Text style={styles.saveTemplateButtonText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    color: '#001A40',
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#001A40',
    marginBottom: 8,
    marginTop: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#003580',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e7e7e7',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#001A40',
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
    color: '#1976D2',
    marginTop: 4,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#1976D2',
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
  logoContainer: {
    marginTop: 16,
  },
  logoImage: {
    width: '100%',
    height: 80,
    marginVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e7e7e7',
    backgroundColor: '#f9f9f9',
  },
  logoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  selectLogoButton: {
    backgroundColor: '#003580',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  selectLogoText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  changeLogoButton: {
    flex: 1,
    backgroundColor: '#0056b3',
  },
  changeLogoText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  removeLogoButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#dc3545',
  },
  removeLogoText: {
    color: '#dc3545',
    fontSize: 14,
    fontWeight: '600',
  },
  customPropertyContainer: {
    marginBottom: 12,
  },
  customPropertyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  customPropertyInputs: {
    flex: 1,
    gap: 8,
  },
  customPropertyLabelInput: {
    marginBottom: 0,
  },
  customPropertyValueInput: {
    marginBottom: 0,
  },
  addPropertyText: {
    color: '#003580',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 16,
    lineHeight: 20,
  },
  addTemplateButton: {
    backgroundColor: '#003580',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  addTemplateText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  templateItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#001A40',
    flex: 1,
  },
  templateActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#e3f2fd',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#ffebee',
  },
  templateInfo: {
    fontSize: 14,
    color: '#1976D2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#001A40',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#001A40',
    marginTop: 16,
    marginBottom: 12,
  },
  propertyEditItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  propertyInputs: {
    flex: 1,
    gap: 8,
  },
  propertyInputGroup: {
    flex: 1,
  },
  propertyInputLabel: {
    fontSize: 12,
    color: '#1976D2',
    marginBottom: 4,
  },
  propertyInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: 'white',
  },
  removePropertyButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPropertyButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0071c2',
    borderStyle: 'dashed',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#666',
  },
  cancelButtonText: {
    color: '#1976D2',
    fontSize: 16,
    fontWeight: '600',
  },
  saveTemplateButton: {
    flex: 1,
    backgroundColor: '#003580',
  },
  saveTemplateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  autoSaveInfo: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 8,
  },
  autoSaveText: {
    fontSize: 14,
    color: '#0369a1',
    textAlign: 'center',
    fontWeight: '500',
  },
  headerWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleWithIcon: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  vatInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
    padding: 12,
    borderRadius: 6,
    marginTop: 16,
  },
  vatInfoText: {
    flex: 1,
    marginLeft: 8,
  },
  vatInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 4,
  },
  vatInfoDescription: {
    fontSize: 13,
    color: '#0369a1',
    lineHeight: 18,
  },
  labelWithInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoButton: {
    padding: 4,
  },
  vatExpandedInfo: {
    overflow: 'hidden',
    marginBottom: 8,
  },
  currencyExpandedInfo: {
    overflow: 'hidden',
    marginBottom: 8,
  },
  emailExpandedInfo: {
    overflow: 'hidden',
    marginBottom: 8,
  },
  emailInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
    padding: 12,
    borderRadius: 6,
  },
  emailInfoText: {
    flex: 1,
    marginLeft: 8,
  },
  emailInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 4,
  },
  emailInfoDescription: {
    fontSize: 13,
    color: '#0369a1',
    lineHeight: 18,
  },
  resetEmailButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1976D2',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  resetEmailText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
  },
  vatInput: {
    borderWidth: 2,
    borderColor: '#e7e7e7',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#001A40',
    textAlign: 'center',
    fontWeight: '600',
  },
  // Styles pour la section devise
  currencyInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
    padding: 12,
    borderRadius: 6,
  },
  currencyInfoText: {
    flex: 1,
    marginLeft: 8,
  },
  currencyInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 4,
  },
  currencyInfoDescription: {
    fontSize: 13,
    color: '#0369a1',
    lineHeight: 18,
  },
});