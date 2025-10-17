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
import hybridInvoiceService from '../../services/hybridInvoiceService';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SETTINGS_KEY, DEFAULT_SETTINGS, OwnerSettings } from '../settings/SettingsScreen';
import { emailTranslations, getMonthName, getEmailTemplate } from '../../utils/emailTranslations';
import { translateEmailText } from '../../utils/emailTranslator';
import { generateInvoiceHTML } from '../../utils/pdfTemplate';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import clientService from '../../services/clientService';
import { useTheme } from '../../theme/ThemeContext';
import { ModernHeader } from '../../components/modern/ModernHeader';
import hybridSettingsService from '../../services/hybridSettingsService';
import deepLTranslateService from '../../services/deepLTranslateService';

const { width } = Dimensions.get('window');


export const InvoiceScreen: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const formRef = useRef<any>(null);
  const navigation = useNavigation<any>();
  const { theme } = useTheme();


  const handleFormSubmit = async (formData: InvoiceFormData) => {
    console.log('=== Début génération facture ===');
    console.log('Données du formulaire:', formData);
    
    // Vérifier si les paramètres sont remplis
    const { checkSettingsDetailed } = require('../../utils/settingsUtils');
    const settingsCheck = await checkSettingsDetailed();

    if (!settingsCheck.isComplete) {
      const missingList = settingsCheck.missingFields.map(field => `• ${field}`).join('\n');
      Alert.alert(
        'Paramètres incomplets',
        `Les informations suivantes sont manquantes :\n\n${missingList}\n\nVeuillez les remplir dans les paramètres.`,
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
        isPlatformCollectingTax: formData.isPlatformCollectingTax,
        invoiceDate: parseDate(formData.invoiceDate),
        isGeniusRate: formData.isGeniusRate,
        isBookingReservation: formData.isBookingReservation,
        bookingNumber: formData.bookingNumber,
        isClientInvoice: formData.isClientInvoice,
        clientInvoiceNumber: formData.clientInvoiceNumber,
        hasClientAddress: formData.hasClientAddress,
        clientAddress: formData.clientAddress,
        clientPostalCode: formData.clientPostalCode,
        clientCity: formData.clientCity,
        selectedPropertyId: formData.selectedPropertyId,
        extras: formData.extras,
        paymentMethod: formData.paymentMethod,
      };
      
      // Récupérer les langues sélectionnées
      const invoiceLanguage = formData.invoiceLanguage || 'fr';
      const emailLanguage = formData.emailLanguage || 'fr';
      console.log('Langues sélectionnées - Facture:', invoiceLanguage, 'Email:', emailLanguage);
      console.log('Données converties finales:', JSON.stringify(invoiceData, null, 2));

      // Sauvegarder immédiatement les informations du client dans le carnet
      console.log('Sauvegarde du client dans le carnet...');
      let clientAddress: string | undefined = undefined;
      if (formData.hasClientAddress && formData.clientAddress) {
        // Construire l'adresse complète si elle existe
        clientAddress = formData.clientAddress;
        if (formData.clientPostalCode && formData.clientCity) {
          clientAddress += `, ${formData.clientPostalCode} ${formData.clientCity}`;
        }
      }
      
      await clientService.saveClient({
        name: formData.lastName,
        firstName: formData.firstName,
        email: formData.email,
        address: clientAddress
      });
      console.log('Client sauvegardé dans le carnet');

      // Sauvegarder la facture et générer le PDF final avec la langue sélectionnée
      console.log('Sauvegarde de la facture avec langue:', invoiceLanguage);
      const savedInvoice = await hybridInvoiceService.saveInvoice(invoiceData, formData.invoiceNumber, invoiceLanguage);
      console.log('Facture sauvegardée:', savedInvoice);
      setPdfUri(savedInvoice.pdfUri);

      // Mettre à jour le formulaire avec le prochain numéro pour la prochaine facture
      if (formRef.current?.loadNextInvoiceNumber) {
        await formRef.current.loadNextInvoiceNumber();
      }

      // Vider tous les champs sauf le numéro de facture
      if (formRef.current?.resetFormFields) {
        formRef.current.resetFormFields();
      }

      // Proposer les options de partage avec la langue sélectionnée
      await shareInvoice(invoiceData, savedInvoice.pdfUri, emailLanguage);
    } catch (error) {
      console.error('ERREUR:', error);
      Alert.alert('Erreur', `Une erreur est survenue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsGenerating(false);
    }
  };


  const shareInvoice = async (invoiceData: InvoiceData, originalPdfUri: string, emailLanguage: 'fr' | 'en' | 'es' | 'de' | 'it') => {
    try {
      // Le PDF a déjà été généré avec la bonne langue, utiliser directement originalPdfUri
      const pdfUri = originalPdfUri;
      // Obtenir le mois et l'année de la réservation à partir de la date d'arrivée
      const arrivalDate = new Date(invoiceData.arrivalDate);
      const year = arrivalDate.getFullYear();

      // Charger les paramètres du propriétaire
      let ownerName = ''; 
      let cityName = ''; // Pas de valeur par défaut
      let settings: OwnerSettings | null = null;
      try {
        // Utiliser le service hybride pour charger les paramètres
        settings = await hybridSettingsService.getSettings();
        console.log('📧 Paramètres chargés:', {
          useCustomEmail: settings?.useCustomEmail,
          hasCustomSubject: !!settings?.customEmailSubject,
          hasCustomBody: !!settings?.customEmailBody
        });
        
        if (settings?.ownerName) {
          ownerName = settings.ownerName;
        }
        // Migration: utiliser prénom + nom si ownerName n'existe pas
        if (!ownerName && settings?.ownerFirstName && settings?.ownerLastName) {
          ownerName = `${settings.ownerFirstName} ${settings.ownerLastName}`;
        }
        // Utiliser directement la ville depuis les paramètres
        if (settings?.companyCity) {
          cityName = settings.companyCity;
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
      }

      // Utiliser la langue sélectionnée et le nom du mois traduit
      const monthName = getMonthName(arrivalDate.getMonth(), emailLanguage);

      let subject: string;
      let message: string;

      // Debug: vérifier les paramètres d'email personnalisé
      console.log('🔍 Paramètres email:', {
        useCustomEmail: settings?.useCustomEmail,
        hasCustomSubject: !!settings?.customEmailSubject,
        hasCustomBody: !!settings?.customEmailBody,
        customSubject: settings?.customEmailSubject,
        customBody: settings?.customEmailBody?.substring(0, 100) + '...'
      });

      if (settings?.useCustomEmail && settings.customEmailSubject && settings.customEmailBody) {
        console.log('✅ Utilisation de l\'email personnalisé');

        // ÉTAPE 1 : Traduire D'ABORD (avec les variables {})
        let customSubject = settings.customEmailSubject;
        let customMessage = settings.customEmailBody;

        if (emailLanguage !== 'fr' && deepLTranslateService.isLanguageSupported(emailLanguage)) {
          console.log('🌍 Traduction DeepL activée, traduction vers:', emailLanguage);
          try {
            customSubject = await deepLTranslateService.translateEmailText(customSubject, 'fr', emailLanguage);
            customMessage = await deepLTranslateService.translateEmailText(customMessage, 'fr', emailLanguage);
            console.log('✅ Email personnalisé traduit avec DeepL');
          } catch (error) {
            console.error('❌ Erreur traduction DeepL:', error);
            // Continuer avec le texte original
          }
        } else {
          console.log('📝 Email personnalisé sans traduction (français ou langue non supportée)');
        }

        // ÉTAPE 2 : Remplacer les variables APRÈS la traduction
        subject = customSubject
          .replace('{VILLE}', cityName.toUpperCase())
          .replace('{NOM}', invoiceData.lastName.toUpperCase())
          .replace('{PRENOM}', invoiceData.firstName)
          .replace('{MOIS}', monthName)
          .replace('{ANNEE}', year.toString());

        message = customMessage
          .replace('{VILLE}', cityName)
          .replace('{NOM}', invoiceData.lastName.toUpperCase())
          .replace('{PRENOM}', invoiceData.firstName)
          .replace('{NOM-PROPRIETAIRE}', settings.ownerLastName || '')
          .replace('{PRENOM-PROPRIETAIRE}', settings.ownerFirstName || '')
          .replace('{MOIS}', monthName)
          .replace('{ANNEE}', year.toString());
      } else {
        console.log('❌ Utilisation du template par défaut');
        // Utiliser le template par défaut dans la langue sélectionnée
        const template = getEmailTemplate(emailLanguage);
        subject = template.subject
          .replace('{VILLE}', cityName.toUpperCase())
          .replace('{NOM}', invoiceData.lastName.toUpperCase())
          .replace('{PRENOM}', invoiceData.firstName);

        message = template.body
          .replace('{VILLE}', cityName)
          .replace('{NOM}', invoiceData.lastName.toUpperCase())
          .replace('{PRENOM}', invoiceData.firstName)
          .replace('{NOM-PROPRIETAIRE}', settings?.ownerLastName || '')
          .replace('{PRENOM-PROPRIETAIRE}', settings?.ownerFirstName || '')
          .replace('{MOIS}', monthName)
          .replace('{ANNEE}', year.toString());
      }

      // Charger les paramètres BCC
      let bccRecipients: string[] = [];
      try {
        if (settings?.enableBcc && settings.bccEmail) {
          bccRecipients = [settings.bccEmail];
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres BCC:', error);
      }

      // Préparer le contenu de l'email avec signature si activée
      let emailBody = message;
      let isHtml = false;
      
      if (settings?.useSignature && settings.signatureImage) {
        // Créer un email HTML avec la signature intégrée
        isHtml = true;
        emailBody = `
          <html>
            <body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
              <div style="white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</div>
              <br>
              <div style="margin-top: 20px;">
                <img src="${settings.signatureImage}" style="max-width: 100px; height: auto;" alt="Signature" />
              </div>
            </body>
          </html>
        `;
      }

      const openWithDefaultMail = async () => {
        try {
          const isAvailable = await MailComposer.isAvailableAsync();
          if (!isAvailable) {
            Alert.alert('Email non disponible', 'Veuillez configurer un compte email sur votre appareil');
            return;
          }

          // Utiliser les paramètres BCC déjà chargés

          await MailComposer.composeAsync({
            recipients: [invoiceData.email],
            bccRecipients: bccRecipients,
            subject: subject,
            body: emailBody,
            isHtml: isHtml,
            attachments: [pdfUri],
          });
        } catch (error) {
          console.error('Erreur email par défaut:', error);
          Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application email par défaut.');
        }
      };

      // Ouvrir directement avec l'app mail par défaut
      await openWithDefaultMail();
      
      // Nettoyer le PDF temporaire
      try {
        await FileSystem.deleteAsync(pdfUri, { idempotent: true });
      } catch (error) {
        console.log('Impossible de supprimer le PDF temporaire:', error);
      }
      
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.primary,
    },
    formContainer: {
      flex: 1,
      marginTop: 20,
    },
  });

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Nouvelle Facture"
        subtitle="Créer une facture pour vos clients"
        icon="receipt"
        variant="default"
      />

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