import { db } from '../config/firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userDataService from './userDataService';
import { LocalDataCleanup } from '../utils/cleanupLocalData';
import logger from '../utils/logger';

// Initialiser les Cloud Functions
const functions = getFunctions();
const activateAppFunction = httpsCallable(functions, 'activateApp');
const validateCodeFunction = httpsCallable(functions, 'validateCode');

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
  /**
   * Valide un code via Cloud Function (sécurisé côté serveur)
   */
  async validateCodeOnly(code: string): Promise<{ success: boolean; message: string }> {
    try {
      // Formater le code avec tirets
      const cleanCode = code.replace(/-/g, '').toUpperCase();
      let codeToSearch = '';
      for (let i = 0; i < cleanCode.length && i < 16; i++) {
        if (i > 0 && i % 4 === 0) {
          codeToSearch += '-';
        }
        codeToSearch += cleanCode[i];
      }

      console.log('🔍 Validation du code via Cloud Function:', codeToSearch);

      // Appeler la Cloud Function pour valider
      const result = await validateCodeFunction({ code: codeToSearch });
      const data = result.data as { valid: boolean; message: string; type?: string };

      if (data.valid) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error: unknown) {
      console.error('Erreur lors de la validation du code:', error);
      const message = error instanceof Error ? error.message : 'Erreur de connexion. Vérifiez votre internet.';
      return { success: false, message };
    }
  }

  /**
   * Active l'application via Cloud Function (sécurisé côté serveur)
   * La validation et le marquage du code sont faits de manière atomique sur le serveur
   */
  async activateApp(code: string, name: string, email: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔐 Début activateApp via Cloud Function:', { code, name, email });

      // 1. Générer/récupérer le deviceId
      const deviceId = await this.getOrCreateDeviceId();
      const codeToSearch = code.toUpperCase();

      console.log('📱 Device ID:', deviceId);

      // 2. Appeler la Cloud Function pour activer (atomique et sécurisé)
      console.log('☁️ Appel de la Cloud Function activateApp...');
      const result = await activateAppFunction({
        code: codeToSearch,
        name: name,
        email: email,
        deviceId: deviceId
      });

      const data = result.data as {
        success: boolean;
        message: string;
        activationData?: {
          code: string;
          type: string;
          activatedAt: string;
          expiresAt: string | null;
          deviceId: string;
          isActive: boolean;
          name: string;
          email: string;
        };
      };

      if (!data.success || !data.activationData) {
        return { success: false, message: data.message || 'Erreur d\'activation' };
      }

      // 3. Sauvegarder localement les données d'activation retournées par le serveur
      console.log('💾 Sauvegarde locale des données d\'activation...');
      const activationData: ActivationData = {
        code: data.activationData.code,
        type: data.activationData.type as ActivationData['type'],
        activatedAt: new Date(data.activationData.activatedAt),
        expiresAt: data.activationData.expiresAt ? new Date(data.activationData.expiresAt) : null,
        deviceId: data.activationData.deviceId,
        isActive: data.activationData.isActive,
        name: data.activationData.name,
        email: data.activationData.email
      };

      await AsyncStorage.setItem(ACTIVATION_KEY, activationData.code);
      await AsyncStorage.setItem(ACTIVATION_DATA_KEY, JSON.stringify({
        ...activationData,
        activatedAt: activationData.activatedAt.toISOString(),
        expiresAt: activationData.expiresAt?.toISOString() || null
      }));
      console.log('✅ Sauvegarde locale terminée');

      // 4. Nettoyer les données de test pour nouveau compte
      console.log('🧹 Nettoyage pour nouveau compte...');
      try {
        await LocalDataCleanup.fullCleanupForNewAccount();
        console.log('✅ Nettoyage terminé');
      } catch (cleanupError) {
        console.error('⚠️ Erreur nettoyage (non bloquante):', cleanupError);
      }

      // 5. Migrer les données locales vers Firebase (après nettoyage)
      console.log('📦 Migration des données locales...');
      try {
        await userDataService.migrateLocalDataToFirebase();
        console.log('✅ Migration des données terminée');
      } catch (migrationError) {
        console.error('⚠️ Erreur migration (non bloquante):', migrationError);
      }

      console.log('🎉 Activation complète avec succès !');
      return { success: true, message: data.message };

    } catch (error: unknown) {
      console.error('❌ Erreur lors de l\'activation:', error);

      // Gérer les erreurs de la Cloud Function
      let message = 'Erreur lors de l\'activation. Vérifiez votre connexion internet.';
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === 'functions/not-found') {
        message = 'Code d\'activation invalide';
      } else if (firebaseError.code === 'functions/already-exists') {
        message = 'Ce code a déjà été utilisé sur un autre appareil';
      } else if (firebaseError.code === 'functions/permission-denied') {
        message = 'Ce code a été désactivé';
      } else if (firebaseError.message) {
        message = firebaseError.message;
      }

      return { success: false, message };
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
    } catch (error: unknown) {
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