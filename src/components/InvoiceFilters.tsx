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
import { useTheme } from '../theme/ThemeContext';
import { ModernCard } from './modern/ModernCard';
import { ModernButton } from './modern/ModernButton';

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
  const { theme } = useTheme();

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

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    searchCard: {
      marginBottom: 12,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 4,
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.text.primary,
      paddingVertical: 8,
    },
    filterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    resultCount: {
      fontSize: 14,
      color: theme.text.secondary,
      fontWeight: '500',
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.surface.primary,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 20,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border.light,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text.primary,
    },
    modalBody: {
      flex: 1,
      paddingHorizontal: 20,
    },
    filterSection: {
      marginBottom: 24,
    },
    filterSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: 12,
    },
    periodOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 8,
      borderRadius: 12,
      backgroundColor: theme.surface.secondary,
    },
    periodOptionActive: {
      backgroundColor: theme.surface.accent,
      borderWidth: 2,
      borderColor: theme.primary,
    },
    periodOptionText: {
      marginLeft: 12,
      fontSize: 16,
      color: theme.text.primary,
    },
    periodOptionTextActive: {
      fontWeight: '600',
      color: theme.primary,
    },
    propertyOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 8,
      borderRadius: 12,
      backgroundColor: theme.surface.secondary,
    },
    propertyOptionActive: {
      backgroundColor: theme.surface.accent,
      borderWidth: 2,
      borderColor: theme.primary,
    },
    propertyOptionText: {
      marginLeft: 12,
      fontSize: 16,
      color: theme.text.primary,
    },
    propertyOptionTextActive: {
      fontWeight: '600',
      color: theme.primary,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderTopWidth: 1,
      borderTopColor: theme.border.light,
      gap: 12,
    },
  });

  return (
    <>
      <View style={styles.container}>
        <ModernCard variant="default" size="medium" style={styles.searchCard}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.text.tertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un client..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.text.tertiary}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>
        </ModernCard>

        <View style={styles.filterRow}>
          <ModernButton
            title={`Filtres${activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}`}
            variant="outline"
            size="small"
            icon="filter"
            onPress={() => setIsFilterModalVisible(true)}
          />

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
                <Ionicons name="close" size={24} color={theme.text.primary} />
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
                      styles.periodOption,
                      dateFilter === period && styles.periodOptionActive,
                    ]}
                    onPress={() => setDateFilter(period as any)}
                  >
                    <Ionicons 
                      name={dateFilter === period ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={dateFilter === period ? theme.primary : theme.text.tertiary} 
                    />
                    <Text style={[
                      styles.periodOptionText,
                      dateFilter === period && styles.periodOptionTextActive,
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
                    styles.propertyOption,
                    !selectedPropertyId && styles.propertyOptionActive,
                  ]}
                  onPress={() => setSelectedPropertyId(null)}
                >
                  <Ionicons 
                    name={!selectedPropertyId ? "radio-button-on" : "radio-button-off"} 
                    size={20} 
                    color={!selectedPropertyId ? theme.primary : theme.text.tertiary} 
                  />
                  <Text style={[
                    styles.propertyOptionText,
                    !selectedPropertyId && styles.propertyOptionTextActive,
                  ]}>
                    Toutes les propriétés
                  </Text>
                </TouchableOpacity>

                {properties.map((property) => (
                  <TouchableOpacity
                    key={property.id}
                    style={[
                      styles.propertyOption,
                      selectedPropertyId === property.id && styles.propertyOptionActive,
                    ]}
                    onPress={() => setSelectedPropertyId(property.id)}
                  >
                    <Ionicons 
                      name={selectedPropertyId === property.id ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={selectedPropertyId === property.id ? theme.primary : theme.text.tertiary} 
                    />
                    <Text style={[
                      styles.propertyOptionText,
                      selectedPropertyId === property.id && styles.propertyOptionTextActive,
                    ]}>
                      {property.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <ModernButton
                title="Réinitialiser"
                variant="outline"
                size="medium"
                onPress={resetFilters}
                style={{ flex: 1 }}
              />

              <ModernButton
                title="Appliquer"
                variant="primary"
                size="medium"
                onPress={() => setIsFilterModalVisible(false)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}