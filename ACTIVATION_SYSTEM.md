# 🔐 Système d'activation BookingFakt

## Vue d'ensemble

Le système d'activation permet de contrôler l'accès à l'application avec des codes uniques à usage unique. Chaque code peut être de type différent (à vie, annuel, mensuel, etc.).

## 🚀 Configuration initiale

### 1. Firebase Console
1. Allez dans **Firestore Database**
2. Créez les collections suivantes :
   - `activationCodes`
   - `users`

### 2. Règles de sécurité Firestore
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Codes d'activation : lecture pour tous, écriture admin seulement
    match /activationCodes/{code} {
      allow read: true;
      allow write: if false; // Admin seulement via script
    }
    
    // Utilisateurs : accès à ses propres données seulement
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3. Authentication
Dans Firebase Console → Authentication :
1. Activez "Adresse e-mail/Mot de passe"
2. (Optionnel) Configurez les domaines autorisés

## 💳 Types de codes disponibles

| Type | Durée | Prix suggéré | Utilisation |
|------|-------|--------------|-------------|
| `trial` | 7 jours | Gratuit | Période d'essai |
| `monthly` | 1 mois | 4,99€ | Abonnement court |
| `quarterly` | 3 mois | 12,99€ | Abonnement saisonnier |
| `annual` | 1 an | 19,99€ | Abonnement standard |
| `lifetime` | À vie | 49,99€ | Achat unique |

## 🛠️ Génération des codes

### Installation des dépendances
```bash
npm install firebase-admin
```

### Télécharger la clé de service
1. Firebase Console → Paramètres → Comptes de service
2. Cliquez "Générer une nouvelle clé privée"
3. Sauvegardez le fichier comme `scripts/serviceAccountKey.json`

### Générer des codes
```bash
# Générer 5 codes à vie
node scripts/generateCodes.js lifetime 5

# Générer 10 codes annuels
node scripts/generateCodes.js annual 10

# Générer 20 codes mensuels
node scripts/generateCodes.js monthly 20

# Lister tous les codes
node scripts/generateCodes.js list

# Lister codes annuels non utilisés
node scripts/generateCodes.js list annual unused
```

## 📱 Flux utilisateur

### 1. Premier lancement
```
App lance → Pas d'utilisateur connecté → Écran d'activation
```

### 2. Activation
```
Utilisateur saisit code → Validation → Création compte → Accès app
```

### 3. Connexions suivantes
```
App lance → Utilisateur connecté → Vérification abonnement → Accès app
```

### 4. Expiration
```
Abonnement expiré → Écran d'activation → Saisie nouveau code
```

## 🔍 Surveillance

### États des codes
- **unused** : Code généré, pas encore utilisé
- **used** : Code activé par un utilisateur
- **expired** : Code expiré (si applicable)

### Surveillance des expirations
L'app vérifie automatiquement :
- À chaque lancement
- Notifications 30 jours avant expiration
- Notifications 7 jours avant expiration
- Blocage après expiration

## 🎯 Stratégies de vente

### 1. Freemium
- Codes `trial` gratuits pour découverte
- Limitation fonctionnalités après essai

### 2. Abonnement
- Codes `monthly`/`annual` pour revenus récurrents
- Renouvellement avant expiration

### 3. Premium
- Codes `lifetime` pour early adopters
- Prix plus élevé, pas de renouvellement

## 🛡️ Sécurité

### Codes
- 16 caractères alphanumériques
- Format : `FAKT-TYPE-XXXX-XXXX`
- Vérification unicité à la génération
- Usage unique garanti

### Utilisateurs
- Authentification Firebase
- Données chiffrées en transit
- Validation côté serveur

### Protection anti-fraude
- Un code = un compte
- Impossible de réutiliser un code
- Traçabilité complète (qui, quand, où)

## 📊 Analytics

### Métriques importantes
- Taux d'activation des codes
- Taux de renouvellement
- Revenus par type de code
- Codes non utilisés (perte)

### Suivi dans Firebase
- Console Firebase → Analytics
- Events custom pour tracking
- Conversion funnel

## 🚨 Dépannage

### Codes qui ne marchent pas
1. Vérifier format (16 caractères)
2. Vérifier statut dans Firestore
3. Vérifier règles de sécurité

### Utilisateur ne peut pas se connecter
1. Vérifier email/mot de passe
2. Vérifier abonnement actif
3. Vérifier date d'expiration

### Données manquantes
1. Vérifier règles Firestore
2. Vérifier collections créées
3. Vérifier permissions utilisateur

## 📧 Support client

### Template email pour codes
```
Merci pour votre achat de BookingFakt !

Votre code d'activation : FAKT-LIFE-XXXX-XXXX

Instructions :
1. Téléchargez l'app BookingFakt
2. Lancez l'app
3. Saisissez votre code d'activation
4. Créez votre compte

Support : contact@topal.fr
```

### FAQ
**Q : Mon code ne fonctionne pas**
R : Vérifiez que vous avez saisi les 16 caractères correctement, sans espaces.

**Q : Puis-je utiliser un code sur plusieurs appareils ?**
R : Non, chaque code ne peut être utilisé qu'une seule fois.

**Q : Comment renouveler mon abonnement ?**
R : Allez dans Paramètres → Mon abonnement → Ajouter un code.

## 🔧 Maintenance

### Nettoyage périodique
- Supprimer codes expirés anciens (>1 an)
- Archiver utilisateurs inactifs (>2 ans)
- Optimiser index Firestore

### Monitoring
- Surveiller usage Firestore
- Surveiller coûts Firebase
- Surveiller performances app

### Backups
- Export régulier codes générés
- Backup structure utilisateurs
- Documentation procédures