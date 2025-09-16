import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Client {
  id: string;
  name: string;
  firstName: string;
  email: string;
  address?: string;
  lastUsed: Date;
}

const CLIENTS_STORAGE_KEY = '@fakt_clients';

class ClientService {
  async getClients(): Promise<Client[]> {
    try {
      console.log('ClientService.getClients - Récupération des clients...');
      const clientsJson = await AsyncStorage.getItem(CLIENTS_STORAGE_KEY);
      console.log('ClientService.getClients - JSON brut:', clientsJson);
      
      if (clientsJson) {
        const clients = JSON.parse(clientsJson);
        console.log('ClientService.getClients - Clients parsés:', clients);
        
        // Convertir les dates string en objets Date
        const clientsWithDates = clients.map((client: any) => ({
          ...client,
          lastUsed: new Date(client.lastUsed)
        }));
        
        console.log('ClientService.getClients - Nombre de clients:', clientsWithDates.length);
        return clientsWithDates;
      }
      
      console.log('ClientService.getClients - Aucun client trouvé');
      return [];
    } catch (error) {
      console.error('ClientService.getClients - Erreur:', error);
      return [];
    }
  }

  async saveClient(clientData: Omit<Client, 'id' | 'lastUsed'>): Promise<void> {
    try {
      console.log('ClientService.saveClient - Données à sauvegarder:', clientData);
      
      const clients = await this.getClients();
      console.log('ClientService.saveClient - Clients existants:', clients.length);
      
      // Vérifier si le client existe déjà (basé uniquement sur l'email qui est unique)
      const existingClientIndex = clients.findIndex(
        c => c.email === clientData.email
      );

      const newClient: Client = {
        ...clientData,
        id: existingClientIndex >= 0 ? clients[existingClientIndex].id : Date.now().toString(),
        lastUsed: new Date()
      };

      if (existingClientIndex >= 0) {
        // Mettre à jour le client existant
        console.log('ClientService.saveClient - Mise à jour du client existant');
        clients[existingClientIndex] = newClient;
      } else {
        // Ajouter le nouveau client
        console.log('ClientService.saveClient - Ajout d\'un nouveau client');
        clients.push(newClient);
      }

      // Trier par date d'utilisation récente
      clients.sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());

      // Limiter à 50 clients maximum
      const limitedClients = clients.slice(0, 50);

      console.log('ClientService.saveClient - Sauvegarde de', limitedClients.length, 'clients');
      await AsyncStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(limitedClients));
      console.log('ClientService.saveClient - Sauvegarde terminée avec succès');
    } catch (error) {
      console.error('ClientService.saveClient - Erreur:', error);
    }
  }

  async deleteClient(clientId: string): Promise<void> {
    try {
      const clients = await this.getClients();
      const filteredClients = clients.filter(c => c.id !== clientId);
      await AsyncStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(filteredClients));
    } catch (error) {
      console.error('Erreur lors de la suppression du client:', error);
    }
  }

  async searchClients(query: string): Promise<Client[]> {
    try {
      const clients = await this.getClients();
      const lowerQuery = query.toLowerCase();
      
      return clients.filter(client => 
        client.name.toLowerCase().includes(lowerQuery) ||
        client.firstName.toLowerCase().includes(lowerQuery) ||
        client.email.toLowerCase().includes(lowerQuery) ||
        (client.address && client.address.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      console.error('Erreur lors de la recherche de clients:', error);
      return [];
    }
  }
}

export default new ClientService();