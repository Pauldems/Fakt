import AsyncStorage from '@react-native-async-storage/async-storage';
import userDataService from './userDataService';
import userInfoService from './userInfoService';
import { OwnerSettings, DEFAULT_SETTINGS } from '../features/settings/SettingsScreen';

export const SETTINGS_KEY = '@fakt_settings';

/**
 * Service hybride pour les paramètres/propriétés :
 * - Utilise Firebase si l'utilisateur est connecté
 * - Utilise AsyncStorage sinon (mode hors ligne)
 */
class HybridSettingsService {

  /**
   * Récupère les paramètres (Firebase ou local) avec infos d'activation
   */
  async getSettings(): Promise<OwnerSettings> {
    try {
      const isConnected = await userDataService.isUserConnected();
      console.log('🔗 Utilisateur connecté:', isConnected);
      
      if (isConnected) {
        console.log('📡 Récupération des paramètres depuis Firebase...');
        const firebaseSettings = await userDataService.getUserSettings();
        console.log('📊 Paramètres Firebase récupérés:', firebaseSettings);
        
        if (firebaseSettings) {
          console.log('🏠 Propriétés dans Firebase:', firebaseSettings.propertyTemplates?.length || 0);
          // Enrichir avec les infos d'activation
          const enrichedSettings = await this.enrichWithActivationInfo(firebaseSettings);
          console.log('✨ Paramètres enrichis:', enrichedSettings.propertyTemplates?.length || 0, 'propriétés');
          // Sauvegarder aussi localement pour le cache
          await this.saveSettingsToLocal(enrichedSettings);
          return enrichedSettings;
        }
      }
      
      console.log('💾 Récupération des paramètres depuis le stockage local...');
      const localSettings = await this.getSettingsFromLocal();
      console.log('📂 Paramètres locaux:', localSettings.propertyTemplates?.length || 0, 'propriétés');
      const enrichedLocal = await this.enrichWithActivationInfo(localSettings);
      console.log('✨ Paramètres locaux enrichis:', enrichedLocal.propertyTemplates?.length || 0, 'propriétés');
      return enrichedLocal;
      
    } catch (error) {
      console.error('❌ Erreur récupération paramètres, fallback local:', error);
      const localSettings = await this.getSettingsFromLocal();
      return await this.enrichWithActivationInfo(localSettings);
    }
  }

  /**
   * Sauvegarde les paramètres (Firebase ou local)
   */
  async saveSettings(settings: OwnerSettings): Promise<void> {
    try {
      const isConnected = await userDataService.isUserConnected();
      
      if (isConnected) {
        console.log('📡 Sauvegarde des paramètres dans Firebase...');
        await userDataService.saveUserSettings(settings);
        // Sauvegarder aussi localement pour le cache
        await this.saveSettingsToLocal(settings);
      } else {
        console.log('💾 Sauvegarde des paramètres localement...');
        await this.saveSettingsToLocal(settings);
      }
      
      console.log('✅ Paramètres sauvegardés');
    } catch (error) {
      console.error('❌ Erreur sauvegarde paramètres:', error);
      throw error;
    }
  }

  /**
   * Synchronise les paramètres avec Firebase
   */
  async syncWithFirebase(): Promise<void> {
    try {
      const isConnected = await userDataService.isUserConnected();
      if (!isConnected) {
        console.log('⚠️ Utilisateur non connecté, synchronisation impossible');
        return;
      }

      console.log('🔄 Synchronisation des paramètres avec Firebase...');
      
      // Récupérer les paramètres Firebase
      const firebaseSettings = await userDataService.getUserSettings();
      
      if (firebaseSettings) {
        // Sauvegarder localement
        await this.saveSettingsToLocal(firebaseSettings);
        console.log('✅ Paramètres synchronisés depuis Firebase');
      } else {
        // Si pas de paramètres Firebase, envoyer les paramètres locaux
        const localSettings = await this.getSettingsFromLocal();
        if (localSettings.ownerName || localSettings.propertyTemplates.length > 0) {
          await userDataService.saveUserSettings(localSettings);
          console.log('✅ Paramètres locaux envoyés vers Firebase');
        }
      }
      
    } catch (error) {
      console.error('❌ Erreur synchronisation paramètres:', error);
    }
  }

  // ============ MÉTHODES PRIVÉES ============

  /**
   * Enrichit les paramètres avec les informations d'activation
   */
  private async enrichWithActivationInfo(settings: OwnerSettings): Promise<OwnerSettings> {
    try {
      const userInfo = await userInfoService.getUserInfo();
      
      if (userInfo) {
        return {
          ...settings,
          // Remplacer les infos propriétaire par celles de l'activation
          ownerName: userInfo.name,
          ownerFirstName: userInfo.firstName,
          ownerLastName: userInfo.lastName,
          email: userInfo.email,
        };
      }
      
      return settings;
    } catch (error) {
      console.error('❌ Erreur enrichissement avec infos activation:', error);
      return settings;
    }
  }

  private async getSettingsFromLocal(): Promise<OwnerSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
      
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        return { ...DEFAULT_SETTINGS, ...settings };
      }
      
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('❌ Erreur récupération paramètres locaux:', error);
      return DEFAULT_SETTINGS;
    }
  }

  private async saveSettingsToLocal(settings: OwnerSettings): Promise<void> {
    try {
      // Ne pas sauvegarder les infos d'activation dans les paramètres locaux
      // car elles sont récupérées dynamiquement
      const settingsToSave = {
        ...settings,
        ownerName: '', // Ne pas sauvegarder - récupéré depuis activation
        ownerFirstName: '', // Ne pas sauvegarder - récupéré depuis activation
        ownerLastName: '', // Ne pas sauvegarder - récupéré depuis activation
        email: '', // Ne pas sauvegarder - récupéré depuis activation
      };
      
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsToSave));
    } catch (error) {
      console.error('❌ Erreur sauvegarde paramètres locaux:', error);
      throw error;
    }
  }
}

export default new HybridSettingsService();