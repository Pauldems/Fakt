import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SimpleInvoiceFiltersProps {
  onFiltersChange: (filters: any) => void;
  invoiceCount: number;
}

export default function SimpleInvoiceFilters({ onFiltersChange, invoiceCount }: SimpleInvoiceFiltersProps) {
  console.log('SimpleInvoiceFilters - Rendu, count:', invoiceCount);
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Filtres - {invoiceCount} factures</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ff0000', // Rouge vif pour bien voir
    padding: 20,
    borderBottomWidth: 5,
    borderBottomColor: '#000',
    height: 80,
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1000,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
});