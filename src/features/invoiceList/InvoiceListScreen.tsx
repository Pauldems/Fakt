import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import * as FileSystem from 'expo-file-system/legacy';
import { StorageService, StoredInvoice } from '../../services/storageService';
import hybridInvoiceService from '../../services/hybridInvoiceService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import InvoiceFilters, { FilterOptions } from '../../components/InvoiceFilters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SETTINGS_KEY, PropertyTemplate } from '../settings/SettingsScreen';
import { CSVExportService } from '../../services/csvExportService';
import pdfCacheService from '../../services/pdfCacheService';
import { useTheme } from '../../theme/ThemeContext';
import { ModernHeader } from '../../components/modern/ModernHeader';
import { ModernCard } from '../../components/modern/ModernCard';
import { ModernButton } from '../../components/modern/ModernButton';
import cacheService, { CACHE_KEYS, CACHE_TTL } from '../../services/cacheService';

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
  const { theme } = useTheme();

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

  const loadInvoices = async (forceRefresh = false) => {
    try {
      console.log('Chargement des factures...');
      const loadedInvoices = await cacheService.getOrFetch(
        CACHE_KEYS.INVOICES,
        () => hybridInvoiceService.getInvoices(),
        { ttl: CACHE_TTL.MEDIUM, forceRefresh }
      );
      console.log('Factures chargées:', loadedInvoices.length);
      setAllInvoices(loadedInvoices);
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
    }
  };

  const loadProperties = async (forceRefresh = false) => {
    try {
      const properties = await cacheService.getOrFetch(
        CACHE_KEYS.PROPERTIES,
        async () => {
          const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
          if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            return settings.propertyTemplates || [];
          }
          return [];
        },
        { ttl: CACHE_TTL.LONG, forceRefresh }
      );
      setProperties(properties);
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
    // Force le rafraîchissement en ignorant le cache
    await loadInvoices(true);
    await loadProperties(true);
    setRefreshing(false);
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleShare = async (invoice: StoredInvoice) => {
    try {
      console.log('Tentative de partage pour la facture:', invoice.invoiceNumber);

      // Utiliser le service de cache PDF pour obtenir/régénérer le PDF
      const { pdfUri, wasRegenerated } = await pdfCacheService.getPDF(invoice);

      if (wasRegenerated) {
        console.log('PDF régénéré et mis en cache:', pdfUri);
        // Mettre à jour l'objet local pour les prochains partages
        invoice.pdfUri = pdfUri;
      }

      // Partager le PDF
      await Sharing.shareAsync(pdfUri);
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
              // Invalider le cache après suppression
              cacheService.invalidate(CACHE_KEYS.INVOICES);
              await loadInvoices(true);
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
      <ModernCard 
        variant="default" 
        size="medium"
        style={styles.invoiceCard}
        onPress={() => navigation.navigate('PDFViewer', { 
          pdfPath: item.pdfPath, 
          invoiceData: item.data,
          title: `Facture ${item.invoiceNumber}`
        })}
      >
        <View style={styles.cardContent}>
          <Text style={[styles.clientName, { color: theme.text.primary }]} numberOfLines={1}>
            {item.invoiceNumber}
          </Text>
          
          <View style={styles.cardBottom}>
            <View style={styles.cardLeft}>
              <Text style={[styles.invoiceNumber, { color: theme.text.secondary }]}>
                {item.data.firstName} {item.data.lastName}
              </Text>
              <Text style={[styles.dateText, { color: theme.text.tertiary }]}>
                {formatDate(item.data.invoiceDate)} 
                {item.data.numberOfNights ? ` • ${item.data.numberOfNights} nuit${item.data.numberOfNights > 1 ? 's' : ''}` : ''}
              </Text>
            </View>
            
            <View style={styles.cardRight}>
              <Text style={[styles.amountValue, { color: theme.primary }]}>
                {item.totalAmount != null ? `${item.totalAmount.toFixed(2)}€` : '0.00€'}
              </Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.shareButton, { backgroundColor: theme.surface.accent }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleShare(item);
                  }}
                >
                  <Ionicons name="share-outline" size={20} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.deleteButton, { backgroundColor: theme.colors.red50 }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.colors.red500} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ModernCard>
    );
  };

  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <ModernCard variant="gradient" size="large" style={styles.emptyCard}>
        <View style={styles.emptyContent}>
          <Ionicons name="document-text-outline" size={80} color="white" />
          <Text style={styles.emptyText}>Aucune facture enregistrée</Text>
          <Text style={styles.emptySubtext}>
            Créez votre première facture depuis l'onglet "Nouvelle"
          </Text>
        </View>
      </ModernCard>
    </View>
  );

  // Styles memoized pour éviter la recréation à chaque render
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.primary,
    },
    scrollContent: {
      flex: 1,
      marginTop: 20,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    invoiceCard: {
      marginBottom: 12,
    },
    cardContent: {
      flex: 1,
    },
    clientName: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 8,
    },
    cardBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    cardLeft: {
      flex: 1,
    },
    cardRight: {
      alignItems: 'flex-end',
    },
    invoiceNumber: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 4,
    },
    dateText: {
      fontSize: 12,
      fontWeight: '400',
    },
    amountValue: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 8,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    shareButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      paddingHorizontal: 40,
      paddingTop: 60,
    },
    emptyCard: {
      alignItems: 'center',
    },
    emptyContent: {
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 20,
      fontWeight: '600',
      color: 'white',
      marginTop: 16,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      marginTop: 8,
      textAlign: 'center',
      lineHeight: 20,
    },
  }), [theme]);

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Mes Factures"
        subtitle={`${allInvoices.length} facture${allInvoices.length > 1 ? 's' : ''} • ${filteredInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0).toFixed(0)}€`}
        icon="folder-open"
        rightElement={
          <ModernButton
            title="Export"
            variant="secondary"
            size="small"
            icon="download-outline"
            onPress={handleExportCSV}
          />
        }
      />

      <View style={styles.scrollContent}>
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
              tintColor={theme.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};