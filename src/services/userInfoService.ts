import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVATION_DATA_KEY = 'app_activation_data';

export interface UserInfo {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  deviceId: string;
  activationType: string;
}

/**
 * Service pour récupérer les informations utilisateur depuis l'activation
 */
class UserInfoService {

  /**
   * Récupère les informations utilisateur depuis les données d'activation
   */
  async getUserInfo(): Promise<UserInfo | null> {
    try {
      const storedData = await AsyncStorage.getItem(ACTIVATION_DATA_KEY);
      if (!storedData) return null;

      const data = JSON.parse(storedData);
      
      // Extraire prénom et nom depuis le nom complet
      const fullName = data.name || '';
      const nameParts = fullName.trim().split(' ');
      
      return {
        name: data.name || '',
        firstName: nameParts.length >= 1 ? nameParts[0] : '',
        lastName: nameParts.length >= 2 ? nameParts.slice(1).join(' ') : '',
        email: data.email || '',
        deviceId: data.deviceId || '',
        activationType: data.type || ''
      };
    } catch (error) {
      console.error('Erreur récupération infos utilisateur:', error);
      return null;
    }
  }

  /**
   * Vérifie si l'utilisateur est activé
   */
  async isUserActivated(): Promise<boolean> {
    const userInfo = await this.getUserInfo();
    return userInfo !== null;
  }

  /**
   * Récupère juste l'email de l'utilisateur activé
   */
  async getUserEmail(): Promise<string> {
    const userInfo = await this.getUserInfo();
    return userInfo?.email || '';
  }

  /**
   * Récupère le nom complet de l'utilisateur activé
   */
  async getUserName(): Promise<string> {
    const userInfo = await this.getUserInfo();
    return userInfo?.name || '';
  }

  /**
   * Récupère l'ID de l'appareil
   */
  async getDeviceId(): Promise<string> {
    const userInfo = await this.getUserInfo();
    return userInfo?.deviceId || '';
  }
}

export default new UserInfoService();