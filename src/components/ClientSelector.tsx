import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import clientService, { Client } from '../services/clientService';

interface ClientSelectorProps {
  onSelectClient: (client: Client) => void;
}

export default function ClientSelector({ onSelectClient }: ClientSelectorProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const loadedClients = await clientService.getClients();
      
      
      setClients(loadedClients);
      setFilteredClients(loadedClients);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      setClients([]);
      setFilteredClients([]);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(
        client =>
          client.name.toLowerCase().includes(query.toLowerCase()) ||
          client.firstName.toLowerCase().includes(query.toLowerCase()) ||
          client.email.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredClients(filtered);
    }
  };

  const handleSelectClient = (client: Client) => {
    onSelectClient(client);
    setIsModalVisible(false);
    setSearchQuery('');
  };

  const handleDeleteClient = (clientId: string) => {
    Alert.alert(
      'Supprimer le client',
      'Êtes-vous sûr de vouloir supprimer ce client du carnet ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await clientService.deleteClient(clientId);
            loadClients();
          },
        },
      ]
    );
  };

  const renderClient = ({ item }: { item: Client }) => {
    return (
      <View style={styles.clientItem}>
        <TouchableOpacity
          style={styles.clientInfo}
          onPress={() => handleSelectClient(item)}
        >
          <Text style={styles.clientName}>
            {item.firstName} {item.name}
          </Text>
          <Text style={styles.clientEmail}>{item.email}</Text>
          {item.address && (
            <Text style={styles.clientAddress}>{item.address}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteClient(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={async () => {
          await loadClients();
          setIsModalVisible(true);
        }}
      >
        <Ionicons name="people-outline" size={20} color="#007AFF" />
        <Text style={styles.buttonText}>Anciens clients</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Carnet de clients</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsModalVisible(false);
                  setSearchQuery('');
                }}
              >
                <Ionicons name="close" size={24} color="#003580" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un client..."
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>

            {filteredClients.length > 0 ? (
              <FlatList
                data={filteredClients}
                renderItem={renderClient}
                keyExtractor={(item) => item.id}
                style={styles.clientList}
                contentContainerStyle={filteredClients.length === 0 ? styles.emptyListContent : undefined}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                showsVerticalScrollIndicator={true}
                initialNumToRender={10}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? 'Aucun client trouvé'
                    : 'Aucun client enregistré'}
                </Text>
                <Text style={styles.emptySubtext}>
                  Les clients seront automatiquement ajoutés lors de la création de factures
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    height: '80%',
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  clientList: {
    flex: 1,
    paddingTop: 10,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  clientEmail: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 2,
  },
  clientAddress: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#1976D2',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});