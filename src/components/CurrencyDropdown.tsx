import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { ModernCard } from './modern/ModernCard';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

interface CurrencyDropdownProps {
  currencies: Currency[];
  selectedCurrency: string;
  onCurrencyChange: (currencyCode: string) => void;
}

export const CurrencyDropdown: React.FC<CurrencyDropdownProps> = ({
  currencies,
  selectedCurrency,
  onCurrencyChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();

  // Si aucune devise sélectionnée, utiliser EUR par défaut
  const safeCurrency = selectedCurrency || 'EUR';
  const selectedCurrencyData = currencies.find(c => c.code === safeCurrency) || currencies[0];

  const renderCurrencyItem = ({ item }: { item: Currency }) => (
    <TouchableOpacity
      style={[
        styles.currencyItem,
        { 
          backgroundColor: item.code === safeCurrency ? theme.surface.accent : 'transparent',
          borderColor: item.code === safeCurrency ? theme.primary : 'transparent',
        }
      ]}
      onPress={() => {
        onCurrencyChange(item.code);
        setIsOpen(false);
      }}
    >
      <Text style={styles.currencyFlag}>{item.flag}</Text>
      <View style={styles.currencyDetails}>
        <Text style={[
          styles.currencyCode,
          { 
            color: item.code === safeCurrency ? theme.primary : theme.text.primary,
            fontWeight: item.code === safeCurrency ? '600' : '500',
          }
        ]}>
          {item.symbol} {item.code}
        </Text>
        <Text style={[styles.currencyName, { color: theme.text.secondary }]}>
          {item.name}
        </Text>
      </View>
      {item.code === safeCurrency && (
        <Ionicons name="checkmark" size={20} color={theme.primary} />
      )}
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    dropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border.medium,
      backgroundColor: theme.surface.secondary,
    },
    dropdownContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    selectedFlag: {
      fontSize: 24,
      marginRight: 12,
    },
    selectedDetails: {
      flex: 1,
    },
    selectedCode: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text.primary,
    },
    selectedName: {
      fontSize: 14,
      color: theme.text.secondary,
      marginTop: 2,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    modalContent: {
      backgroundColor: theme.surface.primary,
      borderRadius: 16,
      paddingVertical: 20,
      maxHeight: '70%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border.light,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text.primary,
    },
    currencyList: {
      paddingHorizontal: 8,
    },
    currencyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 12,
      marginVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
    },
    currencyFlag: {
      fontSize: 24,
      marginRight: 12,
    },
    currencyDetails: {
      flex: 1,
    },
    currencyCode: {
      fontSize: 16,
      fontWeight: '500',
    },
    currencyName: {
      fontSize: 14,
      marginTop: 2,
    },
  });

  return (
    <>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setIsOpen(true)}
      >
        <View style={styles.dropdownContent}>
          <Text style={styles.selectedFlag}>{selectedCurrencyData?.flag}</Text>
          <View style={styles.selectedDetails}>
            <Text style={styles.selectedCode}>
              {selectedCurrencyData?.symbol} {selectedCurrencyData?.code}
            </Text>
            <Text style={styles.selectedName}>
              {selectedCurrencyData?.name}
            </Text>
          </View>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={theme.text.tertiary} 
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir une devise</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color={theme.text.primary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={currencies}
              renderItem={renderCurrencyItem}
              keyExtractor={(item) => item.code}
              style={styles.currencyList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};