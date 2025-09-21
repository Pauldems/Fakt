import AsyncStorage from '@react-native-async-storage/async-storage';
import userDataService from './userDataService';
import { Client } from './clientService';

const CLIENTS_STORAGE_KEY = '@fakt_clients';

/**
 * Service hybride pour les clients :
 * - Utilise Firebase si l'utilisateur est connecté
 * - Utilise AsyncStorage sinon (mode hors ligne)
 */
class HybridClientService {

  /**
   * Récupère tous les clients (Firebase ou local)
   */
  async getClients(): Promise<Client[]> {
    try {
      const isConnected = await userDataService.isUserConnected();
      
      if (isConnected) {
        console.log('📡 Récupération des clients depuis Firebase...');
        return await userDataService.getClients();
      } else {
        console.log('💾 Récupération des clients depuis le stockage local...');
        return await this.getClientsFromLocal();
      }
    } catch (error) {
      console.error('❌ Erreur récupération clients, fallback local:', error);
      // En cas d'erreur Firebase, utiliser le local
      return await this.getClientsFromLocal();
    }
  }

  /**
   * Sauvegarde un client (Firebase ou local)
   */
  async saveClient(clientData: Omit<Client, 'id' | 'lastUsed'>): Promise<void> {
    try {
      const clients = await this.getClients();
      
      // Vérifier si le client existe déjà (par email)
      const existingClientIndex = clients.findIndex(client => client.email === clientData.email);
      
      let client: Client;
      if (existingClientIndex >= 0) {
        // Mettre à jour le client existant
        client = {
          ...clients[existingClientIndex],
          ...clientData,
          lastUsed: new Date()
        };
        clients[existingClientIndex] = client;
      } else {
        // Créer un nouveau client
        client = {
          ...clientData,
          id: this.generateClientId(),
          lastUsed: new Date()
        };
        clients.push(client);
      }

      const isConnected = await userDataService.isUserConnected();
      
      if (isConnected) {
        console.log('📡 Sauvegarde du client dans Firebase...');
        await userDataService.saveClient(client);
        // Sauvegarder aussi localement pour le cache
        await this.saveClientsToLocal(clients);
      } else {
        console.log('💾 Sauvegarde du client localement...');
        await this.saveClientsToLocal(clients);
      }
      
      console.log('✅ Client sauvegardé:', client.email);
    } catch (error) {
      console.error('❌ Erreur sauvegarde client:', error);
      throw error;
    }
  }

  /**
   * Supprime un client (Firebase ou local)
   */
  async deleteClient(clientId: string): Promise<void> {
    try {
      const isConnected = await userDataService.isUserConnected();
      
      if (isConnected) {
        console.log('📡 Suppression du client dans Firebase...');
        await userDataService.deleteClient(clientId);
        // Supprimer aussi localement
        const clients = await this.getClientsFromLocal();
        const filteredClients = clients.filter(client => client.id !== clientId);
        await this.saveClientsToLocal(filteredClients);
      } else {
        console.log('💾 Suppression du client localement...');
        const clients = await this.getClientsFromLocal();
        const filteredClients = clients.filter(client => client.id !== clientId);
        await this.saveClientsToLocal(filteredClients);
      }
      
      console.log('✅ Client supprimé:', clientId);
    } catch (error) {
      console.error('❌ Erreur suppression client:', error);
      throw error;
    }
  }

  /**
   * Sauvegarde automatique d'un client depuis une facture
   */
  async saveClientFromInvoice(invoiceData: any): Promise<void> {
    const clientData = {
      name: invoiceData.lastName,
      firstName: invoiceData.firstName,
      email: invoiceData.email,
      address: invoiceData.hasClientAddress ? 
        `${invoiceData.clientAddress}, ${invoiceData.clientPostalCode} ${invoiceData.clientCity}` : 
        undefined
    };

    await this.saveClient(clientData);
  }

  /**
   * Synchronise les données locales avec Firebase
   */
  async syncWithFirebase(): Promise<void> {
    try {
      const isConnected = await userDataService.isUserConnected();
      if (!isConnected) {
        console.log('⚠️ Utilisateur non connecté, synchronisation impossible');
        return;
      }

      console.log('🔄 Synchronisation des clients avec Firebase...');
      
      // Récupérer les clients Firebase
      const firebaseClients = await userDataService.getClients();
      
      // Récupérer les clients locaux
      const localClients = await this.getClientsFromLocal();
      
      // Fusionner les données (Firebase prioritaire)
      const mergedClients = this.mergeClients(firebaseClients, localClients);
      
      // Sauvegarder le résultat
      await this.saveClientsToLocal(mergedClients);
      
      // S'assurer que Firebase a tous les clients
      for (const client of mergedClients) {
        await userDataService.saveClient(client);
      }
      
      console.log(`✅ Synchronisation terminée: ${mergedClients.length} clients`);
    } catch (error) {
      console.error('❌ Erreur synchronisation clients:', error);
    }
  }

  // ============ MÉTHODES PRIVÉES ============

  private async getClientsFromLocal(): Promise<Client[]> {
    try {
      const clientsJson = await AsyncStorage.getItem(CLIENTS_STORAGE_KEY);
      
      if (clientsJson) {
        const clients = JSON.parse(clientsJson);
        
        // Convertir les dates string en objets Date
        return clients.map((client: any) => ({
          ...client,
          lastUsed: new Date(client.lastUsed)
        }));
      }
      
      return [];
    } catch (error) {
      console.error('❌ Erreur récupération clients locaux:', error);
      return [];
    }
  }

  private async saveClientsToLocal(clients: Client[]): Promise<void> {
    try {
      // Convertir les dates en string pour le stockage
      const clientsForStorage = clients.map(client => ({
        ...client,
        lastUsed: client.lastUsed.toISOString()
      }));
      
      await AsyncStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clientsForStorage));
    } catch (error) {
      console.error('❌ Erreur sauvegarde clients locaux:', error);
      throw error;
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private mergeClients(firebaseClients: Client[], localClients: Client[]): Client[] {
    const merged = [...firebaseClients];
    
    // Ajouter les clients locaux qui ne sont pas dans Firebase
    for (const localClient of localClients) {
      const existsInFirebase = firebaseClients.some(fc => fc.email === localClient.email);
      if (!existsInFirebase) {
        merged.push(localClient);
      }
    }
    
    // Trier par dernière utilisation
    return merged.sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());
  }
}

export default new HybridClientService();