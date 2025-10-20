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
  ScrollView,
  Linking,
  Modal,
} from 'react-native';
import activationService from '../../services/activationService';
import { useAuth } from '../../contexts/AuthContext';
import { PrivacyPolicyScreen } from '../privacy/PrivacyPolicyScreen';
import consentService from '../../services/consentService';

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
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

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
        // Pauser les vérifications périodiques pendant la saisie des infos
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

    if (!consentAccepted) {
      Alert.alert('Consentement requis', 'Vous devez accepter la politique de confidentialité pour continuer');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🚀 Début activation avec:', { code, name, email });
      const result = await activationService.activateApp(code, name, email);
      console.log('📝 Résultat activation:', result);

      if (result.success) {
        // Sauvegarder le consentement RGPD
        console.log('💾 Sauvegarde du consentement RGPD...');
        await consentService.saveConsent(name, email);

        console.log('✅ Activation réussie, rechargement du contexte...');
        Alert.alert('Succès', result.message, [
          {
            text: 'OK',
            onPress: async () => {
              // Reprendre les vérifications périodiques après activation
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
        // Reprendre les vérifications périodiques en cas d'échec
        Alert.alert('Erreur', result.message);
      }
    } catch (error) {
      console.log('💥 Erreur activation:', error);
      // Reprendre les vérifications périodiques en cas d'erreur
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
                onPress={() => {
                  setStep('code');
                }}
              >
                <Text style={{fontSize: 24, color: '#003580'}}>←</Text>
              </TouchableOpacity>
              <View style={styles.logoContainer}>
                <Text style={{fontSize: 60}}>👤</Text>
              </View>
              <Text style={styles.title}>Vos informations</Text>
              <Text style={styles.subtitle}>
                Pour finaliser l'activation de votre licence
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.codeValidated}>
                <Text style={{fontSize: 32}}>✓</Text>
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

              <View style={styles.consentContainer}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setConsentAccepted(!consentAccepted)}
                  disabled={isLoading}
                >
                  <View style={[styles.checkbox, consentAccepted && styles.checkboxChecked]}>
                    {consentAccepted && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.consentTextContainer}>
                    <Text style={styles.consentText}>
                      J'accepte la{' '}
                      <Text
                        style={styles.privacyLink}
                        onPress={() => setShowPrivacyPolicy(true)}
                      >
                        politique de confidentialité
                      </Text>
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.activateButton,
                  (isLoading || !name.trim() || !email.trim() || !consentAccepted) && styles.activateButtonDisabled
                ]}
                onPress={handleActivation}
                disabled={isLoading || !name.trim() || !email.trim() || !consentAccepted}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.activateButtonText}>🚀 Activer ma licence</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

        <Modal
          visible={showPrivacyPolicy}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <PrivacyPolicyScreen onClose={() => setShowPrivacyPolicy(false)} />
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={{fontSize: 48}}>📄</Text>
              </View>
              <Text style={styles.title}>Fakt</Text>
              <Text style={styles.subtitle}>
                Entrez votre code d'activation
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
                  16 caractères (lettres et chiffres)
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
                  <Text style={styles.activateButtonText}>✓ Valider</Text>
                )}
              </TouchableOpacity>

              <View style={styles.infoSection}>
                <View style={styles.infoItem}>
                  <Text style={{fontSize: 20}}>🛡️</Text>
                  <Text style={styles.infoText}>Code unique</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={{fontSize: 20}}>📱</Text>
                  <Text style={styles.infoText}>Activation définitive</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={{fontSize: 20}}>📶</Text>
                  <Text style={styles.infoText}>Fonctionne hors ligne</Text>
                </View>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Pas de code ?</Text>
              <TouchableOpacity onPress={() => Linking.openURL('mailto:contact@topal.fr')}>
                <Text style={styles.footerLink}>Contactez le support</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#001A40',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#1976D2',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  form: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#003580',
    marginBottom: 8,
  },
  codeInput: {
    borderWidth: 2,
    borderColor: '#003580',
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    letterSpacing: 2,
    marginBottom: 6,
  },
  hint: {
    fontSize: 12,
    color: '#1976D2',
    textAlign: 'center',
    marginTop: 4,
  },
  activateButton: {
    backgroundColor: '#003580',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#003580',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  activateButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  activateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  infoSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#1976D2',
    marginLeft: 10,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerLink: {
    fontSize: 13,
    color: '#003580',
    textAlign: 'center',
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  consentContainer: {
    marginVertical: 16,
    paddingVertical: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#003580',
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#003580',
    borderColor: '#003580',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  consentTextContainer: {
    flex: 1,
    paddingTop: 2,
  },
  consentText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  privacyLink: {
    color: '#003580',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});