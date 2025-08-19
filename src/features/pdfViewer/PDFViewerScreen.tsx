import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StoredInvoice } from '../../services/storageService';

const { width, height } = Dimensions.get('window');

export const PDFViewerScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const invoiceParam = route.params?.invoice as any;
  
  // Reconstruire l'objet invoice avec les dates
  const invoice: StoredInvoice | null = invoiceParam ? {
    ...invoiceParam,
    createdAt: new Date(invoiceParam.createdAt),
    data: {
      ...invoiceParam.data,
      invoiceDate: new Date(invoiceParam.data.invoiceDate)
    }
  } : null;

  if (!invoice) {
    return (
      <View style={styles.errorContainer}>
        <Text>Erreur: Facture non trouvée</Text>
      </View>
    );
  }

  const handleShare = async () => {
    if (!invoice || !invoice.pdfUri) {
      Alert.alert('Erreur', 'Facture non trouvée');
      return;
    }
    
    try {
      // Vérifier que le fichier existe
      const fileInfo = await FileSystem.getInfoAsync(invoice.pdfUri);
      if (!fileInfo.exists) {
        Alert.alert('Erreur', 'Le fichier PDF n\'existe plus');
        return;
      }
      
      await Sharing.shareAsync(invoice.pdfUri);
    } catch (error) {
      console.error('Erreur partage:', error);
      Alert.alert('Erreur', 'Impossible de partager la facture');
    }
  };

  const handleView = async () => {
    if (!invoice || !invoice.pdfUri) {
      Alert.alert('Erreur', 'Facture non trouvée');
      return;
    }
    
    try {
      // Vérifier que le fichier existe
      const fileInfo = await FileSystem.getInfoAsync(invoice.pdfUri);
      if (!fileInfo.exists) {
        Alert.alert('Erreur', 'Le fichier PDF n\'existe plus');
        return;
      }
      
      // Sur iOS, obtenir une URI de contenu pour le partage
      let shareUri = invoice.pdfUri;
      
      if (Platform.OS === 'ios') {
        try {
          shareUri = await FileSystem.getContentUriAsync(invoice.pdfUri);
        } catch (e) {
          // Si ça échoue, utiliser l'URI originale
          console.log('getContentUriAsync failed, using original URI');
        }
      }
      
      // Ouvrir le PDF avec le visualiseur système
      await Sharing.shareAsync(shareUri);
    } catch (error) {
      console.error('Erreur ouverture PDF:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir la facture. Utilisez le bouton Partager pour l\'envoyer par email.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#003580" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.invoiceNumber} numberOfLines={1} ellipsizeMode="middle">
            {invoice.invoiceNumber}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={24} color="#003580" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="document-text" size={80} color="#003580" />
          <Text style={styles.invoiceTitle}>{invoice.invoiceNumber}</Text>
          <Text style={styles.clientText}>
            {invoice.data.firstName} {invoice.data.lastName}
          </Text>
          <Text style={styles.amountText}>
            Total: {invoice.totalAmount.toFixed(2)}€
          </Text>
          <Text style={styles.dateText}>
            Créée le {new Date(invoice.createdAt).toLocaleDateString('fr-FR')}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleView}>
            <Ionicons name="eye-outline" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Voir la facture</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.shareActionButton]} 
            onPress={handleShare}
          >
            <Ionicons name="share-social-outline" size={24} color="#003580" />
            <Text style={[styles.actionButtonText, styles.shareButtonText]}>Partager</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  backButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#003580',
    paddingHorizontal: 8,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 30,
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  clientText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  amountText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#003580',
    marginTop: 12,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#003580',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  shareActionButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#003580',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  shareButtonText: {
    color: '#003580',
  },
  dateText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});