# 🔥 Guide de déploiement des Cloud Functions - Fakt

## 📋 Vue d'ensemble

Deux fonctionnalités ont été implémentées :

### ✅ 1. Format de numérotation personnalisé
- Disponible dans **Paramètres → Format de numérotation**
- Variables : `{ANNEE}`, `{MOIS}`, `{JOUR}`, `{N}`
- Exemple : `FACT-{ANNEE}-{MOIS}-{N}` → `FACT-2025-10-001`

### ✅ 2. Suppression automatique des comptes
- Quand vous supprimez un code d'activation dans Firebase
- Toutes les données utilisateur sont automatiquement supprimées
- L'utilisateur est immédiatement bloqué

---

## 🚀 Installation des Cloud Functions

### Prérequis
- Firebase CLI installé : `npm install -g firebase-tools`
- Compte Firebase avec un projet actif
- Plan Blaze (paiement à l'usage) pour les Cloud Functions

### Étapes d'installation

#### 1. Se connecter à Firebase
```bash
firebase login
```

#### 2. Initialiser le projet (si pas déjà fait)
```bash
cd /Users/tomburger/Documents/Fakt
firebase init
```

Sélectionner :
- **Functions** (avec espace)
- Choisir votre projet Firebase
- JavaScript
- Ne pas overwrite les fichiers existants

#### 3. Installer les dépendances
```bash
cd functions
npm install
```

#### 4. Déployer les fonctions
```bash
firebase deploy --only functions
```

Résultat attendu :
```
✔ functions[onActivationCodeDeleted(us-central1)] Successful create operation.
✔ functions[deleteUserData(us-central1)] Successful create operation.
Function URL (deleteUserData): https://us-central1-[project-id].cloudfunctions.net/deleteUserData
```

---

## ✅ Vérification du déploiement

### Dans Firebase Console

1. Allez sur **Firebase Console → Functions**
2. Vous devriez voir 2 fonctions :
   - `onActivationCodeDeleted` (Trigger Firestore)
   - `deleteUserData` (HTTPS callable)

### Test de la fonction automatique

1. Allez dans **Firestore Database**
2. Naviguez vers `activationCodes`
3. Supprimez un code d'activation utilisé
4. Vérifiez dans **Functions → Logs** que la suppression s'est bien déroulée
5. Vérifiez que l'utilisateur associé a été supprimé de `users`

---

## 🧪 Test manuel

### Option 1 : Via Firebase Console

```javascript
// Dans la console Firebase Functions, testez :
{
  "deviceId": "device_123456789"
}
```

### Option 2 : Via un script Node.js

Créer `test-delete.js` :
```javascript
const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

const firebaseConfig = {
  // Votre config Firebase
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);
const deleteUserData = httpsCallable(functions, 'deleteUserData');

// Test avec deviceId
deleteUserData({ deviceId: 'device_123456789' })
  .then(result => console.log('✅ Suppression réussie:', result.data))
  .catch(error => console.error('❌ Erreur:', error));
```

---

## 📊 Monitoring

### Voir les logs en temps réel
```bash
firebase functions:log --only onActivationCodeDeleted
```

### Exemples de logs

**Suppression réussie** :
```
🗑️ Code d'activation supprimé: FAKT-LIFE-1234-5678
📱 Device ID trouvé: device_123456789
✅ Toutes les données supprimées avec succès
📊 Résumé: 1 settings, 5 clients, 25 factures, 1 compteurs
```

**Aucune donnée à supprimer** :
```
⚠️ Aucun deviceId associé, rien à supprimer
```

---

## ⚙️ Configuration avancée

### Région personnalisée

Par défaut, les fonctions sont déployées en `us-central1`. Pour changer :

```javascript
// functions/index.js
exports.onActivationCodeDeleted = functions
  .region('europe-west1')  // Europe
  .firestore
  .document('activationCodes/{codeId}')
  .onDelete(async (snap, context) => {
    // ...
  });
```

### Timeout personnalisé

```javascript
exports.onActivationCodeDeleted = functions
  .runWith({
    timeoutSeconds: 120,  // 2 minutes
    memory: '512MB'
  })
  .firestore
  .document('activationCodes/{codeId}')
  .onDelete(async (snap, context) => {
    // ...
  });
```

---

## 🔒 Sécurité

### Protéger deleteUserData

Pour restreindre l'accès uniquement aux admins :

```javascript
exports.deleteUserData = functions.https.onCall(async (data, context) => {
  // Vérifier l'authentification
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentification requise');
  }

  // Vérifier que l'utilisateur est admin
  const isAdmin = context.auth.token.admin === true;
  if (!isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Accès admin requis');
  }

  // ... reste du code
});
```

Puis dans Firebase Auth, ajouter un custom claim :
```javascript
admin.auth().setCustomUserClaims(uid, { admin: true });
```

---

## ⚠️ Important - Sauvegarde

**La suppression est définitive et irréversible !**

Avant de supprimer un code, vous pouvez :

1. **Exporter les données** via Firebase Console
2. **Créer un backup automatique** :

```javascript
// Ajouter avant la suppression dans la fonction
const backupData = {
  user: (await userRef.get()).data(),
  settings: settingsSnapshot.docs.map(d => d.data()),
  clients: clientsSnapshot.docs.map(d => d.data()),
  invoices: invoicesSnapshot.docs.map(d => d.data())
};

await db.collection('backups').doc(deviceId).set({
  data: backupData,
  deletedAt: admin.firestore.FieldValue.serverTimestamp()
});
```

---

## 🐛 Dépannage

### Erreur : "Firebase CLI not found"
```bash
npm install -g firebase-tools
```

### Erreur : "Billing account required"
Activez le plan Blaze dans Firebase Console → Settings → Usage and billing

### Fonction ne se déclenche pas
- Vérifiez les logs : `firebase functions:log`
- Vérifiez que le code a bien un `deviceId`
- Testez localement avec `firebase emulators:start`

### Timeout
Si la suppression prend trop de temps :
```javascript
.runWith({ timeoutSeconds: 300 }) // 5 minutes
```

---

## 📞 Support

En cas de problème :
1. Vérifiez les logs Firebase Functions
2. Testez localement avec l'émulateur
3. Consultez la documentation Firebase : https://firebase.google.com/docs/functions

---

## 🎉 C'est terminé !

Vos deux fonctionnalités sont maintenant prêtes :
✅ Format de numérotation personnalisé (déjà actif dans l'app)
✅ Suppression automatique des comptes (nécessite déploiement)

Pour déployer :
```bash
cd functions
npm install
firebase deploy --only functions
```
