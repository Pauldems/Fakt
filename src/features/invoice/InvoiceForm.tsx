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
import { InvoiceFormData, Extra } from '../../types/invoice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SETTINGS_KEY, DEFAULT_SETTINGS, OwnerSettings, PropertyTemplate } from '../settings/SettingsScreen';
import hybridSettingsService from '../../services/hybridSettingsService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import ClientSelector from '../../components/ClientSelector';
import clientService, { Client } from '../../services/clientService';
import invoiceCounterService from '../../services/invoiceCounterService';
import { ExtrasManager, validateExtras } from '../../components/ExtrasManager';
import { getCurrencySymbol } from '../../utils/currencyFormatter';

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
      extras: [],
    },
  });

  const [showErrors, setShowErrors] = useState(false);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [propertyTemplates, setPropertyTemplates] = useState<PropertyTemplate[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyTemplate | null>(null);
  const [invoiceLanguage, setInvoiceLanguage] = useState<'fr' | 'en' | 'es' | 'de' | 'it'>('fr');
  const [emailLanguage, setEmailLanguage] = useState<'fr' | 'en' | 'es' | 'de' | 'it'>('fr');
  const [currency, setCurrency] = useState<string>('EUR');
  const navigation = useNavigation<any>();
  const isBookingReservation = watch('isBookingReservation');
  const isClientInvoice = watch('isClientInvoice');
  const hasClientAddress = watch('hasClientAddress');
  const isPlatformCollectingTax = watch('isPlatformCollectingTax');
  const arrivalDate = watch('arrivalDate');
  const departureDate = watch('departureDate');

  // Charger le prochain numéro de facture au montage du composant
  useEffect(() => {
    const loadNextInvoiceNumber = async () => {
      try {
        const nextNumber = await invoiceCounterService.getNextInvoiceNumber();
        setValue('invoiceNumber', nextNumber);
        console.log('Prochain numéro de facture proposé:', nextNumber);
      } catch (error) {
        console.error('Erreur lors du chargement du prochain numéro:', error);
      }
    };
    loadNextInvoiceNumber();
  }, [setValue]);

  // Fonction pour auto-incrémenter le numéro lors de la génération
  const handleAutoIncrement = useCallback(async () => {
    try {
      const nextNumber = await invoiceCounterService.getNextInvoiceNumber();
      setValue('invoiceNumber', nextNumber);
      console.log('Numéro auto-incrémenté:', nextNumber);
    } catch (error) {
      console.error('Erreur lors de l\'auto-incrémentation:', error);
    }
  }, [setValue]);

  // Charger les templates de propriétés
  const loadPropertyTemplates = useCallback(async () => {
    try {
      console.log('Chargement des templates de propriétés...');
      const settings = await hybridSettingsService.getSettings();
      console.log('PropertyTemplates trouvés:', settings.propertyTemplates);
      
      setPropertyTemplates(settings.propertyTemplates || []);
      
      // Charger la devise sélectionnée
      setCurrency(settings.currency || 'EUR');
      
      // Sélectionner automatiquement le premier template si disponible
      if (settings.propertyTemplates && settings.propertyTemplates.length > 0) {
        setSelectedProperty(settings.propertyTemplates[0]);
        setValue('selectedPropertyId', settings.propertyTemplates[0].id);
      } else {
        console.log('Aucune propriété configurée');
        setSelectedProperty(null);
        setValue('selectedPropertyId', '');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des templates de propriétés:', error);
      setPropertyTemplates([]);
    }
  }, [setValue]);

  useEffect(() => {
    loadPropertyTemplates();
  }, [loadPropertyTemplates]);

  // Recharger les propriétés quand on revient sur l'écran
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Écran focalisé - rechargement des propriétés...');
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

  // Auto-remplir le prix quand une propriété avec un prix par défaut est sélectionnée
  useEffect(() => {
    if (selectedProperty && selectedProperty.defaultPrice !== undefined) {
      setValue('pricePerNight', selectedProperty.defaultPrice.toString());
    }
  }, [selectedProperty, setValue]);

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
    async (data) => {
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

      // Auto-incrémenter le numéro si le champ est vide
      if (!data.invoiceNumber || data.invoiceNumber.trim() === '') {
        const nextNumber = await invoiceCounterService.getNextInvoiceNumber();
        data.invoiceNumber = nextNumber;
        setValue('invoiceNumber', nextNumber);
      }

      // Convertir et enregistrer le client dans le carnet
      try {
        await clientService.saveClientFromInvoice(data);
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du client:', error);
      }

      // Valider les extras
      if (extras.length > 0 && !validateExtras(extras)) {
        setShowErrors(true);
        Alert.alert(
          'Erreur dans les extras',
          'Veuillez corriger les erreurs dans les extras :\n\n• Nom obligatoire\n• Prix valide (≥ 0)\n• Quantité valide (≥ 1)'
        );
        return;
      }

      // Ajouter les extras à la soumission
      data.extras = extras;
      
      // Ajouter les langues sélectionnées
      data.invoiceLanguage = invoiceLanguage;
      data.emailLanguage = emailLanguage;

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
          errorMessage += '• Numéro de facture invalide (seuls les chiffres)\n';
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

  // Fonction exposée pour recharger le prochain numéro
  const loadNextInvoiceNumber = useCallback(async () => {
    try {
      const nextNumber = await invoiceCounterService.getNextInvoiceNumber();
      setValue('invoiceNumber', nextNumber);
      console.log('Prochain numéro chargé:', nextNumber);
    } catch (error) {
      console.error('Erreur lors du rechargement du numéro:', error);
    }
  }, [setValue]);

  // Fonction pour vider tous les champs sauf le numéro de facture
  const resetFormFields = useCallback(() => {
    // Sauvegarder le numéro de facture actuel
    const currentInvoiceNumber = watch('invoiceNumber');
    
    // Réinitialiser tous les champs aux valeurs par défaut
    setValue('firstName', '');
    setValue('lastName', '');
    setValue('email', '');
    setValue('arrivalDate', '');
    setValue('departureDate', '');
    setValue('numberOfNights', '');
    setValue('pricePerNight', '');
    setValue('taxAmount', '');
    setValue('isPlatformCollectingTax', false);
    setValue('invoiceDate', '');
    setValue('isGeniusRate', false);
    setValue('isBookingReservation', false);
    setValue('bookingNumber', '');
    setValue('isClientInvoice', false);
    setValue('clientInvoiceNumber', '');
    setValue('hasClientAddress', false);
    setValue('clientAddress', '');
    setValue('clientPostalCode', '');
    setValue('clientCity', '');
    setValue('selectedPropertyId', '');
    
    // Remettre le numéro de facture (déjà mis à jour)
    setValue('invoiceNumber', currentInvoiceNumber);
    
    // Réinitialiser l'état des erreurs
    setShowErrors(false);
    
    // Remettre selectedProperty à null
    setSelectedProperty(null);
    
    console.log('Formulaire réinitialisé, numéro conservé:', currentInvoiceNumber);
  }, [setValue, watch, setShowErrors, setSelectedProperty]);

  useImperativeHandle(ref, () => ({
    submit: onSubmitWithValidation,
    loadNextInvoiceNumber,
    resetFormFields,
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
          <Text style={styles.sectionTitle}>Propriété</Text>
          
          {propertyTemplates.length === 0 ? (
            <View style={styles.noPropertyContainer}>
              <Ionicons name="home-outline" size={48} color="#cccccc" style={styles.noPropertyIcon} />
              <Text style={styles.noPropertyText}>
                Créez votre première propriété
              </Text>
              <Text style={styles.noPropertySubtext}>
                Configurez vos propriétés pour commencer à générer des factures personnalisées
              </Text>
              <TouchableOpacity
                style={styles.createPropertyButton}
                onPress={() => navigation.navigate('Settings')}
              >
                <Ionicons name="add-circle" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.createPropertyText}>Créer votre propriété</Text>
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

        {/* Section Extras/Suppléments */}
        <ExtrasManager 
          extras={extras}
          onChange={setExtras}
          showErrors={showErrors}
        />

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Facture</Text>

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
            <Text style={styles.label}>Prix par nuit ({getCurrencySymbol(currency)})</Text>
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
              <Text style={styles.label}>Taxe de séjour ({getCurrencySymbol(currency)})</Text>
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
            <Text style={styles.label}>Numéro de facture</Text>
            <Controller
              control={control}
              name="invoiceNumber"
              rules={{ 
                required: false, // Plus obligatoire car auto-généré
                pattern: {
                  value: /^\d{1,}$/,
                  message: 'Seuls les chiffres sont autorisés'
                }
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    showErrors && errors.invoiceNumber && styles.inputError
                  ]}
                  onBlur={onBlur}
                  onChangeText={(text) => {
                    // Ne garder que les chiffres
                    const numbersOnly = text.replace(/\D/g, '');
                    onChange(numbersOnly);
                  }}
                  value={value}
                  placeholder="001"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              )}
            />
            {showErrors && errors.invoiceNumber && (
              <Text style={styles.error}>{errors.invoiceNumber.message}</Text>
            )}
            <Text style={styles.helperText}>
              Saisissez seulement le numéro (ex: 001, 032)
            </Text>
            <Text style={styles.helperTextExample}>
              Le format final sera généré automatiquement avec la date : FACT09-2025-032
            </Text>
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

        {/* Section Langues */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Langues</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Langue de la facture</Text>
            <View style={styles.languageSelector}>
              {[
                { code: 'fr', label: 'Français', flag: '🇫🇷' },
                { code: 'en', label: 'English', flag: '🇬🇧' },
                { code: 'es', label: 'Español', flag: '🇪🇸' },
                { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
                { code: 'it', label: 'Italiano', flag: '🇮🇹' }
              ].map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    invoiceLanguage === lang.code && styles.languageOptionSelected
                  ]}
                  onPress={() => setInvoiceLanguage(lang.code as any)}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={[
                    styles.languageLabel,
                    invoiceLanguage === lang.code && styles.languageLabelSelected
                  ]}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Langue de l'email</Text>
            <View style={styles.languageSelector}>
              {[
                { code: 'fr', label: 'Français', flag: '🇫🇷' },
                { code: 'en', label: 'English', flag: '🇬🇧' },
                { code: 'es', label: 'Español', flag: '🇪🇸' },
                { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
                { code: 'it', label: 'Italiano', flag: '🇮🇹' }
              ].map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    emailLanguage === lang.code && styles.languageOptionSelected
                  ]}
                  onPress={() => setEmailLanguage(lang.code as any)}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={[
                    styles.languageLabel,
                    emailLanguage === lang.code && styles.languageLabelSelected
                  ]}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
    padding: 32,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  noPropertyIcon: {
    marginBottom: 16,
  },
  noPropertyText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  noPropertySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  createPropertyButton: {
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createPropertyText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  // Ancien bouton pour backwards compatibility
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
  helperText: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
    paddingLeft: 2,
  },
  helperTextExample: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    paddingLeft: 2,
    fontStyle: 'italic',
  },
  languageSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e7e7e7',
    backgroundColor: '#f8f9fa',
    minWidth: 80,
  },
  languageOptionSelected: {
    borderColor: '#0071c2',
    backgroundColor: '#e3f2fd',
  },
  languageFlag: {
    fontSize: 16,
    marginRight: 6,
  },
  languageLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  languageLabelSelected: {
    color: '#0071c2',
    fontWeight: '600',
  },
});