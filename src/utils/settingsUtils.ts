import AsyncStorage from '@react-native-async-storage/async-storage';
import { SETTINGS_KEY, OwnerSettings } from '../features/settings/SettingsScreen';
import hybridSettingsService from '../services/hybridSettingsService';

export interface SettingsCheckResult {
  isComplete: boolean;
  missingFields: string[];
}

export const checkSettingsComplete = async (): Promise<boolean> => {
  const result = await checkSettingsDetailed();
  return result.isComplete;
};

export const checkSettingsDetailed = async (): Promise<SettingsCheckResult> => {
  try {
    // Utiliser le service hybride qui charge Firebase + AsyncStorage
    const settings: OwnerSettings = await hybridSettingsService.getSettings();
    const missingFields: string[] = [];

    // Vérifier les informations personnelles
    if (!settings.ownerFirstName) missingFields.push('Votre prénom');
    if (!settings.ownerLastName) missingFields.push('Votre nom');
    if (!settings.phoneNumber) missingFields.push('Votre téléphone');
    if (!settings.email) missingFields.push('Votre email');

    // Vérifier qu'au moins une propriété est configurée
    const hasProperty = settings.propertyTemplates && settings.propertyTemplates.length > 0;

    if (!hasProperty) {
      missingFields.push('Au moins une propriété (dans Gestion des propriétés)');
    } else {
      // Vérifier que la propriété a les champs obligatoires remplis
      const property = settings.propertyTemplates[0];
      const hasAddress = property.properties.find(p => p.label === 'Adresse')?.value;
      const hasPostalCode = property.properties.find(p => p.label === 'Code postal')?.value;
      const hasCity = property.properties.find(p => p.label === 'Ville')?.value;
      const hasEstablishmentId = property.properties.find(p => p.label === 'Identifiant établissement')?.value;
      const hasLegalEntityId = property.properties.find(p => p.label === 'Entité juridique')?.value;

      if (!hasAddress) missingFields.push('Adresse de la propriété');
      if (!hasPostalCode) missingFields.push('Code postal de la propriété');
      if (!hasCity) missingFields.push('Ville de la propriété');
      if (!hasEstablishmentId) missingFields.push('Identifiant établissement');
      if (!hasLegalEntityId) missingFields.push('Entité juridique');
    }

    return {
      isComplete: missingFields.length === 0,
      missingFields
    };
  } catch (error) {
    console.error('Erreur vérification paramètres:', error);
    return {
      isComplete: false,
      missingFields: ['Erreur lors de la vérification des paramètres']
    };
  }
};