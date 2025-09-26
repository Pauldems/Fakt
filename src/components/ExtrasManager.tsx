import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Extra } from '../types/invoice';
import { getInvoiceTranslation, Language } from '../utils/invoiceTranslations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SETTINGS_KEY, DEFAULT_SETTINGS } from '../features/settings/SettingsScreen';
import { useTheme } from '../theme/ThemeContext';

interface ExtrasManagerProps {
  extras: Extra[];
  onChange: (extras: Extra[]) => void;
  showErrors?: boolean;
}

export const ExtrasManager: React.FC<ExtrasManagerProps> = ({ extras, onChange, showErrors = false }) => {
  const { theme } = useTheme();
  const [language, setLanguage] = useState<Language>('fr');
  const [translations, setTranslations] = useState(getInvoiceTranslation('fr'));

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          const lang = settings.language || 'fr';
          setLanguage(lang);
          setTranslations(getInvoiceTranslation(lang));
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la langue:', error);
      }
    };
    loadLanguage();
  }, []);

  const getPredefinedExtras = () => [
    { name: translations.cleaning, price: 0, icon: 'home', translationKey: 'cleaning' },
    { name: translations.breakfast, price: 0, icon: 'restaurant', translationKey: 'breakfast' },
    { name: translations.linens, price: 0, icon: 'bed', translationKey: 'linens' },
    { name: translations.parking, price: 0, icon: 'car', translationKey: 'parking' },
    { name: translations.airportTransfer, price: 0, icon: 'airplane', translationKey: 'airportTransfer' },
  ];

  const showHelp = () => {
    Alert.alert(
      translations.extrasHelp,
      translations.extrasHelpText,
      [{ text: language === 'en' ? 'Got it' : language === 'es' ? 'Entendido' : language === 'de' ? 'Verstanden' : language === 'it' ? 'Capito' : 'Compris', style: 'default' }]
    );
  };

  const addExtra = (extra: Extra) => {
    onChange([...extras, { ...extra, quantity: 1 }]);
  };

  const addCustomExtra = () => {
    onChange([...extras, { name: '', price: 0, quantity: 1 }]);
  };

  const updateExtra = (index: number, field: keyof Extra, value: string | number) => {
    const newExtras = [...extras];
    if (field === 'price') {
      const numValue = parseFloat(value as string);
      newExtras[index][field] = isNaN(numValue) ? 0 : numValue;
    } else if (field === 'quantity') {
      const strValue = value as string;
      if (strValue === '') {
        // Permet temporairement les valeurs vides pour que l'utilisateur puisse taper
        newExtras[index][field] = '' as any;
      } else {
        const numValue = parseInt(strValue);
        newExtras[index][field] = isNaN(numValue) || numValue < 1 ? 1 : numValue;
      }
    } else {
      newExtras[index][field] = value as string;
    }
    onChange(newExtras);
  };

  const removeExtra = (index: number) => {
    onChange(extras.filter((_, i) => i !== index));
  };

  const validateExtra = (extra: Extra) => {
    return {
      name: !extra.name || extra.name.trim() === '',
      price: typeof extra.price !== 'number' || extra.price < 0,
      quantity: extra.quantity === '' || typeof extra.quantity !== 'number' || extra.quantity < 1
    };
  };

  const getTotalExtras = () => {
    return extras.reduce((sum, extra) => {
      const price = typeof extra.price === 'number' ? extra.price : 0;
      const quantity = typeof extra.quantity === 'number' ? extra.quantity : (extra.quantity === '' ? 0 : 1);
      return sum + (price * quantity);
    }, 0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{translations.extrasTitle}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.total}>{translations.extrasTotal}: {getTotalExtras().toFixed(2)}€</Text>
          <TouchableOpacity onPress={showHelp} style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={20} color="#667eea" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Extras prédéfinis */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.predefinedContainer}>
        {getPredefinedExtras().map((extra, index) => (
          <TouchableOpacity
            key={index}
            style={styles.predefinedButton}
            onPress={() => addExtra(extra)}
          >
            <Ionicons name={extra.icon as any} size={24} color="#667eea" />
            <Text style={styles.predefinedText}>{extra.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste des extras ajoutés */}
      {extras.map((extra, index) => {
        const errors = showErrors ? validateExtra(extra) : { name: false, price: false, quantity: false };
        return (
          <View key={index} style={styles.extraItem}>
            <View style={styles.extraRow}>
              <TextInput
                style={[
                  styles.input, 
                  styles.nameInput,
                  showErrors && errors.name && styles.inputError
                ]}
                placeholder={translations.extraNamePlaceholder}
                value={extra.name}
                onChangeText={(value) => updateExtra(index, 'name', value)}
              />
              <View style={styles.numberContainer}>
                <TextInput
                  style={[
                    styles.input, 
                    styles.numberInput,
                    showErrors && errors.price && styles.inputError
                  ]}
                  placeholder={translations.extraPricePlaceholder}
                  value={extra.price.toString()}
                  keyboardType="numeric"
                  onChangeText={(value) => updateExtra(index, 'price', value)}
                />
                <Text style={styles.currency}>€</Text>
              </View>
              <View style={styles.numberContainer}>
                <Text style={styles.quantityLabel}>x</Text>
                <TextInput
                  style={[
                    styles.input, 
                    styles.quantityInput,
                    showErrors && errors.quantity && styles.inputError
                  ]}
                  placeholder={translations.extraQuantityPlaceholder}
                  value={extra.quantity === '' ? '' : extra.quantity.toString()}
                  keyboardType="numeric"
                  onChangeText={(value) => updateExtra(index, 'quantity', value)}
                />
              </View>
              <TouchableOpacity onPress={() => removeExtra(index)} style={styles.removeButton}>
                <Ionicons name="trash-outline" size={20} color="#e74c3c" />
              </TouchableOpacity>
            </View>
            <Text style={styles.subtotal}>
              Sous-total: {(() => {
                const price = typeof extra.price === 'number' ? extra.price : 0;
                const quantity = typeof extra.quantity === 'number' ? extra.quantity : (extra.quantity === '' ? 0 : 1);
                return (price * quantity).toFixed(2);
              })()}€
            </Text>
          </View>
        );
      })}

      {/* Bouton ajouter un extra personnalisé */}
      <TouchableOpacity style={styles.addButton} onPress={addCustomExtra}>
        <Ionicons name="add-circle-outline" size={24} color="#667eea" />
        <Text style={styles.addButtonText}>{translations.addCustomExtra}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'transparent',
    borderRadius: 8,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  total: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginRight: 8,
  },
  helpButton: {
    padding: 4,
  },
  predefinedContainer: {
    marginBottom: 16,
    maxHeight: 100,
  },
  predefinedButton: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  predefinedText: {
    fontSize: 12,
    color: '#2c3e50',
    marginTop: 4,
  },
  extraItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
  },
  inputError: {
    borderColor: '#e74c3c',
    borderWidth: 2,
  },
  nameInput: {
    flex: 1,
    marginRight: 8,
  },
  numberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  numberInput: {
    width: 60,
  },
  currency: {
    marginLeft: 4,
    color: '#6c757d',
  },
  quantityLabel: {
    marginRight: 4,
    color: '#6c757d',
  },
  quantityInput: {
    width: 40,
  },
  removeButton: {
    padding: 8,
  },
  subtotal: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    textAlign: 'right',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#667eea',
    borderRadius: 8,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addButtonText: {
    color: '#667eea',
    marginLeft: 8,
    fontSize: 14,
  },
});

// Fonction exportée pour valider les extras depuis le formulaire
export const validateExtras = (extras: Extra[]): boolean => {
  return extras.every(extra => {
    const nameValid = extra.name && extra.name.trim() !== '';
    const priceValid = typeof extra.price === 'number' && extra.price >= 0;
    const quantityValid = typeof extra.quantity === 'number' && extra.quantity >= 1;
    return nameValid && priceValid && quantityValid;
  });
};