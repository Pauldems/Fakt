import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';

interface PrivacyPolicyScreenProps {
  onClose: () => void;
}

export const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ onClose }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onClose}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Politique de confidentialité</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.content}>
          <Text style={styles.lastUpdate}>Dernière mise à jour : 20 octobre 2025</Text>

          <Text style={styles.section}>
            Fakt respecte votre vie privée et s'engage à protéger vos données personnelles.
            Cette politique de confidentialité vous informe sur la manière dont nous collectons,
            utilisons et protégeons vos données conformément au Règlement Général sur la Protection
            des Données (RGPD).
          </Text>

          <Text style={styles.sectionTitle}>1. Responsable du traitement</Text>
          <Text style={styles.section}>
            Le responsable du traitement de vos données personnelles est :{'\n\n'}
            Fakt{'\n'}
            Email : contact@topal.fr
          </Text>

          <Text style={styles.sectionTitle}>2. Données collectées</Text>
          <Text style={styles.section}>
            Lors de l'utilisation de Fakt, nous collectons les données suivantes :{'\n\n'}

            <Text style={styles.bold}>a) Données de l'utilisateur (vous) :</Text>{'\n'}
            • Nom complet{'\n'}
            • Adresse email{'\n'}
            • Code d'activation{'\n'}
            • Identifiant unique de l'appareil{'\n'}
            • Informations de facturation (SIRET, adresse, etc.){'\n\n'}

            <Text style={styles.bold}>b) Données de vos clients (locataires) :</Text>{'\n'}
            • Nom et prénom{'\n'}
            • Adresse postale{'\n'}
            • Dates de séjour{'\n'}
            • Montants facturés{'\n\n'}

            <Text style={styles.bold}>c) Données techniques :</Text>{'\n'}
            • Logs de connexion{'\n'}
            • Date d'activation{'\n'}
            • Type de licence
          </Text>

          <Text style={styles.sectionTitle}>3. Base légale et finalité du traitement</Text>
          <Text style={styles.section}>
            Nous traitons vos données sur les bases légales suivantes :{'\n\n'}

            <Text style={styles.bold}>• Exécution du contrat :</Text>{'\n'}
            L'activation et l'utilisation de l'application nécessitent le traitement de vos données.{'\n\n'}

            <Text style={styles.bold}>• Intérêt légitime :</Text>{'\n'}
            La génération et la gestion de vos factures constituent un intérêt légitime pour votre activité professionnelle.{'\n\n'}

            <Text style={styles.bold}>• Obligation légale :</Text>{'\n'}
            La conservation des factures répond à une obligation légale de 10 ans.{'\n\n'}

            Les finalités du traitement sont :{'\n'}
            • Activation et gestion de votre licence{'\n'}
            • Génération de factures conformes à la législation{'\n'}
            • Sauvegarde et synchronisation de vos données{'\n'}
            • Support technique
          </Text>

          <Text style={styles.sectionTitle}>4. Durée de conservation</Text>
          <Text style={styles.section}>
            Vos données sont conservées pendant les durées suivantes :{'\n\n'}

            • <Text style={styles.bold}>Données d'activation :</Text> Durée de votre licence{'\n'}
            • <Text style={styles.bold}>Factures :</Text> Jusqu'à suppression manuelle (obligation légale : 10 ans){'\n'}
            • <Text style={styles.bold}>Données clients :</Text> Jusqu'à suppression manuelle{'\n'}
            • <Text style={styles.bold}>Paramètres :</Text> Jusqu'à suppression du compte
          </Text>

          <Text style={styles.sectionTitle}>5. Destinataires des données</Text>
          <Text style={styles.section}>
            Vos données sont accessibles uniquement par :{'\n\n'}

            • <Text style={styles.bold}>Vous-même :</Text> Via l'application sur votre appareil{'\n'}
            • <Text style={styles.bold}>Firebase (Google Cloud) :</Text> Hébergement et synchronisation (si activée){'\n'}
            • <Text style={styles.bold}>Google Drive :</Text> Sauvegarde optionnelle (si vous l'activez){'\n\n'}

            Nous ne vendons ni ne partageons vos données avec des tiers à des fins commerciales.
          </Text>

          <Text style={styles.sectionTitle}>6. Transferts hors UE</Text>
          <Text style={styles.section}>
            Les données stockées sur Firebase peuvent être hébergées dans des centres de données
            situés hors de l'Union Européenne. Google Cloud Platform utilise des clauses contractuelles
            types approuvées par la Commission Européenne pour garantir un niveau de protection adéquat.
          </Text>

          <Text style={styles.sectionTitle}>7. Sécurité des données</Text>
          <Text style={styles.section}>
            Nous mettons en œuvre les mesures de sécurité suivantes :{'\n\n'}

            • <Text style={styles.bold}>Authentification unique par appareil :</Text> Un code ne peut être utilisé qu'une seule fois{'\n'}
            • <Text style={styles.bold}>Stockage local sécurisé :</Text> Données chiffrées sur votre appareil{'\n'}
            • <Text style={styles.bold}>Connexion Firebase sécurisée :</Text> Protocole HTTPS et règles d'accès strictes{'\n'}
            • <Text style={styles.bold}>Pas de compte partagé :</Text> Vos données restent liées à votre appareil
          </Text>

          <Text style={styles.sectionTitle}>8. Vos droits RGPD</Text>
          <Text style={styles.section}>
            Conformément au RGPD, vous disposez des droits suivants :{'\n\n'}

            <Text style={styles.bold}>• Droit d'accès :</Text> Consulter les données que nous détenons{'\n'}
            <Text style={styles.bold}>• Droit de rectification :</Text> Corriger vos données dans les paramètres{'\n'}
            <Text style={styles.bold}>• Droit à l'effacement :</Text> Supprimer toutes vos données{'\n'}
            <Text style={styles.bold}>• Droit à la portabilité :</Text> Exporter vos données au format JSON{'\n'}
            <Text style={styles.bold}>• Droit d'opposition :</Text> Vous opposer au traitement{'\n'}
            <Text style={styles.bold}>• Droit de limitation :</Text> Limiter le traitement{'\n\n'}

            Pour exercer ces droits, vous pouvez :{'\n'}
            • Utiliser la fonction "Exporter mes données" dans les paramètres{'\n'}
            • Utiliser la fonction "Supprimer toutes mes données" dans les paramètres{'\n'}
            • Nous contacter à : contact@topal.fr
          </Text>

          <Text style={styles.sectionTitle}>9. Droit de réclamation</Text>
          <Text style={styles.section}>
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation
            auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL) :{'\n\n'}

            CNIL{'\n'}
            3 Place de Fontenoy{'\n'}
            TSA 80715{'\n'}
            75334 PARIS CEDEX 07{'\n'}
            Tél : 01 53 73 22 22{'\n'}
            www.cnil.fr
          </Text>

          <Text style={styles.sectionTitle}>10. Cookies et traceurs</Text>
          <Text style={styles.section}>
            Fakt n'utilise pas de cookies ni de traceurs publicitaires. Les seules données techniques
            collectées sont nécessaires au fonctionnement de l'application (identifiant appareil,
            état d'activation).
          </Text>

          <Text style={styles.sectionTitle}>11. Données de vos clients</Text>
          <Text style={styles.section}>
            <Text style={styles.bold}>Important :</Text> Vous êtes responsable du traitement des données
            de vos clients (locataires). Vous devez :{'\n\n'}

            • Informer vos clients que leurs données seront utilisées pour la facturation{'\n'}
            • Obtenir leur consentement si nécessaire{'\n'}
            • Respecter leurs droits RGPD (accès, rectification, suppression){'\n'}
            • Conserver les factures conformément à la loi (10 ans){'\n\n'}

            Fakt est uniquement un outil technique. Vous restez le responsable de traitement
            des données de vos clients.
          </Text>

          <Text style={styles.sectionTitle}>12. Suppression du compte</Text>
          <Text style={styles.section}>
            Vous pouvez supprimer toutes vos données à tout moment :{'\n\n'}

            • <Text style={styles.bold}>Suppression locale :</Text> "Supprimer toutes mes données" dans les paramètres{'\n'}
            • <Text style={styles.bold}>Suppression Firebase :</Text> Automatique lors de la suppression de votre code d'activation{'\n\n'}

            Attention : Cette action est irréversible. Exportez vos données avant suppression.
          </Text>

          <Text style={styles.sectionTitle}>13. Modifications de la politique</Text>
          <Text style={styles.section}>
            Nous pouvons modifier cette politique de confidentialité. En cas de changements majeurs,
            vous serez informé par email. La version en vigueur est toujours accessible dans l'application.
          </Text>

          <Text style={styles.sectionTitle}>14. Contact</Text>
          <Text style={styles.section}>
            Pour toute question concernant vos données personnelles :{'\n\n'}

            Email : contact@topal.fr{'\n'}
            Délai de réponse : 30 jours maximum (conformément au RGPD)
          </Text>

          <View style={styles.consentBox}>
            <Text style={styles.consentTitle}>✅ Vos données vous appartiennent</Text>
            <Text style={styles.consentText}>
              Fakt stocke vos données principalement sur votre appareil. La synchronisation
              Firebase est optionnelle et peut être désactivée. Vous pouvez exporter et supprimer
              vos données à tout moment.
            </Text>
          </View>

          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#003580',
    fontWeight: '600',
  },
  titleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#001A40',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#003580',
    marginTop: 24,
    marginBottom: 12,
  },
  section: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  bold: {
    fontWeight: '700',
    color: '#001A40',
  },
  consentBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 8,
  },
  consentText: {
    fontSize: 13,
    color: '#003580',
    lineHeight: 20,
  },
  bottomSpace: {
    height: 40,
  },
});
