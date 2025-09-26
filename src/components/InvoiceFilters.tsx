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
// import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
// import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SETTINGS_KEY, PropertyTemplate } from '../features/settings/SettingsScreen';
import hybridSettingsService from '../services/hybridSettingsService';
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
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year' | 'custom'>('all');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [properties, setProperties] = useState<PropertyTemplate[]>([]);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  console.log('🔍 InvoiceFilters rendering, invoiceCount:', invoiceCount);
  console.log('📱 Modal visible state:', isFilterModalVisible);
  console.log('📅 Date picker state:', showDatePicker);
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
      console.log('📋 Chargement des propriétés via hybridSettingsService...');
      const settings = await hybridSettingsService.getSettings();
      console.log('📋 Settings complets récupérés:', settings);
      
      if (settings && settings.propertyTemplates) {
        console.log('🏠 Propriétés trouvées:', settings.propertyTemplates.length, 'propriétés');
        console.log('🏠 Détail des propriétés:', settings.propertyTemplates);
        setProperties(settings.propertyTemplates);
      } else {
        console.log('❌ Aucune propriété dans les settings');
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
      case 'custom':
        if (customStartDate) {
          const parts = customStartDate.split('/');
          if (parts.length === 3) {
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          }
        }
        return null;
      default:
        return null;
    }
  }, [dateFilter, customStartDate]);

  const getEndDateFromFilter = useCallback((): Date | null => {
    if (dateFilter === 'all') return null;
    if (dateFilter === 'custom') {
      if (customEndDate) {
        const parts = customEndDate.split('/');
        if (parts.length === 3) {
          return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      }
      return null;
    }
    return new Date();
  }, [dateFilter, customEndDate]);

  const resetFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setSelectedPropertyId(null);
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const formatDate = (date: Date) => {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const openDatePicker = (type: 'start' | 'end') => {
    console.log('📅 Ouverture calendrier pour:', type);
    setDatePickerType(type);
    setShowDatePicker(true);
    console.log('📅 État picker:', true);
  };

  const generateCalendarDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    // Premier jour du mois
    const firstDay = new Date(year, monthIndex, 1);
    // Dernier jour du mois
    const lastDay = new Date(year, monthIndex + 1, 0);
    
    // Jour de la semaine du premier jour (0 = Dimanche)
    const startingDayOfWeek = firstDay.getDay() || 7; // Convertir dimanche (0) en 7
    
    const days = [];
    
    // Ajouter les jours vides du début
    for (let i = 1; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Ajouter tous les jours du mois
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, monthIndex, i));
    }
    
    return days;
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(currentMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(currentMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
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
            onPress={() => {
              console.log('🔘 Bouton filtres pressé');
              setIsFilterModalVisible(true);
            }}
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
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 20,
            maxHeight: '80%',
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: '#333',
              }}>Filtres</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* Afficher le calendrier si showDatePicker est true */}
              {showDatePicker ? (
                <View style={{ flex: 1 }}>
                  {/* Header avec bouton retour */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 20,
                    paddingBottom: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: '#eee',
                  }}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '600',
                      color: '#333',
                      marginLeft: 16,
                    }}>
                      {datePickerType === 'start' ? 'Date de début' : 'Date de fin'}
                    </Text>
                  </View>

                  {/* Navigation du mois */}
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                    paddingHorizontal: 10,
                  }}>
                    <TouchableOpacity onPress={() => changeMonth('prev')}>
                      <Ionicons name="chevron-back" size={24} color="#333" />
                    </TouchableOpacity>
                    
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '600',
                      color: '#333',
                    }}>
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </Text>
                    
                    <TouchableOpacity onPress={() => changeMonth('next')}>
                      <Ionicons name="chevron-forward" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>

                  {/* Jours de la semaine */}
                  <View style={{
                    flexDirection: 'row',
                    marginBottom: 10,
                    paddingHorizontal: 5,
                  }}>
                    {dayNames.map((day, index) => (
                      <View key={index} style={{
                        flex: 1,
                        alignItems: 'center',
                        paddingVertical: 5,
                      }}>
                        <Text style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: '#666',
                        }}>
                          {day}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Grille des jours */}
                  <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    paddingHorizontal: 5,
                  }}>
                    {generateCalendarDays(currentMonth).map((date, index) => (
                      <View key={index} style={{
                        width: '14.28%', // 100% / 7 jours
                        aspectRatio: 1,
                        padding: 2,
                      }}>
                        {date ? (
                          <TouchableOpacity
                            style={{
                              flex: 1,
                              backgroundColor: '#f8f9fa',
                              borderRadius: 8,
                              justifyContent: 'center',
                              alignItems: 'center',
                              borderWidth: 1,
                              borderColor: '#e0e0e0',
                            }}
                            onPress={() => {
                              const dateStr = formatDate(date);
                              if (datePickerType === 'start') {
                                setCustomStartDate(dateStr);
                              } else {
                                setCustomEndDate(dateStr);
                              }
                              setShowDatePicker(false);
                            }}
                          >
                            <Text style={{
                              fontSize: 16,
                              color: '#333',
                              fontWeight: '400',
                            }}>
                              {date.getDate()}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={{ flex: 1 }} />
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <>
              {/* Filtre par période */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: 12,
                }}>Période</Text>
                
                {[
                  { key: 'all', label: 'Toutes les factures' },
                  { key: 'today', label: "Aujourd'hui" },
                  { key: 'week', label: '7 derniers jours' },
                  { key: 'month', label: '30 derniers jours' },
                  { key: 'year', label: 'Cette année' },
                  { key: 'custom', label: 'Plage personnalisée' },
                ].map((period) => (
                  <TouchableOpacity
                    key={period.key}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      marginBottom: 8,
                      borderRadius: 8,
                      backgroundColor: dateFilter === period.key ? '#e3f2fd' : '#f5f5f5',
                    }}
                    onPress={() => setDateFilter(period.key as any)}
                  >
                    <Ionicons 
                      name={dateFilter === period.key ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={dateFilter === period.key ? '#1976d2' : '#666'} 
                    />
                    <Text style={{
                      marginLeft: 12,
                      fontSize: 14,
                      color: dateFilter === period.key ? '#1976d2' : '#333',
                      fontWeight: dateFilter === period.key ? '600' : '400',
                    }}>
                      {period.label}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* Champs de dates personnalisées */}
                {dateFilter === 'custom' && (
                  <View style={{ marginTop: 16, paddingHorizontal: 16 }}>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: 8,
                    }}>Date de début</Text>
                    <TouchableOpacity
                      style={{
                        borderWidth: 1,
                        borderColor: '#ddd',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        backgroundColor: 'white',
                        marginBottom: 12,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                      onPress={() => openDatePicker('start')}
                    >
                      <Text style={{
                        fontSize: 14,
                        color: customStartDate ? '#333' : '#999',
                      }}>
                        {customStartDate || 'Sélectionner une date'}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color="#666" />
                    </TouchableOpacity>

                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: 8,
                    }}>Date de fin</Text>
                    <TouchableOpacity
                      style={{
                        borderWidth: 1,
                        borderColor: '#ddd',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        backgroundColor: 'white',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                      onPress={() => openDatePicker('end')}
                    >
                      <Text style={{
                        fontSize: 14,
                        color: customEndDate ? '#333' : '#999',
                      }}>
                        {customEndDate || 'Sélectionner une date'}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Filtre par propriété */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: 12,
                }}>Propriété</Text>
                
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    marginBottom: 8,
                    borderRadius: 8,
                    backgroundColor: !selectedPropertyId ? '#e3f2fd' : '#f5f5f5',
                  }}
                  onPress={() => setSelectedPropertyId(null)}
                >
                  <Ionicons 
                    name={!selectedPropertyId ? "radio-button-on" : "radio-button-off"} 
                    size={20} 
                    color={!selectedPropertyId ? '#1976d2' : '#666'} 
                  />
                  <Text style={{
                    marginLeft: 12,
                    fontSize: 14,
                    color: !selectedPropertyId ? '#1976d2' : '#333',
                    fontWeight: !selectedPropertyId ? '600' : '400',
                  }}>
                    Toutes les propriétés
                  </Text>
                </TouchableOpacity>

                {properties.map((property) => (
                  <TouchableOpacity
                    key={property.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      marginBottom: 8,
                      borderRadius: 8,
                      backgroundColor: selectedPropertyId === property.id ? '#e3f2fd' : '#f5f5f5',
                    }}
                    onPress={() => setSelectedPropertyId(property.id)}
                  >
                    <Ionicons 
                      name={selectedPropertyId === property.id ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={selectedPropertyId === property.id ? '#1976d2' : '#666'} 
                    />
                    <Text style={{
                      marginLeft: 12,
                      fontSize: 14,
                      color: selectedPropertyId === property.id ? '#1976d2' : '#333',
                      fontWeight: selectedPropertyId === property.id ? '600' : '400',
                    }}>
                      {property.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              </>
              )}
            </ScrollView>

            <View style={{
              flexDirection: 'row',
              paddingTop: 20,
              borderTopWidth: 1,
              borderTopColor: '#eee',
            }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: '#f5f5f5',
                  marginRight: 8,
                  alignItems: 'center',
                }}
                onPress={resetFilters}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#666',
                }}>Réinitialiser</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: '#1976d2',
                  marginLeft: 8,
                  alignItems: 'center',
                }}
                onPress={() => setIsFilterModalVisible(false)}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: 'white',
                }}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </>
  );
}