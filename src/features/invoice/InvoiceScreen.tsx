import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Share,
  ActionSheetIOS,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as MailComposer from 'expo-mail-composer';
import * as Sharing from 'expo-sharing';
import { InvoiceForm } from './InvoiceForm';
import { PDFService } from '../pdf/pdfService';
import { InvoiceFormData, InvoiceData } from '../../types/invoice';
import { Ionicons } from '@expo/vector-icons';
import { StorageService } from '../../services/storageService';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SETTINGS_KEY, DEFAULT_SETTINGS, OwnerSettings } from '../settings/SettingsScreen';

const { width } = Dimensions.get('window');

export const InvoiceScreen: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const formRef = useRef<any>(null);
  const navigation = useNavigation<any>();

  const handleFormSubmit = async (formData: InvoiceFormData) => {
    console.log('=== Début génération facture ===');
    console.log('Données du formulaire:', formData);
    
    // Vérifier si les paramètres sont remplis
    const { checkSettingsComplete } = require('../../utils/settingsUtils');
    const settingsComplete = await checkSettingsComplete();
    
    if (!settingsComplete) {
      Alert.alert(
        'Paramètres requis',
        'Veuillez d\'abord remplir vos informations dans les paramètres.',
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
    
    setIsGenerating(true);
    
    try {
      // Vérifier que toutes les données sont présentes
      console.log('Vérification des données du formulaire:');
      console.log('- firstName:', formData.firstName);
      console.log('- lastName:', formData.lastName);
      console.log('- email:', formData.email);
      console.log('- numberOfNights:', formData.numberOfNights, 'type:', typeof formData.numberOfNights);
      console.log('- pricePerNight:', formData.pricePerNight, 'type:', typeof formData.pricePerNight);
      console.log('- taxAmount:', formData.taxAmount, 'type:', typeof formData.taxAmount);
      console.log('- invoiceDate:', formData.invoiceDate);

      // Convertir les données du formulaire et s'assurer que les nombres sont bien des nombres
      const numberOfNights = typeof formData.numberOfNights === 'string' 
        ? parseInt(formData.numberOfNights) 
        : formData.numberOfNights;
      
      const pricePerNight = typeof formData.pricePerNight === 'string' 
        ? parseFloat(formData.pricePerNight.replace(',', '.')) 
        : formData.pricePerNight;
      
      const taxAmount = typeof formData.taxAmount === 'string' 
        ? parseFloat(formData.taxAmount.replace(',', '.')) 
        : formData.taxAmount;

      console.log('Valeurs converties:');
      console.log('- numberOfNights:', numberOfNights);
      console.log('- pricePerNight:', pricePerNight);
      console.log('- taxAmount:', taxAmount);

      // Parser les dates au format DD/MM/YYYY
      const parseDate = (dateStr: string) => {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        return new Date(dateStr);
      };

      const invoiceData: InvoiceData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        arrivalDate: parseDate(formData.arrivalDate),
        departureDate: parseDate(formData.departureDate),
        numberOfNights: numberOfNights,
        pricePerNight: pricePerNight,
        taxAmount: taxAmount,
        invoiceDate: parseDate(formData.invoiceDate),
        isGeniusRate: formData.isGeniusRate,
        isBookingReservation: formData.isBookingReservation,
        bookingNumber: formData.bookingNumber,
      };
      console.log('Données converties finales:', JSON.stringify(invoiceData, null, 2));

      // Sauvegarder la facture et générer le PDF final
      console.log('Sauvegarde de la facture...');
      const savedInvoice = await StorageService.saveInvoice(invoiceData, formData.invoiceNumber);
      console.log('Facture sauvegardée:', savedInvoice);
      setPdfUri(savedInvoice.pdfUri);

      // Proposer les options de partage
      await shareInvoice(invoiceData, savedInvoice.pdfUri);
    } catch (error) {
      console.error('ERREUR:', error);
      Alert.alert('Erreur', `Une erreur est survenue: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const shareInvoice = async (invoiceData: InvoiceData, pdfUri: string) => {
    try {
      // Obtenir le mois et l'année de la réservation à partir de la date d'arrivée
      const arrivalDate = new Date(invoiceData.arrivalDate);
      const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                         'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
      const monthName = monthNames[arrivalDate.getMonth()];
      const year = arrivalDate.getFullYear();
      
      // Gérer l'apostrophe pour les mois commençant par une voyelle
      const vowelMonths = ['avril', 'août', 'octobre'];
      const monthPrefix = vowelMonths.includes(monthName) ? "d'" : 'de ';

      // Charger les paramètres du propriétaire
      let ownerName = ''; 
      let cityName = ''; // Pas de valeur par défaut
      let settings: OwnerSettings | null = null;
      try {
        const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
          settings = JSON.parse(savedSettings);
          if (settings.ownerName) {
            ownerName = settings.ownerName;
          }
          // Migration: utiliser prénom + nom si ownerName n'existe pas
          if (!ownerName && settings.ownerFirstName && settings.ownerLastName) {
            ownerName = `${settings.ownerFirstName} ${settings.ownerLastName}`;
          }
          // Utiliser directement la ville depuis les paramètres
          if (settings.companyCity) {
            cityName = settings.companyCity;
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
      }

      let subject: string;
      let message: string;

      if (settings?.useCustomEmail && settings.customEmailSubject && settings.customEmailBody) {
        // Utiliser l'email personnalisé avec remplacement des variables
        subject = settings.customEmailSubject
          .replace('{VILLE}', cityName.toUpperCase())
          .replace('{NOM}', invoiceData.lastName.toUpperCase())
          .replace('{PRENOM}', invoiceData.firstName)
          .replace('{MOIS}', monthName)
          .replace('{ANNEE}', year.toString());

        message = settings.customEmailBody
          .replace('{VILLE}', cityName)
          .replace('{NOM-PROPRIETAIRE}', settings.ownerLastName || '')
          .replace('{PRENOM-PROPRIETAIRE}', settings.ownerFirstName || '')
          .replace('{MOIS}', monthName)
          .replace('{ANNEE}', year.toString());
      } else {
        // Utiliser l'email par défaut
        subject = `Facture séjour ${cityName.toUpperCase()} - ${invoiceData.lastName.toUpperCase()} ${invoiceData.firstName}`;
        message = `Bonjour,\n\nVeuillez trouver ci-joint la facture de votre séjour ${cityName} pour le mois ${monthPrefix}${monthName} ${year}.\n\nEn vous souhaitant bonne réception,\n\n${ownerName}`;
      }

      const openWithDefaultMail = async () => {
        try {
          const isAvailable = await MailComposer.isAvailableAsync();
          if (!isAvailable) {
            Alert.alert('Email non disponible', 'Veuillez configurer un compte email sur votre appareil');
            return;
          }

          // Charger les paramètres pour obtenir les options BCC
          let bccRecipients: string[] = [];
          try {
            const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
            if (savedSettings) {
              const settings: OwnerSettings = JSON.parse(savedSettings);
              if (settings.enableBcc && settings.bccEmail) {
                bccRecipients = [settings.bccEmail];
              }
            }
          } catch (error) {
            console.error('Erreur lors du chargement des paramètres BCC:', error);
          }

          await MailComposer.composeAsync({
            recipients: [invoiceData.email],
            bccRecipients: bccRecipients,
            subject: subject,
            body: message,
            attachments: [pdfUri],
          });
        } catch (error) {
          console.error('Erreur email par défaut:', error);
          Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application email par défaut.');
        }
      };

      // Ouvrir directement avec l'app mail par défaut
      await openWithDefaultMail();
      
      Alert.alert(
        'Succès',
        'Facture générée et sauvegardée avec succès',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('InvoiceList')
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      Alert.alert('Erreur', 'Impossible de partager la facture');
    }
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
          <View style={styles.iconContainer}>
            <Ionicons name="receipt" size={30} color="white" />
          </View>
          <Text style={styles.title}>Nouvelle Facture</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.formContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <InvoiceForm ref={formRef} onSubmit={handleFormSubmit} isGenerating={isGenerating} />
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
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  formContainer: {
    flex: 1,
    marginTop: 160,
  },
});