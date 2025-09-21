import { db } from '../config/firebaseConfig';
import { 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userDataService from './userDataService';
import { LocalDataCleanup } from '../utils/cleanupLocalData';

const ACTIVATION_KEY = 'app_activation_code';
const ACTIVATION_DATA_KEY = 'app_activation_data';

export interface ActivationData {
  code: string;
  type: 'lifetime' | 'annual' | 'monthly' | 'quarterly' | 'trial';
  activatedAt: Date;
  expiresAt: Date | null;
  deviceId: string;
  isActive: boolean;
  name: string;
  email: string;
}

class ActivationService {
  async validateCodeOnly(code: string): Promise<{ success: boolean; message: string }> {
    try {
      // Le code arrive déjà nettoyé (sans tirets), on le reformate avec tirets
      const cleanCode = code.replace(/-/g, '').toUpperCase();
      
      // Reformater le code avec les tirets pour chercher dans Firebase
      let codeToSearch = '';
      for (let i = 0; i < cleanCode.length && i < 16; i++) {
        if (i > 0 && i % 4 === 0) {
          codeToSearch += '-';
        }
        codeToSearch += cleanCode[i];
      }
      
      console.log('🔍 Code recherché dans Firebase:', codeToSearch);
      
      // Vérifier si le code existe et est valide
      const codeDoc = await getDoc(doc(db, 'activationCodes', codeToSearch));
      
      if (!codeDoc.exists()) {
        return { success: false, message: 'Code d\'activation invalide' };
      }

      const codeData = codeDoc.data();
      
      if (codeData.status !== 'unused') {
        return { success: false, message: 'Ce code a déjà été utilisé sur un autre appareil' };
      }

      return { success: true, message: 'Code valide' };
    } catch (error: any) {
      console.error('Erreur lors de la validation du code:', error);
      return { success: false, message: 'Erreur de connexion. Vérifiez votre internet.' };
    }
  }

  async activateApp(code: string, name: string, email: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔍 Début activateApp:', { code, name, email });
      
      // 1. Le code arrive avec tirets depuis l'écran d'activation
      // On s'assure qu'il est bien formaté pour la recherche Firebase
      const codeToSearch = code.toUpperCase();
      console.log('📝 Code recherché:', codeToSearch);
      
      // 2. Vérifier si le code existe et est valide
      const codeDoc = await getDoc(doc(db, 'activationCodes', codeToSearch));
      console.log('📄 Document trouvé:', codeDoc.exists());
      
      if (!codeDoc.exists()) {
        return { success: false, message: 'Code d\'activation invalide' };
      }

      const codeData = codeDoc.data();
      
      if (codeData.status !== 'unused') {
        return { success: false, message: 'Ce code a déjà été utilisé sur un autre appareil' };
      }

      // 3. Générer un ID unique pour cet appareil
      const deviceId = await this.getOrCreateDeviceId();

      // 4. Calculer la date d'expiration selon le type
      let expiresAt = null;
      const now = new Date();
      
      switch (codeData.type) {
        case 'trial':
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 jours
          break;
        case 'monthly':
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 jours
          break;
        case 'quarterly':
          expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 jours
          break;
        case 'annual':
          expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 365 jours
          break;
        case 'lifetime':
          expiresAt = null; // Pas d'expiration
          break;
      }

      // 5. Préparer les données d'activation
      const activationData: ActivationData = {
        code: codeToSearch,
        type: codeData.type,
        activatedAt: now,
        expiresAt: expiresAt,
        deviceId: deviceId,
        isActive: true,
        name: name,
        email: email
      };

      // 6. Sauvegarder localement AVANT de marquer le code comme utilisé
      console.log('💾 Sauvegarde locale...');
      await AsyncStorage.setItem(ACTIVATION_KEY, codeToSearch);
      await AsyncStorage.setItem(ACTIVATION_DATA_KEY, JSON.stringify({
        ...activationData,
        activatedAt: activationData.activatedAt.toISOString(),
        expiresAt: activationData.expiresAt?.toISOString() || null
      }));
      console.log('✅ Sauvegarde locale terminée');

      // 7. Sauvegarder les infos utilisateur dans Firebase
      console.log('☁️ Sauvegarde utilisateur Firebase...');
      await setDoc(doc(db, 'users', deviceId), {
        name: name,
        email: email,
        deviceId: deviceId,
        activationCode: codeToSearch,
        activationType: codeData.type,
        activatedAt: serverTimestamp(),
        expiresAt: expiresAt
      });
      console.log('✅ Sauvegarde utilisateur terminée');

      // 8. Marquer le code comme utilisé dans Firebase (une seule fois, pour toujours)
      console.log('🔒 Marquage du code comme utilisé...');
      await updateDoc(doc(db, 'activationCodes', codeToSearch), {
        status: 'used',
        usedAt: serverTimestamp(),
        deviceId: deviceId,
        activationType: codeData.type,
        userEmail: email,
        userName: name
      });
      console.log('✅ Code marqué comme utilisé');

      // 9. Nettoyer les données de test pour nouveau compte
      console.log('🧹 Nettoyage pour nouveau compte...');
      try {
        await LocalDataCleanup.fullCleanupForNewAccount();
        console.log('✅ Nettoyage terminé');
      } catch (cleanupError) {
        console.error('⚠️ Erreur nettoyage (non bloquante):', cleanupError);
      }

      // 10. Migrer les données locales vers Firebase (après nettoyage)
      console.log('📦 Migration des données locales...');
      try {
        await userDataService.migrateLocalDataToFirebase();
        console.log('✅ Migration des données terminée');
      } catch (migrationError) {
        console.error('⚠️ Erreur migration (non bloquante):', migrationError);
        // La migration échoue, mais l'activation reste valide
      }

      console.log('🎉 Activation complète avec succès !');
      return { success: true, message: 'Application activée avec succès !' };
    } catch (error: any) {
      console.error('Erreur lors de l\'activation:', error);
      return { success: false, message: 'Erreur lors de l\'activation. Vérifiez votre connexion internet.' };
    }
  }

  async isAppActivated(): Promise<boolean> {
    try {
      console.log('🔍 Vérification d\'activation...');
      
      // 1. Vérifier si on a des données locales
      const storedCode = await AsyncStorage.getItem(ACTIVATION_KEY);
      if (!storedCode) {
        console.log('❌ Aucun code stocké localement');
        return false;
      }

      const activationData = await this.getActivationData();
      if (!activationData) {
        console.log('❌ Aucune donnée d\'activation locale');
        return false;
      }

      // 2. VÉRIFIER LE CODE DANS FIREBASE (sécurité à distance)
      console.log('☁️ Vérification du code dans Firebase:', storedCode);
      try {
        const codeDoc = await getDoc(doc(db, 'activationCodes', storedCode));
        
        if (!codeDoc.exists()) {
          console.log('🚨 Code supprimé de Firebase - BLOCAGE');
          // Code supprimé = bloquer l'accès
          await this.resetActivation();
          return false;
        }

        const codeData = codeDoc.data();
        if (codeData.status === 'disabled') {
          console.log('🚨 Code désactivé par l\'admin - BLOCAGE');
          await this.resetActivation();
          return false;
        }
        
        if (codeData.status !== 'used') {
          console.log('🚨 Code non utilisé dans Firebase - BLOCAGE');
          // Code réinitialisé = bloquer l'accès
          await this.resetActivation();
          return false;
        }

        console.log('✅ Code validé dans Firebase');
      } catch (firebaseError) {
        console.log('⚠️ Erreur Firebase, utilisation du cache local:', firebaseError);
        // En cas d'erreur réseau, on autorise l'accès avec les données locales
      }

      // 3. Vérifier l'expiration locale
      if (activationData.type === 'lifetime') {
        console.log('✅ Licence complète validée');
        return true;
      }

      if (activationData.expiresAt) {
        const now = new Date();
        const isValid = activationData.expiresAt > now;
        console.log('📅 Vérification expiration:', isValid);
        return isValid;
      }

      console.log('✅ Activation validée');
      return true;
    } catch (error) {
      console.error('💥 Erreur lors de la vérification d\'activation:', error);
      return false;
    }
  }

  async getActivationData(): Promise<ActivationData | null> {
    try {
      const storedData = await AsyncStorage.getItem(ACTIVATION_DATA_KEY);
      if (!storedData) return null;

      const data = JSON.parse(storedData);
      
      // Convertir les dates string en objets Date
      return {
        ...data,
        activatedAt: new Date(data.activatedAt),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données d\'activation:', error);
      return null;
    }
  }

  async addNewCode(code: string): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Vérifier qu'on a déjà une activation existante
      const currentData = await this.getActivationData();
      if (!currentData) {
        return { success: false, message: 'Aucune activation trouvée. Activez d\'abord l\'application.' };
      }

      // 2. Formater le nouveau code avec tirets
      const formattedCode = code.replace(/-/g, '').toUpperCase();
      const codeToSearch = `FAKT-${formattedCode.substring(4, 8)}-${formattedCode.substring(8, 12)}-${formattedCode.substring(12, 16)}`;
      
      // 3. Vérifier si le nouveau code existe et est valide
      const codeDoc = await getDoc(doc(db, 'activationCodes', codeToSearch));
      
      if (!codeDoc.exists()) {
        return { success: false, message: 'Code d\'activation invalide' };
      }

      const codeData = codeDoc.data();
      
      if (codeData.status !== 'unused') {
        return { success: false, message: 'Ce code a déjà été utilisé' };
      }

      // 4. Calculer la nouvelle date d'expiration
      let newExpiresAt = null;
      const baseDate = currentData.expiresAt || new Date();
      
      switch (codeData.type) {
        case 'trial':
          newExpiresAt = new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          newExpiresAt = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarterly':
          newExpiresAt = new Date(baseDate.getTime() + 90 * 24 * 60 * 60 * 1000);
          break;
        case 'annual':
          newExpiresAt = new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000);
          break;
        case 'lifetime':
          newExpiresAt = null; // Upgrade vers lifetime
          break;
      }

      // 5. Mettre à jour les données d'activation
      const updatedData: ActivationData = {
        ...currentData,
        type: codeData.type === 'lifetime' ? 'lifetime' : currentData.type,
        expiresAt: newExpiresAt
      };

      // 6. Sauvegarder les nouvelles données
      await AsyncStorage.setItem(ACTIVATION_DATA_KEY, JSON.stringify({
        ...updatedData,
        activatedAt: updatedData.activatedAt.toISOString(),
        expiresAt: updatedData.expiresAt?.toISOString() || null
      }));

      // 7. Marquer le nouveau code comme utilisé
      await updateDoc(doc(db, 'activationCodes', codeToSearch), {
        status: 'used',
        usedAt: serverTimestamp(),
        deviceId: currentData.deviceId,
        activationType: codeData.type
      });

      return { success: true, message: 'Code ajouté avec succès ! Votre abonnement a été étendu.' };
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du code:', error);
      return { success: false, message: 'Erreur lors de l\'ajout du code. Veuillez réessayer.' };
    }
  }

  async resetActivation(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ACTIVATION_KEY);
      await AsyncStorage.removeItem(ACTIVATION_DATA_KEY);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
    }
  }

  private async getOrCreateDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        // Créer un ID unique basé sur l'heure et un nombre aléatoire
        deviceId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        await AsyncStorage.setItem('device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      return `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    }
  }

  async getDaysUntilExpiry(): Promise<number | null> {
    const activationData = await this.getActivationData();
    if (!activationData || activationData.type === 'lifetime' || !activationData.expiresAt) {
      return null; // Pas d'expiration
    }

    const now = new Date();
    const daysUntilExpiry = Math.ceil((activationData.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry;
  }

  async getActivationInfo(): Promise<{
    isActivated: boolean;
    type?: string;
    expiresAt?: Date | null;
    daysLeft?: number | null;
    code?: string;
  }> {
    const isActivated = await this.isAppActivated();
    if (!isActivated) {
      return { isActivated: false };
    }

    const data = await this.getActivationData();
    if (!data) {
      return { isActivated: false };
    }

    const daysLeft = await this.getDaysUntilExpiry();

    return {
      isActivated: true,
      type: data.type,
      expiresAt: data.expiresAt,
      daysLeft,
      code: data.code
    };
  }
}

export default new ActivationService();