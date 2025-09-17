import React, { useEffect, useState, useCallback } from 'react';
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
import * as FileSystem from 'expo-file-system';
import { StorageService, StoredInvoice } from '../../services/storageService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import InvoiceFilters, { FilterOptions } from '../../components/InvoiceFilters';
import SimpleInvoiceFilters from '../../components/SimpleInvoiceFilters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SETTINGS_KEY, PropertyTemplate } from '../settings/SettingsScreen';
import { generateInvoiceHTML } from '../../utils/pdfTemplate';
import * as Print from 'expo-print';
import { CSVExportService } from '../../services/csvExportService';

const { width } = Dimensions.get('window');

export const InvoiceListScreen: React.FC = () => {
  const [allInvoices, setAllInvoices] = useState<StoredInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<StoredInvoice[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    startDate: null,
    endDate: null,
    selectedPropertyId: null,
    dateFilter: 'all',
  });
  const [properties, setProperties] = useState<PropertyTemplate[]>([]);
  const navigation = useNavigation<any>();

  // Recharger les factures quand l'écran est focalisé
  useFocusEffect(
    useCallback(() => {
      loadInvoices();
      loadProperties();
    }, [])
  );

  // Appliquer les filtres quand ils changent
  useEffect(() => {
    applyFilters();
  }, [filters, allInvoices]);

  const loadInvoices = async () => {
    try {
      console.log('Chargement des factures...');
      const loadedInvoices = await StorageService.getInvoices();
      console.log('Factures chargées:', loadedInvoices.length);
      setAllInvoices(loadedInvoices);
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
    }
  };

  const loadProperties = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.propertyTemplates) {
          setProperties(settings.propertyTemplates);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des propriétés:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...allInvoices];
    console.log('Filtrage - Factures initiales:', allInvoices.length);

    // Filtre par recherche de client
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice.data.firstName.toLowerCase().includes(query) ||
        invoice.data.lastName.toLowerCase().includes(query) ||
        invoice.data.email.toLowerCase().includes(query) ||
        invoice.invoiceNumber.toLowerCase().includes(query)
      );
      console.log('Après filtre recherche:', filtered.length);
    }

    // Filtre par dates
    if (filters.startDate) {
      filtered = filtered.filter(invoice => 
        new Date(invoice.data.invoiceDate) >= filters.startDate!
      );
      console.log('Après filtre date début:', filtered.length);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(invoice => 
        new Date(invoice.data.invoiceDate) <= endDate
      );
      console.log('Après filtre date fin:', filtered.length);
    }

    // Filtre par propriété
    if (filters.selectedPropertyId) {
      filtered = filtered.filter(invoice => 
        invoice.data.selectedPropertyId === filters.selectedPropertyId
      );
      console.log('Après filtre propriété:', filtered.length);
    }

    console.log('Factures filtrées finales:', filtered.length);
    if (filtered.length > 0) {
      console.log('Première facture filtrée - pdfUri:', filtered[0].pdfUri);
    }

    setFilteredInvoices(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvoices();
    setRefreshing(false);
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleShare = async (invoice: StoredInvoice) => {
    try {
      console.log('Tentative de partage pour la facture:', invoice.invoiceNumber);
      console.log('URI du PDF:', invoice.pdfUri);
      
      if (!invoice.pdfUri) {
        throw new Error('URI du PDF manquant');
      }

      // Vérifier si le fichier existe
      const fileInfo = await FileSystem.getInfoAsync(invoice.pdfUri);
      console.log('Info du fichier:', fileInfo);
      
      if (!fileInfo.exists) {
        console.log('Le fichier PDF n\'existe pas, régénération en cours...');
        
        // Régénérer le PDF
        const html = await generateInvoiceHTML(invoice.data, invoice.invoiceNumber);
        const { uri: tempPdfUri } = await Print.printToFileAsync({
          html,
          base64: false,
        });
        
        console.log('PDF régénéré temporairement:', tempPdfUri);
        
        // Partager le PDF temporaire
        await Sharing.shareAsync(tempPdfUri);
        
        // Nettoyer le fichier temporaire après partage
        setTimeout(async () => {
          try {
            await FileSystem.deleteAsync(tempPdfUri, { idempotent: true });
          } catch (e) {
            console.log('Erreur lors du nettoyage du fichier temporaire:', e);
          }
        }, 5000);
        
        console.log('Partage réussi avec PDF régénéré');
        return;
      }

      // Vérifier si le fichier est lisible
      if (!fileInfo.isDirectory && fileInfo.size === 0) {
        throw new Error('Le fichier PDF est vide.');
      }
      
      await Sharing.shareAsync(invoice.pdfUri);
      console.log('Partage réussi');
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      Alert.alert(
        'Erreur de partage', 
        `Impossible de partager la facture: ${error instanceof Error ? error.message : 'Erreur inconnue'}\n\nEssayez de régénérer la facture si le problème persiste.`
      );
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

  const handleExportCSV = async () => {
    try {
      if (filteredInvoices.length === 0) {
        Alert.alert('Aucune facture', 'Il n\'y a aucune facture à exporter');
        return;
      }

      // Afficher un message de confirmation avec le nombre de factures
      Alert.alert(
        'Export CSV',
        `Exporter ${filteredInvoices.length} facture${filteredInvoices.length > 1 ? 's' : ''} au format CSV ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Exporter',
            onPress: async () => {
              try {
                await CSVExportService.exportToCSV(filteredInvoices);
                // Le service gère le partage, pas besoin de message de succès
              } catch (error) {
                Alert.alert(
                  'Erreur', 
                  'Impossible d\'exporter les factures:\n' + 
                  (error instanceof Error ? error.message : 'Erreur inconnue')
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'export');
    }
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
              <Text style={styles.statValue}>{allInvoices.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {filteredInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0).toFixed(0)}€
              </Text>
              <Text style={styles.statLabel}>Visibles</Text>
            </View>
          </View>
          
          {/* Bouton Export CSV */}
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={handleExportCSV}
          >
            <Ionicons name="download-outline" size={18} color="#003580" />
            <Text style={styles.exportButtonText}>Export CSV</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Contenu scrollable avec filtres intégrés */}
      <View style={styles.scrollContent}>
        {/* Filtres */}
        <InvoiceFilters 
          onFiltersChange={handleFiltersChange} 
          invoiceCount={filteredInvoices.length}
        />
        <FlatList
          data={filteredInvoices}
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
    marginTop: 230, // Augmenté pour faire de la place au bouton export
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
  exportButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exportButtonText: {
    color: '#003580',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});