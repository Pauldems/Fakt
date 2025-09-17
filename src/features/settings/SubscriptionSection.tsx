import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import activationService, { ActivationData } from '../../services/activationService';

export const SubscriptionSection: React.FC = () => {
  const { activationData } = useAuth();
  const [showAddCodeModal, setShowAddCodeModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activationInfo, setActivationInfo] = useState<any>(null);

  useEffect(() => {
    loadActivationInfo();
  }, []);

  const loadActivationInfo = async () => {
    const info = await activationService.getActivationInfo();
    setActivationInfo(info);
  };

  if (!activationData || !activationInfo?.isActivated) return null;

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Illimitée';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getSubscriptionTypeLabel = () => {
    switch (activationData.type) {
      case 'lifetime':
        return 'Licence complète';
      case 'annual':
        return 'Licence annuelle';
      case 'monthly':
        return 'Licence mensuelle';
      case 'quarterly':
        return 'Licence trimestrielle';
      case 'trial':
        return 'Période d\'essai';
      default:
        return activationData.type;
    }
  };

  const getStatusColor = () => {
    if (activationData.type === 'lifetime') return '#4CAF50';
    
    if (!activationData.expiresAt) return '#4CAF50';
    
    const expiryDate = new Date(activationData.expiresAt);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 0) return '#f44336';
    if (daysUntilExpiry <= 7) return '#ff9800';
    if (daysUntilExpiry <= 30) return '#ffc107';
    return '#4CAF50';
  };

  const getExpiryMessage = () => {
    if (activationData.type === 'lifetime') {
      return { text: 'Licence permanente', color: '#4CAF50' };
    }
    
    if (!activationData.expiresAt) {
      return { text: 'Licence permanente', color: '#4CAF50' };
    }
    
    const expiryDate = new Date(activationData.expiresAt);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 0) {
      return { text: `Expiré le ${formatDate(expiryDate)}`, color: '#f44336' };
    }
    if (daysUntilExpiry === 1) {
      return { text: 'Expire demain !', color: '#ff9800' };
    }
    if (daysUntilExpiry <= 7) {
      return { text: `Expire dans ${daysUntilExpiry} jours`, color: '#ff9800' };
    }
    if (daysUntilExpiry <= 30) {
      return { text: `Expire dans ${daysUntilExpiry} jours`, color: '#ffc107' };
    }
    
    return { text: `Valable jusqu'au ${formatDate(expiryDate)}`, color: '#666' };
  };

  const handleCodeChange = (text: string) => {
    // Formater automatiquement le code
    const cleaned = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    let formatted = '';
    for (let i = 0; i < cleaned.length && i < 16; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += '-';
      }
      formatted += cleaned[i];
    }
    setNewCode(formatted);
  };

  const handleAddCode = async () => {
    if (newCode.replace(/-/g, '').length < 16) {
      Alert.alert('Erreur', 'Le code doit contenir 16 caractères');
      return;
    }

    setIsLoading(true);
    const result = await activationService.addNewCode(newCode.replace(/-/g, ''));
    setIsLoading(false);

    if (result.success) {
      Alert.alert('Succès', result.message);
      setShowAddCodeModal(false);
      setNewCode('');
      loadActivationInfo(); // Recharger les infos
    } else {
      Alert.alert('Erreur', result.message);
    }
  };


  const expiryMessage = getExpiryMessage();

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Ma licence</Text>
        
        <View style={[styles.card, { borderTopColor: getStatusColor() }]}>
          <View style={styles.cardHeader}>
            <View style={styles.typeContainer}>
              <Text style={styles.typeLabel}>{getSubscriptionTypeLabel()}</Text>
              {activationData.type === 'lifetime' && (
                <Ionicons name="star" size={20} color="#FFD700" style={styles.starIcon} />
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>ACTIF</Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Titulaire</Text>
              <Text style={styles.infoValue}>{activationData.name}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{activationData.email}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Activé le</Text>
              <Text style={styles.infoValue}>{formatDate(activationData.activatedAt)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Validité</Text>
              <Text style={[styles.infoValue, { color: expiryMessage.color }]}>
                {expiryMessage.text}
              </Text>
            </View>

          </View>

          {activationData.type !== 'lifetime' && (
            <View style={styles.cardFooter}>
              <TouchableOpacity 
                style={styles.renewButton}
                onPress={() => setShowAddCodeModal(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color="#003580" />
                <Text style={styles.renewButtonText}>Ajouter un code</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Modal pour ajouter un nouveau code */}
      <Modal
        visible={showAddCodeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddCodeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un code</Text>
              <TouchableOpacity onPress={() => setShowAddCodeModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Entrez un nouveau code d'activation pour étendre votre abonnement
            </Text>

            <TextInput
              style={styles.codeInput}
              value={newCode}
              onChangeText={handleCodeChange}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              autoCapitalize="characters"
              maxLength={19}
            />

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddCode}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.addButtonText}>Ajouter le code</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  starIcon: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
  },
  infoValue: {
    fontSize: 13,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  codeText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#003580',
    letterSpacing: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  renewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  renewButtonText: {
    color: '#003580',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  codeInput: {
    borderWidth: 2,
    borderColor: '#003580',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    letterSpacing: 2,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#003580',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});