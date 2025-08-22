import AsyncStorage from '@react-native-async-storage/async-storage';
import { SETTINGS_KEY, OwnerSettings } from '../features/settings/SettingsScreen';

export const checkSettingsComplete = async (): Promise<boolean> => {
  try {
    const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!savedSettings) return false;
    
    const settings: OwnerSettings = JSON.parse(savedSettings);
    return !!(
      settings.ownerFirstName &&
      settings.ownerLastName &&
      settings.companyName &&
      settings.companyAddress &&
      settings.companyCity &&
      settings.establishmentId &&
      settings.legalEntityId &&
      settings.phoneNumber &&
      settings.email
    );
  } catch (error) {
    return false;
  }
};