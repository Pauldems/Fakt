# Cloud Functions pour Fakt

Ce répertoire contient les Firebase Cloud Functions pour Fakt.

## 🔥 Fonctions disponibles

### 1. `onActivationCodeDeleted` (Trigger automatique)

**Déclenchement** : Automatique lors de la suppression d'un code d'activation dans Firestore

**Fonctionnement** :
- Écoute les suppressions dans `activationCodes/{codeId}`
- Si le code supprimé avait un `deviceId` associé, supprime automatiquement :
  - Le document utilisateur principal (`users/{deviceId}`)
  - Tous les paramètres (`users/{deviceId}/settings/*`)
  - Tous les clients (`users/{deviceId}/clients/*`)
  - Toutes les factures (`users/{deviceId}/invoices/*`)
  - Tous les compteurs (`users/{deviceId}/counters/*`)

**Avantages** :
- ✅ Suppression automatique dès qu'un code est supprimé
- ✅ Nettoie complètement toutes les données utilisateur
- ✅ Bloque immédiatement l'accès à l'application

### 2. `deleteUserData` (Fonction HTTP callable)

**Déclenchement** : Manuel via appel HTTP

**Usage** :
```javascript
const functions = getFunctions();
const deleteUserData = httpsCallable(functions, 'deleteUserData');

// Par deviceId
await deleteUserData({ deviceId: 'device_123456789' });

// Ou par code d'activation
await deleteUserData({ codeId: 'FAKT-LIFE-XXXX-XXXX' });
```

**Fonctionnement** :
- Supprime manuellement toutes les données d'un utilisateur
- Peut être appelée depuis l'app ou un script admin

## 📦 Installation

1. Installer les dépendances :
```bash
cd functions
npm install
```

2. Initialiser Firebase (si pas déjà fait) :
```bash
firebase init functions
```

## 🚀 Déploiement

### Déployer toutes les fonctions :
```bash
firebase deploy --only functions
```

### Déployer une fonction spécifique :
```bash
firebase deploy --only functions:onActivationCodeDeleted
firebase deploy --only functions:deleteUserData
```

## 🧪 Tests locaux

Lancer l'émulateur Firebase :
```bash
cd functions
npm run serve
```

## 📝 Configuration Firebase

### Permissions Firestore requises

Assurez-vous que les règles Firestore permettent à la fonction de supprimer les données :

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Les Cloud Functions ont tous les accès par défaut
    // Pas de configuration supplémentaire nécessaire
  }
}
```

## ⚠️ Important

**Cette fonction supprime définitivement les données** :
- Aucune sauvegarde n'est créée
- La suppression est irréversible
- Toutes les factures et clients sont perdus

**Recommandations** :
- Faire une sauvegarde manuelle des données avant suppression
- Informer les utilisateurs de la suppression imminente
- Logger toutes les suppressions pour audit

## 🔍 Monitoring

Les logs des fonctions sont disponibles dans :
- **Firebase Console** → Functions → Logs
- **CLI** : `firebase functions:log`

## 🛠️ Développement

Pour tester la fonction localement :

1. Lancer l'émulateur :
```bash
firebase emulators:start --only functions,firestore
```

2. Supprimer un code dans l'émulateur Firestore UI (http://localhost:4000)

3. Observer les logs dans la console

## 📊 Exemple de log

Lors d'une suppression réussie :
```
🗑️ Code d'activation supprimé: FAKT-LIFE-1234-5678
📱 Device ID trouvé: device_123456789
🗑️ Document utilisateur marqué pour suppression: device_123456789
🗑️ 1 paramètres marqués pour suppression
🗑️ 5 clients marqués pour suppression
🗑️ 25 factures marquées pour suppression
🗑️ 1 compteurs marqués pour suppression
✅ Toutes les données de l'utilisateur device_123456789 ont été supprimées avec succès
📊 Résumé: 1 settings, 5 clients, 25 factures, 1 compteurs
```
