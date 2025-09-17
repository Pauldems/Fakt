import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import activationService from '../../services/activationService';
import { useAuth } from '../../contexts/AuthContext';

interface ActivationScreenProps {
  onActivationSuccess: () => void;
}

export const ActivationScreen: React.FC<ActivationScreenProps> = ({ onActivationSuccess }) => {
  const { refreshActivation } = useAuth();
  const [step, setStep] = useState<'code' | 'info'>('code');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Formater le code automatiquement
  const handleCodeChange = (text: string) => {
    // Retirer tous les caractères non alphanumériques
    const cleaned = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    // Ajouter des tirets tous les 4 caractères
    let formatted = '';
    for (let i = 0; i < cleaned.length && i < 16; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += '-';
      }
      formatted += cleaned[i];
    }
    
    setCode(formatted);
  };

  const validateCode = async () => {
    if (code.replace(/-/g, '').length < 16) {
      Alert.alert('Erreur', 'Le code doit contenir 16 caractères');
      return;
    }

    setIsLoading(true);
    
    try {
      // Vérifier si le code existe et est valide dans Firebase
      const cleanCode = code.replace(/-/g, '').toUpperCase();
      const result = await activationService.validateCodeOnly(cleanCode);
      
      if (result.success) {
        setStep('info');
      } else {
        Alert.alert('Erreur', result.message);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur de connexion. Vérifiez votre internet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivation = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre nom');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre email');
      return;
    }

    // Validation email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erreur', 'Veuillez saisir un email valide');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🚀 Début activation avec:', { code, name, email });
      const result = await activationService.activateApp(code, name, email);
      console.log('📝 Résultat activation:', result);
      
      if (result.success) {
        console.log('✅ Activation réussie, rechargement du contexte...');
        Alert.alert('Succès', result.message, [
          { 
            text: 'OK', 
            onPress: async () => {
              // Forcer le rechargement du contexte Auth
              console.log('🔄 Rechargement du contexte d\'activation...');
              await refreshActivation();
              console.log('🔄 Appel onActivationSuccess()');
              onActivationSuccess();
            }
          }
        ]);
      } else {
        console.log('❌ Activation échouée:', result.message);
        Alert.alert('Erreur', result.message);
      }
    } catch (error) {
      console.log('💥 Erreur activation:', error);
      Alert.alert('Erreur', 'Erreur de connexion. Vérifiez votre internet.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'info') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setStep('code')}
              >
                <Ionicons name="arrow-back" size={24} color="#003580" />
              </TouchableOpacity>
              <View style={styles.logoContainer}>
                <Ionicons name="person-add" size={60} color="#003580" />
              </View>
              <Text style={styles.title}>Vos informations</Text>
              <Text style={styles.subtitle}>
                Pour finaliser l'activation de votre licence
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.codeValidated}>
                <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                <Text style={styles.codeValidatedText}>Code validé !</Text>
                <Text style={styles.codeDisplay}>{code}</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom complet</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Jean Dupont"
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Adresse email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="jean.dupont@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.activateButton,
                  (isLoading || !name.trim() || !email.trim()) && styles.activateButtonDisabled
                ]}
                onPress={handleActivation}
                disabled={isLoading || !name.trim() || !email.trim()}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="rocket" size={20} color="#fff" />
                    <Text style={styles.activateButtonText}>Activer ma licence</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="receipt" size={60} color="#003580" />
            </View>
            <Text style={styles.title}>BookingFakt</Text>
            <Text style={styles.subtitle}>
              Entrez votre code d'activation pour déverrouiller l'application
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Code d'activation</Text>
              <TextInput
                style={styles.codeInput}
                value={code}
                onChangeText={handleCodeChange}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                autoCapitalize="characters"
                maxLength={19}
                editable={!isLoading}
              />
              <Text style={styles.hint}>
                Le code contient 16 caractères (lettres et chiffres)
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.activateButton,
                (isLoading || code.replace(/-/g, '').length < 16) && styles.activateButtonDisabled
              ]}
              onPress={validateCode}
              disabled={isLoading || code.replace(/-/g, '').length < 16}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.activateButtonText}>Valider le code</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
                <Text style={styles.infoText}>Code unique à usage unique</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="phone-portrait" size={24} color="#4CAF50" />
                <Text style={styles.infoText}>Activation définitive sur cet appareil</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="wifi-off" size={24} color="#4CAF50" />
                <Text style={styles.infoText}>Fonctionne sans connexion après activation</Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Vous n'avez pas de code d'activation ?
            </Text>
            <Text style={styles.footerSubtext}>
              Contactez notre support pour obtenir votre licence
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  codeInput: {
    borderWidth: 2,
    borderColor: '#003580',
    borderRadius: 12,
    padding: 20,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    letterSpacing: 3,
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  activateButton: {
    backgroundColor: '#003580',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#003580',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  activateButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  activateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 8,
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  codeValidated: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  codeValidatedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 8,
    marginBottom: 4,
  },
  codeDisplay: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#003580',
    letterSpacing: 1,
  },
});