import React from 'react';
import { TextInput, Platform, TextInputProps } from 'react-native';

interface NumericInputProps extends Omit<TextInputProps, 'onChangeText' | 'value'> {
  value: string | number;
  onChangeText: (value: string | number) => void;
}

export const NumericInput: React.FC<NumericInputProps> = ({ 
  value, 
  onChangeText, 
  ...props 
}) => {
  const handleChange = (text: string) => {
    if (text === '') {
      onChangeText('');
      return;
    }
    
    // Accepter les chiffres, virgule et point
    let cleanText = text.replace(/[^0-9.,]/g, '');
    
    // Remplacer virgule par point pour le calcul interne
    cleanText = cleanText.replace(',', '.');
    
    // S'assurer qu'il n'y a qu'un seul point décimal
    const parts = cleanText.split('.');
    if (parts.length > 2) {
      cleanText = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Convertir en nombre
    const num = parseFloat(cleanText);
    if (!isNaN(num)) {
      onChangeText(num);
    } else {
      onChangeText(cleanText);
    }
  };

  // Afficher avec virgule pour l'utilisateur français
  const displayValue = value === '' || value === undefined || value === null 
    ? '' 
    : value.toString().replace('.', ',');

  return (
    <TextInput
      {...props}
      value={displayValue}
      onChangeText={handleChange}
      keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
    />
  );
};