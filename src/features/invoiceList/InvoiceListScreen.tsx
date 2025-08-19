import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { StorageService, StoredInvoice } from '../../services/storageService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const { width } = Dimensions.get('window');

export const InvoiceListScreen: React.FC = () => {
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  // Recharger les factures quand l'écran est focalisé
  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [])
  );

  const loadInvoices = async () => {
    try {
      console.log('Chargement des factures...');
      const loadedInvoices = await StorageService.getInvoices();
      console.log('Factures chargées:', loadedInvoices.length);
      console.log('Détails:', loadedInvoices);
      setInvoices(loadedInvoices);
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvoices();
    setRefreshing(false);
  };

  const handleShare = async (invoice: StoredInvoice) => {
    try {
      await Sharing.shareAsync(invoice.pdfUri);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager la facture');
    }
  };

  const handleDelete = (invoice: StoredInvoice) => {
    Alert.alert(
      'Supprimer la facture',
      `Êtes-vous sûr de vouloir supprimer la facture :\n\n${invoice.invoiceNumber}\n\nCette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteInvoice(invoice.id);
              await loadInvoices();
              Alert.alert('Succès', 'La facture a été supprimée');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la facture');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderInvoice = ({ item, index }: { item: StoredInvoice, index: number }) => {
    return (
      <View 
        style={styles.invoiceCard}
      >
        <View style={styles.cardContent}>
          <Text style={styles.clientName} numberOfLines={1}>
            {item.invoiceNumber}
          </Text>
          
          <View style={styles.cardBottom}>
            <View style={styles.cardLeft}>
              <Text style={styles.invoiceNumber}>{item.data.firstName} {item.data.lastName}</Text>
              <Text style={styles.dateText}>
                {formatDate(item.data.invoiceDate)} 
                {item.data.numberOfNights ? ` • ${item.data.numberOfNights} nuit${item.data.numberOfNights > 1 ? 's' : ''}` : ''}
              </Text>
            </View>
            
            <View style={styles.cardRight}>
              <Text style={styles.amountValue}>
                {item.totalAmount != null ? `${item.totalAmount.toFixed(2)}€` : '0.00€'}
              </Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.shareButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleShare(item);
                  }}
                >
                  <Ionicons name="share-outline" size={22} color="#003580" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                >
                  <Ionicons name="trash-outline" size={22} color="#dc3545" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['#f0f9ff', '#e0f2fe']}
        style={styles.emptyGradient}
      >
        <Ionicons name="document-text-outline" size={100} color="#003580" />
        <Text style={styles.emptyText}>Aucune facture enregistrée</Text>
        <Text style={styles.emptySubtext}>
          Créez votre première facture depuis l'onglet "Nouvelle"
        </Text>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header fixe */}
      <LinearGradient
        colors={['#003580', '#0052cc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fixedHeader}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>Mes Factures</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{invoices.length}</Text>
              <Text style={styles.statLabel}>Factures</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0).toFixed(0)}€
              </Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Contenu scrollable */}
      <View style={styles.scrollContent}>
        <FlatList
          data={invoices}
          renderItem={renderInvoice}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={EmptyList}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#003580"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  scrollContent: {
    flex: 1,
    marginTop: 190, // Augmentation de la marge pour descendre encore les factures
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 20,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  invoiceCard: {
    backgroundColor: 'white',
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    padding: 20,
  },
  cardLeft: {
    flex: 1,
    marginRight: 10,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 24,
  },
  invoiceNumber: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#003580',
  },
  shareButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ffebee',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyGradient: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#003580',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});