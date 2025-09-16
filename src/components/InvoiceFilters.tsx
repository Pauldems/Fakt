import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SETTINGS_KEY, PropertyTemplate } from '../features/settings/SettingsScreen';

export interface FilterOptions {
  searchQuery: string;
  startDate: Date | null;
  endDate: Date | null;
  selectedPropertyId: string | null;
  dateFilter: 'all' | 'today' | 'week' | 'month' | 'year';
}

interface InvoiceFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  invoiceCount: number;
}

export default function InvoiceFilters({ onFiltersChange, invoiceCount }: InvoiceFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [properties, setProperties] = useState<PropertyTemplate[]>([]);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    // Calculer le nombre de filtres actifs
    let count = 0;
    if (searchQuery) count++;
    if (dateFilter !== 'all') count++;
    if (selectedPropertyId) count++;
    setActiveFiltersCount(count);

    // Appliquer les filtres
    const filters: FilterOptions = {
      searchQuery,
      startDate: getStartDateFromFilter(),
      endDate: getEndDateFromFilter(),
      selectedPropertyId,
      dateFilter,
    };
    onFiltersChange(filters);
  }, [searchQuery, dateFilter, selectedPropertyId, getStartDateFromFilter, getEndDateFromFilter]);

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

  const getStartDateFromFilter = useCallback((): Date | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case 'today':
        return today;
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        return weekAgo;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        monthAgo.setHours(0, 0, 0, 0);
        return monthAgo;
      case 'year':
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        yearAgo.setHours(0, 0, 0, 0);
        return yearAgo;
      default:
        return null;
    }
  }, [dateFilter]);

  const getEndDateFromFilter = useCallback((): Date | null => {
    return dateFilter === 'all' ? null : new Date();
  }, [dateFilter]);

  const resetFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setSelectedPropertyId(null);
  };

  const formatDate = (date: Date) => {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un client..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setIsFilterModalVisible(true)}
          >
            <Ionicons name="filter" size={20} color="#007AFF" />
            <Text style={styles.filterButtonText}>Filtres</Text>
            {activeFiltersCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.resultCount}>
            {invoiceCount} facture{invoiceCount > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <Modal
        visible={isFilterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtres</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Filtre par période */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Période</Text>
                
                {['all', 'today', 'week', 'month', 'year'].map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.filterOption,
                      dateFilter === period && styles.filterOptionSelected,
                    ]}
                    onPress={() => setDateFilter(period as any)}
                  >
                    <View style={styles.radioButton}>
                      {dateFilter === period && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={[
                      styles.filterOptionText,
                      dateFilter === period && styles.filterOptionTextSelected,
                    ]}>
                      {period === 'all' && 'Toutes les factures'}
                      {period === 'today' && "Aujourd'hui"}
                      {period === 'week' && '7 derniers jours'}
                      {period === 'month' && '30 derniers jours'}
                      {period === 'year' && 'Cette année'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Filtre par propriété */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Propriété</Text>
                
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    !selectedPropertyId && styles.filterOptionSelected,
                  ]}
                  onPress={() => setSelectedPropertyId(null)}
                >
                  <View style={styles.radioButton}>
                    {!selectedPropertyId && <View style={styles.radioButtonSelected} />}
                  </View>
                  <Text style={[
                    styles.filterOptionText,
                    !selectedPropertyId && styles.filterOptionTextSelected,
                  ]}>
                    Toutes les propriétés
                  </Text>
                </TouchableOpacity>

                {properties.map((property) => (
                  <TouchableOpacity
                    key={property.id}
                    style={[
                      styles.filterOption,
                      selectedPropertyId === property.id && styles.filterOptionSelected,
                    ]}
                    onPress={() => setSelectedPropertyId(property.id)}
                  >
                    <View style={styles.radioButton}>
                      {selectedPropertyId === property.id && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={[
                      styles.filterOptionText,
                      selectedPropertyId === property.id && styles.filterOptionTextSelected,
                    ]}>
                      {property.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={resetFilters}
              >
                <Text style={styles.modalButtonSecondaryText}>Réinitialiser</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => setIsFilterModalVisible(false)}
              >
                <Text style={styles.modalButtonPrimaryText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f8ff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  filterButtonText: {
    marginLeft: 6,
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    marginLeft: 6,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultCount: {
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 25,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  filterOptionSelected: {
    backgroundColor: '#f0f8ff',
  },
  filterOptionText: {
    fontSize: 15,
    color: '#666',
    marginLeft: 10,
  },
  filterOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  modalButtonPrimary: {
    marginLeft: 10,
    backgroundColor: '#007AFF',
  },
  modalButtonSecondaryText: {
    color: '#666',
    fontSize: 16,
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});