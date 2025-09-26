import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StoredInvoice } from '../../services/storageService';
import { useTheme } from '../../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

export const PDFViewerScreen: React.FC = () => {
  const { theme } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as any;
  
  // Support pour les aperçus directs (avec pdfUri), les images de template (avec templateImage) et les factures complètes (avec invoice)
  const invoiceParam = params?.invoice;
  const directPdfUri = params?.pdfUri;
  const templateImage = params?.templateImage;
  const invoiceNumber = params?.invoiceNumber || 'Facture';
  const isPreview = params?.isPreview || false;
  
  // Reconstruire l'objet invoice avec les dates si c'est une vraie facture
  const invoice: StoredInvoice | null = invoiceParam ? {
    ...invoiceParam,
    createdAt: new Date(invoiceParam.createdAt),
    data: {
      ...invoiceParam.data,
      invoiceDate: new Date(invoiceParam.data.invoiceDate)
    }
  } : null;

  // Déterminer l'URI du PDF à afficher
  const pdfUri = directPdfUri || invoice?.pdfUri;
  
  // Nettoyer les fichiers temporaires de prévisualisation quand on quitte l'écran
  useEffect(() => {
    return () => {
      // Quand on quitte l'écran et que c'est un aperçu avec un fichier temporaire
      if (isPreview && directPdfUri && directPdfUri.includes('Print/')) {
        // Supprimer le fichier temporaire
        FileSystem.deleteAsync(directPdfUri, { idempotent: true })
          .then(() => console.log('Fichier temporaire de prévisualisation supprimé'))
          .catch(error => console.log('Erreur lors de la suppression du fichier temporaire:', error));
      }
    };
  }, [isPreview, directPdfUri]);
  
  if (!pdfUri && !templateImage) {
    return (
      <View style={styles.errorContainer}>
        <Text>Erreur: Fichier non trouvé</Text>
      </View>
    );
  }

  const handleShare = async () => {
    if (!pdfUri || templateImage) {
      Alert.alert('Information', 'Ceci est un aperçu. Vous ne pouvez pas partager ce fichier.');
      return;
    }
    
    try {
      // Vérifier que le fichier existe
      const fileInfo = await FileSystem.getInfoAsync(pdfUri);
      if (!fileInfo.exists) {
        Alert.alert('Erreur', 'Le fichier PDF n\'existe plus');
        return;
      }
      
      await Sharing.shareAsync(pdfUri);
    } catch (error) {
      console.error('Erreur partage:', error);
      Alert.alert('Erreur', 'Impossible de partager la facture');
    }
  };

  const handleView = async () => {
    if (!pdfUri || templateImage) {
      Alert.alert('Information', 'Ceci est un aperçu d\'image. Utilisez les boutons pour sélectionner ce template.');
      return;
    }
    
    try {
      // Vérifier que le fichier existe
      const fileInfo = await FileSystem.getInfoAsync(pdfUri);
      if (!fileInfo.exists) {
        Alert.alert('Erreur', 'Le fichier PDF n\'existe plus');
        return;
      }
      
      // Sur iOS, obtenir une URI de contenu pour le partage
      let shareUri = pdfUri;
      
      if (Platform.OS === 'ios') {
        try {
          shareUri = await FileSystem.getContentUriAsync(pdfUri);
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.surface.primary,
      borderBottomWidth: 1,
      borderBottomColor: theme.border.light,
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
      color: theme.primary,
      paddingHorizontal: 8,
    },
    content: {
      flex: 1,
      padding: 20,
      justifyContent: 'center',
    },
    infoCard: {
      backgroundColor: theme.surface.primary,
      borderRadius: 16,
      padding: 30,
      alignItems: 'center',
      shadowColor: theme.text.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
      marginBottom: 30,
    },
    invoiceTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text.primary,
      marginTop: 20,
      marginBottom: 8,
      textAlign: 'center',
    },
    clientText: {
      fontSize: 16,
      color: theme.text.secondary,
      marginBottom: 8,
    },
    amountText: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.primary,
      marginTop: 12,
    },
    actionsContainer: {
      gap: 12,
    },
    actionButton: {
      backgroundColor: theme.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      gap: 10,
    },
    shareActionButton: {
      backgroundColor: theme.surface.primary,
      borderWidth: 2,
      borderColor: theme.primary,
    },
    actionButtonText: {
      color: theme.text.inverse,
      fontSize: 16,
      fontWeight: '700',
    },
    shareButtonText: {
      color: theme.primary,
    },
    dateText: {
      fontSize: 14,
      color: theme.text.tertiary,
      marginTop: 8,
    },
    previewBadge: {
      fontSize: 12,
      color: theme.colors.red500,
      backgroundColor: theme.colors.red50,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginTop: 4,
      fontWeight: '600',
    },
    previewText: {
      fontSize: 14,
      color: theme.text.secondary,
      textAlign: 'center',
      marginTop: 8,
      fontStyle: 'italic',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    templateImage: {
      width: '100%',
      height: '100%',
      maxHeight: height * 0.8,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.invoiceNumber} numberOfLines={1} ellipsizeMode="middle">
            {invoice?.invoiceNumber || invoiceNumber}
          </Text>
          {isPreview && (
            <Text style={styles.previewBadge}>Aperçu</Text>
          )}
        </View>

        {!isPreview && (
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {templateImage ? (
          <View style={styles.imageContainer}>
            <Image 
              source={templateImage} 
              style={styles.templateImage}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View style={styles.infoCard}>
            <Ionicons name="document-text" size={80} color={theme.primary} />
            {isPreview ? (
              <>
                <Text style={styles.invoiceTitle}>Aperçu du template</Text>
                <Text style={styles.clientText}>
                  Prévisualisation avec données de démonstration
                </Text>
                <Text style={styles.previewText}>
                  Ceci est un aperçu du style de facture sélectionné
                </Text>
              </>
            ) : invoice ? (
              <>
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
              </>
            ) : (
              <>
                <Text style={styles.invoiceTitle}>{invoiceNumber}</Text>
                <Text style={styles.clientText}>
                  Document PDF
                </Text>
              </>
            )}
          </View>
        )}

        {!templateImage && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleView}>
              <Ionicons name="eye-outline" size={24} color={theme.text.inverse} />
              <Text style={styles.actionButtonText}>
                {isPreview ? 'Voir l\'aperçu' : 'Voir la facture'}
              </Text>
            </TouchableOpacity>

            {!isPreview && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.shareActionButton]} 
                onPress={handleShare}
              >
                <Ionicons name="share-social-outline" size={24} color={theme.primary} />
                <Text style={[styles.actionButtonText, styles.shareButtonText]}>Partager</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};