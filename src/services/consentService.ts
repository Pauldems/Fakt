import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_KEY = '@fakt_gdpr_consent';
const PRIVACY_POLICY_VERSION = '1.0'; // Version de la politique de confidentialité

export interface GDPRConsent {
  accepted: boolean;
  timestamp: string; // ISO date
  policyVersion: string;
  userName: string;
  userEmail: string;
}

class ConsentService {
  /**
   * Enregistre le consentement RGPD de l'utilisateur
   */
  async saveConsent(userName: string, userEmail: string): Promise<void> {
    try {
      const consent: GDPRConsent = {
        accepted: true,
        timestamp: new Date().toISOString(),
        policyVersion: PRIVACY_POLICY_VERSION,
        userName,
        userEmail,
      };

      await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
      console.log('✅ Consentement RGPD enregistré:', consent);
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement du consentement:', error);
      throw error;
    }
  }

  /**
   * Récupère le consentement RGPD enregistré
   */
  async getConsent(): Promise<GDPRConsent | null> {
    try {
      const consentJson = await AsyncStorage.getItem(CONSENT_KEY);
      if (!consentJson) return null;

      const consent: GDPRConsent = JSON.parse(consentJson);
      return consent;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du consentement:', error);
      return null;
    }
  }

  /**
   * Vérifie si l'utilisateur a donné son consentement
   */
  async hasConsent(): Promise<boolean> {
    try {
      const consent = await this.getConsent();
      return consent !== null && consent.accepted;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du consentement:', error);
      return false;
    }
  }

  /**
   * Vérifie si le consentement est à jour (même version de la politique)
   */
  async isConsentUpToDate(): Promise<boolean> {
    try {
      const consent = await this.getConsent();
      if (!consent) return false;

      return consent.policyVersion === PRIVACY_POLICY_VERSION;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de la version du consentement:', error);
      return false;
    }
  }

  /**
   * Révoque le consentement (supprime les données)
   */
  async revokeConsent(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CONSENT_KEY);
      console.log('✅ Consentement RGPD révoqué');
    } catch (error) {
      console.error('❌ Erreur lors de la révocation du consentement:', error);
      throw error;
    }
  }

  /**
   * Exporte le consentement pour le droit à la portabilité
   */
  async exportConsent(): Promise<GDPRConsent | null> {
    return await this.getConsent();
  }
}

export default new ConsentService();
