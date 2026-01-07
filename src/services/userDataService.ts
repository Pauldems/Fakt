import { db } from '../config/firebaseConfig';
import { 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OwnerSettings, PropertyTemplate } from '../features/settings/SettingsScreen';
import { Client } from './clientService';
import { cleanForFirebase, convertNullToUndefined } from '../utils/firebaseUtils';

const ACTIVATION_DATA_KEY = 'app_activation_data';

/**
 * Service pour gérer les données utilisateur dans Firebase
 * Les données sont organisées par utilisateur (deviceId) :
 * 
 * users/{deviceId}/
 *   - settings/main (propriétés, configuration)
 *   - clients/{clientId} (carnet de clients)
 *   - invoices/{invoiceId} (factures)
 *   - counters/main (compteurs de numérotation)
 */
class UserDataService {
  
  /**
   * Récupère l'ID utilisateur depuis les données d'activation
   */
  async getUserId(): Promise<string | null> {
    try {
      const storedData = await AsyncStorage.getItem(ACTIVATION_DATA_KEY);
      if (!storedData) return null;

      const data = JSON.parse(storedData);
      return data.deviceId || null;
    } catch (error) {
      console.error('Erreur récupération userId:', error);
      return null;
    }
  }

  /**
   * Vérifie si l'utilisateur est connecté
   */
  async isUserConnected(): Promise<boolean> {
    const userId = await this.getUserId();
    return userId !== null;
  }

  // ============ PARAMÈTRES / PROPRIÉTÉS ============

  /**
   * Sauvegarde les paramètres utilisateur (propriétés, config)
   */
  async saveUserSettings(settings: OwnerSettings): Promise<void> {
    const userId = await this.getUserId();
    if (!userId) throw new Error('Utilisateur non connecté');

    try {
      // Nettoyer les valeurs undefined pour Firebase
      const settingsDoc = cleanForFirebase({
        ...settings,
        userId: userId, // Requis par les règles Firestore
        updatedAt: serverTimestamp(),
        createdAt: settings.createdAt || new Date().toISOString()
      });

      await setDoc(doc(db, 'users', userId, 'settings', 'main'), settingsDoc);
      console.log('✅ Paramètres sauvegardés dans Firebase');
    } catch (error) {
      console.error('❌ Erreur sauvegarde paramètres:', error);
      throw error;
    }
  }

  /**
   * Récupère les paramètres utilisateur
   */
  async getUserSettings(): Promise<OwnerSettings | null> {
    const userId = await this.getUserId();
    if (!userId) return null;

    try {
      const settingsDoc = await getDoc(doc(db, 'users', userId, 'settings', 'main'));
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        console.log('✅ Paramètres récupérés depuis Firebase');
        return data as OwnerSettings;
      }
      
      console.log('ℹ️ Aucun paramètre trouvé dans Firebase');
      return null;
    } catch (error) {
      console.error('❌ Erreur récupération paramètres:', error);
      return null;
    }
  }

  // ============ CLIENTS ============

  /**
   * Sauvegarde un client dans Firebase
   */
  async saveClient(client: Client): Promise<void> {
    const userId = await this.getUserId();
    if (!userId) throw new Error('Utilisateur non connecté');

    try {
      // Nettoyer les valeurs undefined pour Firebase
      const clientDoc = cleanForFirebase({
        ...client,
        userId: userId, // Requis par les règles Firestore
        lastUsed: client.lastUsed.toISOString(),
        updatedAt: serverTimestamp()
      });

      await setDoc(doc(db, 'users', userId, 'clients', client.id), clientDoc);
      console.log('✅ Client sauvegardé dans Firebase:', client.email);
    } catch (error) {
      console.error('❌ Erreur sauvegarde client:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les clients de l'utilisateur
   */
  async getClients(): Promise<Client[]> {
    const userId = await this.getUserId();
    if (!userId) return [];

    try {
      const clientsQuery = query(
        collection(db, 'users', userId, 'clients'),
        orderBy('lastUsed', 'desc')
      );
      
      const querySnapshot = await getDocs(clientsQuery);
      const clients: Client[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convertir les null en undefined pour TypeScript
        const convertedData = convertNullToUndefined(data);
        clients.push({
          id: convertedData.id,
          name: convertedData.name || '',
          firstName: convertedData.firstName || '',
          email: convertedData.email || '',
          address: convertedData.address,
          lastUsed: new Date(convertedData.lastUsed)
        } as Client);
      });

      console.log(`✅ ${clients.length} clients récupérés depuis Firebase`);
      return clients;
    } catch (error) {
      console.error('❌ Erreur récupération clients:', error);
      return [];
    }
  }

  /**
   * Supprime un client
   */
  async deleteClient(clientId: string): Promise<void> {
    const userId = await this.getUserId();
    if (!userId) throw new Error('Utilisateur non connecté');

    try {
      await deleteDoc(doc(db, 'users', userId, 'clients', clientId));
      console.log('✅ Client supprimé de Firebase:', clientId);
    } catch (error) {
      console.error('❌ Erreur suppression client:', error);
      throw error;
    }
  }

  // ============ FACTURES ============

  /**
   * Sauvegarde une facture
   */
  async saveInvoice(invoiceData: Record<string, unknown>): Promise<string> {
    const userId = await this.getUserId();
    if (!userId) throw new Error('Utilisateur non connecté');

    try {
      const invoiceDoc = {
        ...invoiceData,
        userId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'users', userId, 'invoices'), invoiceDoc);
      console.log('✅ Facture sauvegardée dans Firebase:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erreur sauvegarde facture:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les factures de l'utilisateur
   */
  async getInvoices(): Promise<Array<Record<string, unknown>>> {
    const userId = await this.getUserId();
    if (!userId) return [];

    try {
      const invoicesQuery = query(
        collection(db, 'users', userId, 'invoices'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(invoicesQuery);
      const invoices: Array<Record<string, unknown>> = [];

      querySnapshot.forEach((doc) => {
        invoices.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`✅ ${invoices.length} factures récupérées depuis Firebase`);
      return invoices;
    } catch (error) {
      console.error('❌ Erreur récupération factures:', error);
      return [];
    }
  }

  // ============ COMPTEURS ============

  /**
   * Récupère le prochain numéro de facture
   */
  async getNextInvoiceNumber(): Promise<string> {
    const userId = await this.getUserId();
    if (!userId) throw new Error('Utilisateur non connecté');

    try {
      const counterDoc = await getDoc(doc(db, 'users', userId, 'counters', 'main'));
      
      let nextNumber = 1;
      if (counterDoc.exists()) {
        const data = counterDoc.data();
        nextNumber = (data.lastInvoiceNumber || 0) + 1;
      }

      // Mettre à jour le compteur
      await setDoc(doc(db, 'users', userId, 'counters', 'main'), {
        userId: userId, // Requis par les règles Firestore
        lastInvoiceNumber: nextNumber,
        updatedAt: serverTimestamp()
      });

      // Formater le numéro (ex: 001, 032)
      const formattedNumber = nextNumber.toString().padStart(3, '0');
      console.log('✅ Prochain numéro de facture:', formattedNumber);
      return formattedNumber;
    } catch (error) {
      console.error('❌ Erreur récupération numéro facture:', error);
      // Fallback sur un numéro par défaut
      return '001';
    }
  }

  // ============ MIGRATION DES DONNÉES ============

  /**
   * Migre les données locales vers Firebase (à appeler après activation)
   */
  async migrateLocalDataToFirebase(): Promise<void> {
    const userId = await this.getUserId();
    if (!userId) {
      console.log('⚠️ Aucun utilisateur connecté pour la migration');
      return;
    }

    console.log('🔄 Début de la migration des données locales vers Firebase...');

    try {
      // 1. Migrer les paramètres/propriétés
      await this.migrateSettings();
      
      // 2. Migrer les clients
      await this.migrateClients();
      
      // 3. Migrer les factures (si stockées localement)
      await this.migrateInvoices();

      console.log('✅ Migration des données terminée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
    }
  }

  private async migrateSettings(): Promise<void> {
    try {
      // Récupérer les paramètres locaux
      const localSettings = await AsyncStorage.getItem('@fakt_settings');
      if (localSettings) {
        const settings = JSON.parse(localSettings);
        
        // Ne pas migrer si ce sont des données de test
        const hasTestData = settings.propertyTemplates?.some((prop: PropertyTemplate) =>
          prop.name?.includes('Test') || prop.name?.includes('test')
        );
        
        if (hasTestData) {
          console.log('🚫 Données de test détectées, migration ignorée');
          return;
        }
        
        // Ne migrer que si l'utilisateur a vraiment des données utiles
        const hasRealData = settings.propertyTemplates?.length > 0 || 
                           settings.companyName || 
                           settings.companyAddress;
        
        if (hasRealData) {
          await this.saveUserSettings(settings);
          console.log('✅ Paramètres migrés vers Firebase');
        } else {
          console.log('ℹ️ Aucune donnée utile à migrer');
        }
      }
    } catch (error) {
      console.error('❌ Erreur migration paramètres:', error);
    }
  }

  private async migrateClients(): Promise<void> {
    try {
      // Récupérer les clients locaux
      const localClients = await AsyncStorage.getItem('@fakt_clients');
      if (localClients) {
        const clients = JSON.parse(localClients);
        
        for (const client of clients) {
          // Convertir la date si nécessaire
          const clientData = {
            ...client,
            lastUsed: new Date(client.lastUsed)
          };
          await this.saveClient(clientData);
        }
        
        console.log(`✅ ${clients.length} clients migrés vers Firebase`);
      }
    } catch (error) {
      console.error('❌ Erreur migration clients:', error);
    }
  }

  private async migrateInvoices(): Promise<void> {
    try {
      // Si vous avez des factures stockées localement, les migrer ici
      // Pour l'instant, on assume qu'elles ne sont que générées
      console.log('ℹ️ Aucune facture locale à migrer');
    } catch (error) {
      console.error('❌ Erreur migration factures:', error);
    }
  }

  // ============ SYNCHRONISATION ============

  /**
   * Force une synchronisation complète avec Firebase
   */
  async syncWithFirebase(): Promise<void> {
    const userId = await this.getUserId();
    if (!userId) {
      console.log('⚠️ Aucun utilisateur connecté pour la synchronisation');
      return;
    }

    console.log('🔄 Synchronisation avec Firebase...');

    try {
      // Récupérer les données Firebase et les sauvegarder localement pour backup/cache
      const settings = await this.getUserSettings();
      if (settings) {
        await AsyncStorage.setItem('@fakt_settings', JSON.stringify(settings));
      }

      const clients = await this.getClients();
      const clientsForStorage = clients.map(client => ({
        ...client,
        lastUsed: client.lastUsed.toISOString()
      }));
      await AsyncStorage.setItem('@fakt_clients', JSON.stringify(clientsForStorage));

      console.log('✅ Synchronisation terminée');
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error);
    }
  }
}

export default new UserDataService();