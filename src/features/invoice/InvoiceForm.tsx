import React, { forwardRef, useImperativeHandle, useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { InvoiceFormData } from '../../types/invoice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SETTINGS_KEY, DEFAULT_SETTINGS, OwnerSettings, PropertyTemplate } from '../settings/SettingsScreen';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import ClientSelector from '../../components/ClientSelector';
import { Client } from '../../services/clientService';

interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormData) => void;
  isGenerating?: boolean;
}

export const InvoiceForm = forwardRef<any, InvoiceFormProps>(({ onSubmit, isGenerating }, ref) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
    setValue,
  } = useForm<InvoiceFormData>({
    mode: 'onSubmit',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      arrivalDate: '',
      departureDate: '',
      numberOfNights: '',
      pricePerNight: '',
      taxAmount: '',
      isPlatformCollectingTax: false,
      invoiceDate: '',
      invoiceNumber: '',
      isGeniusRate: false,
      isBookingReservation: false,
      bookingNumber: '',
      isClientInvoice: false,
      clientInvoiceNumber: '',
      hasClientAddress: false,
      clientAddress: '',
      clientPostalCode: '',
      clientCity: '',
      selectedPropertyId: '',
    },
  });

  const [showErrors, setShowErrors] = useState(false);
  const [propertyTemplates, setPropertyTemplates] = useState<PropertyTemplate[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyTemplate | null>(null);
  const navigation = useNavigation<any>();
  const isBookingReservation = watch('isBookingReservation');
  const isClientInvoice = watch('isClientInvoice');
  const hasClientAddress = watch('hasClientAddress');
  const isPlatformCollectingTax = watch('isPlatformCollectingTax');
  const arrivalDate = watch('arrivalDate');
  const departureDate = watch('departureDate');

  // Charger les templates de propriétés
  const loadPropertyTemplates = useCallback(async () => {
    try {
      console.log('Chargement des templates de propriétés...');
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      console.log('Settings récupérés:', savedSettings);
      
      if (savedSettings) {
        const settings: OwnerSettings = JSON.parse(savedSettings);
        console.log('PropertyTemplates trouvés:', settings.propertyTemplates);
        
        if (settings.propertyTemplates) {
          setPropertyTemplates(settings.propertyTemplates);
          // Sélectionner automatiquement le premier template si disponible
          if (settings.propertyTemplates.length > 0) {
            setSelectedProperty(settings.propertyTemplates[0]);
            setValue('selectedPropertyId', settings.propertyTemplates[0].id);
          }
        } else {
          console.log('Aucun propertyTemplates trouvé');
          setPropertyTemplates([]);
        }
      } else {
        console.log('Aucun settings sauvegardé');
        setPropertyTemplates([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des templates de propriétés:', error);
    }
  }, [setValue]);

  useEffect(() => {
    loadPropertyTemplates();
  }, [loadPropertyTemplates]);

  // Recharger les propriétés quand on revient sur l'écran
  useFocusEffect(
    useCallback(() => {
      loadPropertyTemplates();
    }, [loadPropertyTemplates])
  );

  // Fonction pour gérer la sélection d'un client
  const handleSelectClient = (client: Client) => {
    setValue('firstName', client.firstName);
    setValue('lastName', client.name);
    setValue('email', client.email);
    if (client.address) {
      // L'adresse stockée est au format "rue, code postal ville"
      const addressParts = client.address.split(',');
      if (addressParts.length >= 2) {
        // Première partie = adresse de rue
        setValue('clientAddress', addressParts[0].trim());
        setValue('hasClientAddress', true);  // Utiliser setValue au lieu de setHasClientAddress
        
        // Deuxième partie = code postal et ville
        const lastPart = addressParts[addressParts.length - 1].trim();
        const postalMatch = lastPart.match(/(\d{5})\s+(.*)/);
        if (postalMatch) {
          setValue('clientPostalCode', postalMatch[1]);
          setValue('clientCity', postalMatch[2]);
        }
      } else {
        // Si l'adresse n'est pas dans le format attendu, la mettre dans le champ adresse
        setValue('clientAddress', client.address);
        setValue('hasClientAddress', true);  // Utiliser setValue au lieu de setHasClientAddress
      }
    }
  };

  // Calculer automatiquement le nombre de nuits
  useEffect(() => {
    if (arrivalDate && departureDate) {
      try {
        // Parser les dates au format DD/MM/YYYY
        const parseDate = (dateStr: string) => {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          }
          return new Date(dateStr);
        };
        
        const arrival = parseDate(arrivalDate);
        const departure = parseDate(departureDate);
        
        if (!isNaN(arrival.getTime()) && !isNaN(departure.getTime())) {
          // Vérifier que la date de départ est après la date d'arrivée
          if (departure > arrival) {
            const diffTime = departure.getTime() - arrival.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setValue('numberOfNights', diffDays.toString());
          } else {
            // Si la date de départ est avant ou égale à la date d'arrivée
            setValue('numberOfNights', '0');
          }
        }
      } catch (error) {
        console.log('Erreur calcul nuits:', error);
      }
    }
  }, [arrivalDate, departureDate, setValue]);

  const onSubmitWithValidation = handleSubmit(
    (data) => {
      // Vérifier qu'une propriété est sélectionnée
      if (propertyTemplates.length === 0) {
        Alert.alert(
          'Aucune propriété',
          'Vous devez d\'abord créer une propriété dans les paramètres.',
          [
            {
              text: 'Aller aux paramètres',
              onPress: () => navigation.navigate('Settings')
            },
            {
              text: 'Annuler',
              style: 'cancel'
            }
          ]
        );
        return;
      }

      if (!selectedProperty) {
        Alert.alert('Erreur', 'Veuillez sélectionner une propriété');
        return;
      }

      // Si on arrive ici, toutes les validations sont OK
      onSubmit(data);
    },
    (fieldErrors) => {
      // Si on arrive ici, il y a des erreurs
      setShowErrors(true);
      
      // Construire le message d'erreur spécifique
      let errorMessage = 'Veuillez corriger les erreurs suivantes :\n\n';
      
      if (fieldErrors.firstName) {
        errorMessage += '• Prénom manquant\n';
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
      if (fieldErrors.lastName) {
        errorMessage += '• Nom manquant\n';
        if (!fieldErrors.firstName) scrollViewRef.current?.scrollTo({ y: 80, animated: true });
      }
      if (fieldErrors.email) {
        if (fieldErrors.email.type === 'required') {
          errorMessage += '• Email manquant\n';
        } else if (fieldErrors.email.type === 'pattern') {
          errorMessage += '• Format email invalide (ex: nom@email.com)\n';
        }
        if (!fieldErrors.firstName && !fieldErrors.lastName) scrollViewRef.current?.scrollTo({ y: 160, animated: true });
      }
      if (fieldErrors.arrivalDate) {
        errorMessage += '• Date d\'arrivée manquante\n';
      }
      if (fieldErrors.departureDate) {
        errorMessage += '• Date de départ manquante\n';
      }
      if (fieldErrors.pricePerNight) {
        if (fieldErrors.pricePerNight.message === 'Champ obligatoire') {
          errorMessage += '• Prix par nuit manquant\n';
        } else {
          errorMessage += '• Prix par nuit invalide\n';
        }
        if (!fieldErrors.firstName && !fieldErrors.lastName && !fieldErrors.email && !fieldErrors.numberOfNights) scrollViewRef.current?.scrollTo({ y: 320, animated: true });
      }
      if (fieldErrors.taxAmount && !isPlatformCollectingTax) {
        if (fieldErrors.taxAmount.message === 'Champ obligatoire') {
          errorMessage += '• Taxe de séjour manquante\n';
        } else {
          errorMessage += '• Taxe de séjour invalide\n';
        }
        if (!fieldErrors.firstName && !fieldErrors.lastName && !fieldErrors.email && !fieldErrors.numberOfNights && !fieldErrors.pricePerNight) scrollViewRef.current?.scrollTo({ y: 400, animated: true });
      }
      if (fieldErrors.invoiceDate) {
        errorMessage += '• Date de facture manquante\n';
      }
      if (fieldErrors.invoiceNumber) {
        if (fieldErrors.invoiceNumber.type === 'required') {
          errorMessage += '• Numéro de facture manquant\n';
        } else {
          errorMessage += '• Numéro de facture invalide (3 chiffres requis)\n';
        }
      }
      if (fieldErrors.bookingNumber && isBookingReservation) {
        errorMessage += '• Numéro de réservation manquant\n';
      }
      if (fieldErrors.clientInvoiceNumber && isClientInvoice) {
        errorMessage += '• Numéro de facture client manquant\n';
      }
      if (hasClientAddress) {
        if (fieldErrors.clientAddress) {
          errorMessage += '• Adresse client manquante\n';
        }
        if (fieldErrors.clientPostalCode) {
          errorMessage += '• Code postal client manquant\n';
        }
        if (fieldErrors.clientCity) {
          errorMessage += '• Ville client manquante\n';
        }
      }
      
      Alert.alert('Formulaire incomplet', errorMessage.trim());
    }
  );

  useImperativeHandle(ref, () => ({
    submit: onSubmitWithValidation,
  }));

  return (
    <ScrollView 
      ref={scrollViewRef} 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
        {/* Sélection de propriété */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Sélection de propriété</Text>
          
          {propertyTemplates.length === 0 ? (
            <View style={styles.noPropertyContainer}>
              <Text style={styles.noPropertyText}>
                Aucune propriété configurée
              </Text>
              <Text style={styles.noPropertySubtext}>
                Vous devez créer au moins une propriété avant de pouvoir générer une facture
              </Text>
              <TouchableOpacity
                style={styles.goToSettingsButton}
                onPress={() => navigation.navigate('Settings')}
              >
                <Ionicons name="settings-outline" size={16} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.goToSettingsText}>Créer une propriété</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Propriété :</Text>
              <View style={styles.propertyList}>
                {propertyTemplates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={[
                      styles.propertyItem,
                      selectedProperty?.id === template.id && styles.propertyItemSelected
                    ]}
                    onPress={() => {
                      setSelectedProperty(template);
                      setValue('selectedPropertyId', template.id);
                    }}
                  >
                    <View style={styles.propertyRadio}>
                      {selectedProperty?.id === template.id && <View style={styles.propertyRadioSelected} />}
                    </View>
                    <Text style={[
                      styles.propertyText,
                      selectedProperty?.id === template.id && styles.propertyTextSelected
                    ]}>
                      {template.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Informations client</Text>
          
          <ClientSelector onSelectClient={handleSelectClient} />
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Prénom</Text>
            <Controller
              control={control}
              name="firstName"
              rules={{ required: 'Champ obligatoire' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    showErrors && errors.firstName && styles.inputError
                  ]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder=""
                  placeholderTextColor="#999"
                />
              )}
            />
            {showErrors && errors.firstName && (
              <Text style={styles.error}>{errors.firstName.message}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nom</Text>
            <Controller
              control={control}
              name="lastName"
              rules={{ required: 'Champ obligatoire' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    showErrors && errors.lastName && styles.inputError
                  ]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder=""
                  placeholderTextColor="#999"
                />
              )}
            />
            {showErrors && errors.lastName && (
              <Text style={styles.error}>{errors.lastName.message}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <Controller
              control={control}
              name="email"
              rules={{
                required: 'Champ obligatoire',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email invalide',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    showErrors && errors.email && styles.inputError
                  ]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder=""
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />
            {showErrors && errors.email && (
              <Text style={styles.error}>{errors.email.message}</Text>
            )}
          </View>

          <View style={styles.switchGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Inclure l'adresse du client</Text>
              <Controller
                control={control}
                name="hasClientAddress"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: '#e7e7e7', true: '#003580' }}
                    thumbColor={value ? '#fff' : '#f4f3f4'}
                  />
                )}
              />
            </View>
          </View>

          {hasClientAddress && (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Adresse</Text>
                <Controller
                  control={control}
                  name="clientAddress"
                  rules={{ required: hasClientAddress ? 'Champ obligatoire' : false }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        showErrors && errors.clientAddress && styles.inputError
                      ]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder=""
                      placeholderTextColor="#999"
                    />
                  )}
                />
                {showErrors && errors.clientAddress && (
                  <Text style={styles.error}>{errors.clientAddress.message}</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Code postal</Text>
                <Controller
                  control={control}
                  name="clientPostalCode"
                  rules={{ 
                    required: hasClientAddress ? 'Champ obligatoire' : false,
                    pattern: hasClientAddress ? {
                      value: /^\d{5}$/,
                      message: 'Code postal invalide (5 chiffres)'
                    } : undefined
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        showErrors && errors.clientPostalCode && styles.inputError
                      ]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder=""
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  )}
                />
                {showErrors && errors.clientPostalCode && (
                  <Text style={styles.error}>{errors.clientPostalCode.message}</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ville</Text>
                <Controller
                  control={control}
                  name="clientCity"
                  rules={{ required: hasClientAddress ? 'Champ obligatoire' : false }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        showErrors && errors.clientCity && styles.inputError
                      ]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder=""
                      placeholderTextColor="#999"
                    />
                  )}
                />
                {showErrors && errors.clientCity && (
                  <Text style={styles.error}>{errors.clientCity.message}</Text>
                )}
              </View>
            </>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Détails de la réservation</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Date d'arrivée</Text>
            <Controller
              control={control}
              name="arrivalDate"
              rules={{ 
                required: 'Champ obligatoire',
                pattern: {
                  value: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
                  message: 'Format invalide. Utilisez JJ/MM/AAAA'
                },
                validate: (value) => {
                  const parts = value.split('/');
                  if (parts.length !== 3) return 'Format invalide';
                  const day = parseInt(parts[0]);
                  const month = parseInt(parts[1]);
                  const year = parseInt(parts[2]);
                  
                  // Vérifier les limites
                  if (month < 1 || month > 12) return 'Mois invalide';
                  if (day < 1 || day > 31) return 'Jour invalide';
                  if (year < 2020 || year > 2030) return 'Année doit être entre 2020 et 2030';
                  
                  // Vérifier les jours selon le mois
                  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                  // Année bissextile
                  if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
                    daysInMonth[1] = 29;
                  }
                  
                  if (day > daysInMonth[month - 1]) {
                    return `Le mois ${month} n'a que ${daysInMonth[month - 1]} jours`;
                  }
                  
                  return true;
                }
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    showErrors && errors.arrivalDate && styles.inputError
                  ]}
                  onBlur={onBlur}
                  onChangeText={(text) => {
                    // Si on supprime (texte plus court que la valeur actuelle)
                    if (text.length < value.length) {
                      // Si on supprime juste après un slash, supprimer aussi le slash
                      if (value.endsWith('/') && text === value.slice(0, -1)) {
                        onChange(text.slice(0, -1));
                        return;
                      }
                    }
                    
                    // Supprimer tous les caractères non numériques
                    const cleaned = text.replace(/\D/g, '');
                    
                    // Formater avec les slashes
                    let formatted = cleaned;
                    if (cleaned.length >= 2) {
                      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
                    }
                    if (cleaned.length >= 4) {
                      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
                    }
                    
                    onChange(formatted);
                  }}
                  value={value}
                  placeholder="JJ/MM/AAAA"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={10}
                />
              )}
            />
            {showErrors && errors.arrivalDate && (
              <Text style={styles.error}>{errors.arrivalDate.message}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Date de départ</Text>
            <Controller
              control={control}
              name="departureDate"
              rules={{ 
                required: 'Champ obligatoire',
                pattern: {
                  value: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
                  message: 'Format invalide. Utilisez JJ/MM/AAAA'
                },
                validate: (value) => {
                  // Valider le format de la date
                  const parts = value.split('/');
                  if (parts.length !== 3) return 'Format invalide';
                  const day = parseInt(parts[0]);
                  const month = parseInt(parts[1]);
                  const year = parseInt(parts[2]);
                  
                  // Vérifier les limites
                  if (month < 1 || month > 12) return 'Mois invalide';
                  if (day < 1 || day > 31) return 'Jour invalide';
                  if (year < 2020 || year > 2030) return 'Année doit être entre 2020 et 2030';
                  
                  // Vérifier les jours selon le mois
                  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                  // Année bissextile
                  if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
                    daysInMonth[1] = 29;
                  }
                  
                  if (day > daysInMonth[month - 1]) {
                    return `Le mois ${month} n'a que ${daysInMonth[month - 1]} jours`;
                  }
                  
                  // Vérifier que la date de départ est après la date d'arrivée
                  if (arrivalDate) {
                    const parseDate = (dateStr: string) => {
                      const parts = dateStr.split('/');
                      if (parts.length === 3) {
                        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                      }
                      return new Date(dateStr);
                    };
                    const arrival = parseDate(arrivalDate);
                    const departure = parseDate(value);
                    if (departure <= arrival) {
                      return 'La date de départ doit être après la date d\'arrivée';
                    }
                  }
                  
                  return true;
                }
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    showErrors && errors.departureDate && styles.inputError
                  ]}
                  onBlur={onBlur}
                  onChangeText={(text) => {
                    // Si on supprime (texte plus court que la valeur actuelle)
                    if (text.length < value.length) {
                      // Si on supprime juste après un slash, supprimer aussi le slash
                      if (value.endsWith('/') && text === value.slice(0, -1)) {
                        onChange(text.slice(0, -1));
                        return;
                      }
                    }
                    
                    // Supprimer tous les caractères non numériques
                    const cleaned = text.replace(/\D/g, '');
                    
                    // Formater avec les slashes
                    let formatted = cleaned;
                    if (cleaned.length >= 2) {
                      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
                    }
                    if (cleaned.length >= 4) {
                      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
                    }
                    
                    onChange(formatted);
                  }}
                  value={value}
                  placeholder="JJ/MM/AAAA"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={10}
                />
              )}
            />
            {showErrors && errors.departureDate && (
              <Text style={styles.error}>{errors.departureDate.message}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre de nuits (calculé automatiquement)</Text>
            <Controller
              control={control}
              name="numberOfNights"
              render={({ field: { value } }) => (
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={value !== undefined && value !== '' ? value.toString() : ''}
                  editable={false}
                />
              )}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Prix par nuit (€)</Text>
            <Controller
              control={control}
              name="pricePerNight"
              rules={{
                required: 'Champ obligatoire',
                validate: value => {
                  if (!value) return 'Champ obligatoire';
                  const num = parseFloat(value.toString().replace(',', '.'));
                  if (isNaN(num)) return 'Valeur invalide';
                  return num > 0 || 'Doit être supérieur à 0';
                }
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    showErrors && errors.pricePerNight && styles.inputError
                  ]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value?.toString() || ''}
                  placeholder=""
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                />
              )}
            />
            {showErrors && errors.pricePerNight && (
              <Text style={styles.error}>{errors.pricePerNight.message}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>La plateforme collecte la taxe de séjour</Text>
              <Controller
                control={control}
                name="isPlatformCollectingTax"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value}
                    onValueChange={(newValue) => {
                      onChange(newValue);
                      // Si la plateforme collecte la taxe, mettre la taxe à 0
                      if (newValue) {
                        setValue('taxAmount', '0');
                      }
                    }}
                    trackColor={{ false: '#767577', true: '#007AFF' }}
                    thumbColor={value ? '#ffffff' : '#f4f3f4'}
                  />
                )}
              />
            </View>
            {isPlatformCollectingTax && (
              <Text style={styles.switchHelperText}>
                La taxe de séjour ne sera pas incluse dans le total de la facture
              </Text>
            )}
          </View>

          {!isPlatformCollectingTax && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Taxe de séjour (€)</Text>
              <Controller
                control={control}
                name="taxAmount"
                rules={{
                  required: !isPlatformCollectingTax ? 'Champ obligatoire' : false,
                  validate: value => {
                    if (isPlatformCollectingTax) return true; // Pas de validation si la plateforme collecte
                    if (!value && value !== 0 && value !== '0') return 'Champ obligatoire';
                    const num = parseFloat(value.toString().replace(',', '.'));
                    if (isNaN(num)) return 'Valeur invalide';
                    return num >= 0 || 'Ne peut pas être négatif';
                  }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      showErrors && errors.taxAmount && styles.inputError
                    ]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value?.toString() || ''}
                    placeholder=""
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                  />
                )}
              />
              {showErrors && errors.taxAmount && (
                <Text style={styles.error}>{errors.taxAmount.message}</Text>
              )}
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Date de la facture</Text>
            <Controller
              control={control}
              name="invoiceDate"
              rules={{ 
                required: 'Champ obligatoire',
                pattern: {
                  value: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
                  message: 'Format invalide. Utilisez JJ/MM/AAAA'
                },
                validate: (value) => {
                  const parts = value.split('/');
                  if (parts.length !== 3) return 'Format invalide';
                  const day = parseInt(parts[0]);
                  const month = parseInt(parts[1]);
                  const year = parseInt(parts[2]);
                  
                  // Vérifier les limites
                  if (month < 1 || month > 12) return 'Mois invalide';
                  if (day < 1 || day > 31) return 'Jour invalide';
                  if (year < 2020 || year > 2030) return 'Année doit être entre 2020 et 2030';
                  
                  // Vérifier les jours selon le mois
                  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                  // Année bissextile
                  if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
                    daysInMonth[1] = 29;
                  }
                  
                  if (day > daysInMonth[month - 1]) {
                    return `Le mois ${month} n'a que ${daysInMonth[month - 1]} jours`;
                  }
                  
                  return true;
                }
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    showErrors && errors.invoiceDate && styles.inputError
                  ]}
                  onBlur={onBlur}
                  onChangeText={(text) => {
                    // Si on supprime (texte plus court que la valeur actuelle)
                    if (text.length < value.length) {
                      // Si on supprime juste après un slash, supprimer aussi le slash
                      if (value.endsWith('/') && text === value.slice(0, -1)) {
                        onChange(text.slice(0, -1));
                        return;
                      }
                    }
                    
                    // Supprimer tous les caractères non numériques
                    const cleaned = text.replace(/\D/g, '');
                    
                    // Formater avec les slashes
                    let formatted = cleaned;
                    if (cleaned.length >= 2) {
                      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
                    }
                    if (cleaned.length >= 4) {
                      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
                    }
                    
                    onChange(formatted);
                  }}
                  value={value}
                  placeholder="JJ/MM/AAAA"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={10}
                />
              )}
            />
            {showErrors && errors.invoiceDate && (
              <Text style={styles.error}>{errors.invoiceDate.message}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Numéro de facture (ex: 005)</Text>
            <Controller
              control={control}
              name="invoiceNumber"
              rules={{ 
                required: 'Champ obligatoire',
                pattern: {
                  value: /^\d{3}$/,
                  message: 'Le numéro doit contenir exactement 3 chiffres'
                }
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    showErrors && errors.invoiceNumber && styles.inputError
                  ]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="001"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={3}
                />
              )}
            />
            {showErrors && errors.invoiceNumber && (
              <Text style={styles.error}>{errors.invoiceNumber.message}</Text>
            )}
          </View>

          <View style={styles.switchGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Tarif Genius</Text>
              <Controller
                control={control}
                name="isGeniusRate"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: '#e7e7e7', true: '#003580' }}
                    thumbColor={value ? '#fff' : '#f4f3f4'}
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.switchGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Réservation Booking</Text>
              <Controller
                control={control}
                name="isBookingReservation"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: '#e7e7e7', true: '#003580' }}
                    thumbColor={value ? '#fff' : '#f4f3f4'}
                  />
                )}
              />
            </View>
          </View>

          {isBookingReservation && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Numéro de réservation</Text>
              <Controller
                control={control}
                name="bookingNumber"
                rules={{ required: isBookingReservation ? 'Champ obligatoire' : false }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      showErrors && errors.bookingNumber && styles.inputError
                    ]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder=""
                    placeholderTextColor="#999"
                  />
                )}
              />
              {showErrors && errors.bookingNumber && (
                <Text style={styles.error}>{errors.bookingNumber.message}</Text>
              )}
            </View>
          )}

          <View style={styles.switchGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Facture client</Text>
              <Controller
                control={control}
                name="isClientInvoice"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: '#e7e7e7', true: '#003580' }}
                    thumbColor={value ? '#fff' : '#f4f3f4'}
                  />
                )}
              />
            </View>
          </View>

          {isClientInvoice && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Numéro de facture client</Text>
              <Controller
                control={control}
                name="clientInvoiceNumber"
                rules={{ required: isClientInvoice ? 'Champ obligatoire' : false }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      showErrors && errors.clientInvoiceNumber && styles.inputError
                    ]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder=""
                    placeholderTextColor="#999"
                  />
                )}
              />
              {showErrors && errors.clientInvoiceNumber && (
                <Text style={styles.error}>{errors.clientInvoiceNumber.message}</Text>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isGenerating && styles.submitButtonDisabled]}
          onPress={onSubmitWithValidation}
          disabled={isGenerating}
        >
          <Text style={styles.submitButtonText}>
            {isGenerating ? 'Génération en cours...' : 'Générer la facture'}
          </Text>
        </TouchableOpacity>

    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  formSection: {
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
  formGroup: {
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
  inputError: {
    borderColor: '#d32f2f',
    backgroundColor: '#ffebee',
  },
  error: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#0071c2',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#bdbdbd',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    marginTop: 16,
    marginHorizontal: 16,
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  switchGroup: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  noPropertyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noPropertyText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  noPropertySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  goToSettingsButton: {
    backgroundColor: '#0071c2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goToSettingsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  propertyList: {
    marginTop: 8,
  },
  propertyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  propertyItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#0071c2',
  },
  propertyRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0071c2',
  },
  propertyText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  propertyTextSelected: {
    color: '#0071c2',
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  switchHelperText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    paddingLeft: 4,
  },
});