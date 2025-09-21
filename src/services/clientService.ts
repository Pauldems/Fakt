import hybridClientService from './hybridClientService';

export interface Client {
  id: string;
  name: string;
  firstName: string;
  email: string;
  address?: string;
  lastUsed: Date;
}

// Service principal qui délègue au service hybride
class ClientService {
  async getClients(): Promise<Client[]> {
    return await hybridClientService.getClients();
  }

  async saveClient(clientData: Omit<Client, 'id' | 'lastUsed'>): Promise<void> {
    return await hybridClientService.saveClient(clientData);
  }

  async saveClientFromInvoice(invoiceData: any): Promise<void> {
    return await hybridClientService.saveClientFromInvoice(invoiceData);
  }

  async deleteClient(clientId: string): Promise<void> {
    return await hybridClientService.deleteClient(clientId);
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

  /**
   * Synchronise les données avec Firebase
   */
  async syncWithFirebase(): Promise<void> {
    return await hybridClientService.syncWithFirebase();
  }
}

export default new ClientService();