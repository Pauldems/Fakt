# 🗑️ Guide : Suppression des données utilisateur

## 📋 Vue d'ensemble

Quand un utilisateur clique sur **"Supprimer toutes mes données"** dans l'app :

### ✅ Ce qui EST supprimé (automatique)

**Données locales sur l'appareil :**
1. ✅ Toutes les factures (AsyncStorage)
2. ✅ Tous les PDFs (FileSystem)
3. ✅ Tous les clients (AsyncStorage)
4. ✅ Paramètres utilisateur (AsyncStorage)
5. ✅ Consentement RGPD (AsyncStorage)
6. ✅ Compteur de factures (AsyncStorage)
7. ✅ Données d'activation locale (AsyncStorage)
8. ✅ Dossier PDFs complet (FileSystem)
9. ✅ Références Firebase locales (AsyncStorage)
10. ✅ Tous les caches

**Résultat :** L'app redémarre automatiquement et affiche l'écran d'activation.

---

### ❌ Ce qui N'EST PAS supprimé (manuel uniquement)

**Données Firebase (serveur) :**
- ❌ Code d'activation dans Firestore (`activationCodes/{codeId}`)
- ❌ Données utilisateur dans Firestore (si synchronisées)

**Pourquoi ?**
- Sécurité : L'utilisateur ne peut pas supprimer lui-même son code d'activation
- Traçabilité : Tu dois garder une trace des codes vendus
- Abus : Empêche un utilisateur de "réinitialiser" son code gratuitement

---

## 🔄 Workflow complet de suppression

### Étape 1️⃣ : L'utilisateur supprime ses données (dans l'app)

```
1. Paramètres → Légal → "Supprimer toutes mes données"
2. Confirmation 1 : "ATTENTION - Suppression définitive"
   └─ Message : "Seules vos données LOCALES seront supprimées"
3. Confirmation 2 : "DERNIÈRE CONFIRMATION"
4. Suppression de toutes les données locales
5. App redémarre automatiquement (Updates.reloadAsync())
6. Écran d'activation s'affiche
```

**État après :**
- ✅ L'appareil est vide (comme première installation)
- ❌ Le code dans Firebase existe toujours
- ❌ L'utilisateur ne peut PAS réutiliser son ancien code (déjà lié à son Device ID)

---

### Étape 2️⃣ : Tu supprimes le code d'activation (Firebase Console)

**Option A : Suppression manuelle dans Firebase Console**

```
1. Aller sur https://console.firebase.google.com
2. Projet : fakt-33da2
3. Firestore Database → activationCodes
4. Trouver le code de l'utilisateur
5. Cliquer sur les 3 points → "Delete document"
6. Confirmer la suppression
```

**Option B : Via script (recommandé)**

Tu peux créer un script admin pour supprimer les codes :

```javascript
// scripts/deleteActivationCode.js
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteActivationCode(code) {
  try {
    // Supprimer le code d'activation
    await db.collection('activationCodes').doc(code).delete();
    console.log(`✅ Code ${code} supprimé avec succès`);

    // La Cloud Function onActivationCodeDeleted se déclenchera automatiquement
    // et supprimera toutes les données Firebase de l'utilisateur
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Utilisation
const codeToDelete = process.argv[2];
if (codeToDelete) {
  deleteActivationCode(codeToDelete);
} else {
  console.log('Usage: node deleteActivationCode.js XXXX-XXXX-XXXX-XXXX');
}
```

**Utilisation :**
```bash
node scripts/deleteActivationCode.js ABCD-EFGH-IJKL-MNOP
```

---

### Étape 3️⃣ : Cloud Function automatique (déjà implémentée)

**Fichier :** `functions/index.js`

Quand tu supprimes un code d'activation dans Firebase, la Cloud Function `onActivationCodeDeleted` se déclenche automatiquement :

```javascript
exports.onActivationCodeDeleted = functions.firestore
  .document('activationCodes/{codeId}')
  .onDelete(async (snap, context) => {
    const deletedCode = snap.data();
    const deviceId = deletedCode.deviceId;

    if (!deviceId) {
      console.log('Aucun deviceId associé');
      return null;
    }

    // Supprimer automatiquement :
    // 1. Paramètres utilisateur (settings/{deviceId})
    // 2. Clients (clients/{deviceId}/...)
    // 3. Factures (invoices/{deviceId}/...)
    // 4. Compteurs (invoiceCounters/{deviceId})
  });
```

**Résultat :**
- ✅ Toutes les données Firebase de l'utilisateur sont supprimées
- ✅ Traçabilité complète (logs Firebase)
- ✅ Conformité RGPD (droit à l'effacement)

---

## 📊 Tableau récapitulatif

| Action | Qui ? | Où ? | Automatique ? |
|--------|-------|------|---------------|
| Suppression données locales | Utilisateur | App mobile | ✅ Oui |
| Redémarrage app | Système | App mobile | ✅ Oui |
| Suppression code Firebase | **Admin (TOI)** | Firebase Console | ❌ Manuel |
| Suppression données Firebase | Cloud Function | Firebase | ✅ Oui (après suppression code) |

---

## 🔐 Sécurité et légalité

### Pourquoi l'utilisateur ne peut pas supprimer son code ?

**Raisons techniques :**
- Le code est lié à un Device ID spécifique
- Un code ne peut être utilisé qu'UNE SEULE fois
- Empêche les abus (réutilisation infinie du même code)

**Raisons légales :**
- Tu dois garder une trace des ventes (comptabilité)
- Conformité fiscale (factures, TVA)
- Prévention de fraude

**Raisons RGPD :**
- Le code d'activation n'est PAS une donnée personnelle (c'est un produit acheté)
- Les données personnelles (nom, email, factures) sont bien supprimées localement
- L'utilisateur peut demander la suppression totale (y compris Firebase) en te contactant

---

## ⚠️ Cas d'usage

### Cas 1 : Utilisateur veut "réinitialiser" l'app

```
Utilisateur : "Je veux supprimer mes factures et recommencer"
Action : Suppression dans l'app ✅
Résultat : Données locales supprimées, mais code toujours valide
         → L'utilisateur peut continuer à utiliser l'app (son code fonctionne toujours)
         ❌ ERREUR : Le code est déjà lié à son Device ID, il ne peut pas le réutiliser
```

**Solution :**
L'utilisateur doit acheter un nouveau code (199,99€).

---

### Cas 2 : Utilisateur veut exercer son droit RGPD

```
Utilisateur : "Je veux supprimer TOUTES mes données selon le RGPD"
Action : 1. Suppression dans l'app ✅
        2. Contacter le support pour supprimer le code Firebase ✅
Résultat : Données locales + Firebase complètement supprimées
```

**Workflow :**
1. L'utilisateur supprime ses données dans l'app
2. L'utilisateur t'envoie un email : "Demande de suppression RGPD pour le code XXXX-XXXX-XXXX-XXXX"
3. Tu vérifies l'identité
4. Tu supprimes le code dans Firebase
5. La Cloud Function supprime automatiquement les données
6. Tu confirmes par email à l'utilisateur

**Délai légal RGPD :** Maximum 30 jours

---

### Cas 3 : Utilisateur change d'appareil

```
Utilisateur : "J'ai changé de téléphone, comment réutiliser mon code ?"
Réponse : ❌ Impossible - Le code est lié à l'ancien Device ID
```

**Solutions :**
- Option 1 : Acheter un nouveau code (199,99€)
- Option 2 (geste commercial) : Tu réinitialises manuellement son code dans Firebase
  ```
  1. Trouver le code dans Firebase
  2. Supprimer le champ "deviceId"
  3. Changer "status" de "used" à "unused"
  4. L'utilisateur peut réactiver sur le nouvel appareil
  ```

---

## 📝 Checklist pour toi (Admin)

### Quand un utilisateur demande une suppression totale :

- [ ] 1. Vérifier l'identité de l'utilisateur (email d'activation)
- [ ] 2. Vérifier que l'utilisateur a bien supprimé ses données locales
- [ ] 3. Aller dans Firebase Console → Firestore
- [ ] 4. Trouver le code d'activation (collection `activationCodes`)
- [ ] 5. Supprimer le document
- [ ] 6. Vérifier que la Cloud Function s'est bien déclenchée (logs Firebase)
- [ ] 7. Vérifier que les données utilisateur ont été supprimées
- [ ] 8. Confirmer par email à l'utilisateur (délai RGPD : 30 jours max)

### Logs à vérifier dans Firebase :

```
Functions → Logs
Rechercher : "onActivationCodeDeleted"
Vérifier : "✅ Données utilisateur supprimées pour deviceId: XXXX"
```

---

## 🆘 Support utilisateur

### Message type pour un utilisateur qui a supprimé ses données :

```
Bonjour [Nom],

Vos données locales ont été supprimées avec succès sur votre appareil.

Pour supprimer également votre code d'activation de nos serveurs
et exercer votre droit RGPD, merci de nous confirmer :

1. Votre nom complet : _______
2. Votre email d'activation : _______
3. Votre code d'activation (si vous l'avez encore) : _______

Nous procéderons à la suppression complète sous 30 jours maximum.

⚠️ Attention : Après cette suppression, vous devrez acheter un
nouveau code d'activation (199,99€) pour réutiliser l'application.

Cordialement,
L'équipe Fakt
```

---

## 🔄 Résumé workflow complet

```
┌─────────────────────────────────────────────────────────┐
│  UTILISATEUR                                            │
│  ↓                                                      │
│  1. Paramètres → "Supprimer toutes mes données"        │
│  2. Confirmation x2                                     │
│  3. ✅ Données locales supprimées                       │
│  4. ✅ App redémarre                                    │
│  5. ❌ Code Firebase toujours présent                   │
│  6. ⚠️ Ne peut PAS réutiliser son code                 │
└─────────────────────────────────────────────────────────┘
                        ↓
                (Si demande RGPD)
                        ↓
┌─────────────────────────────────────────────────────────┐
│  ADMIN (TOI)                                            │
│  ↓                                                      │
│  1. Vérifier identité utilisateur                       │
│  2. Firebase Console → activationCodes                  │
│  3. Supprimer le document du code                       │
└─────────────────────────────────────────────────────────┘
                        ↓
                (Automatique)
                        ↓
┌─────────────────────────────────────────────────────────┐
│  CLOUD FUNCTION                                         │
│  ↓                                                      │
│  1. onActivationCodeDeleted se déclenche                │
│  2. ✅ Supprime settings/{deviceId}                     │
│  3. ✅ Supprime clients/{deviceId}/*                    │
│  4. ✅ Supprime invoices/{deviceId}/*                   │
│  5. ✅ Supprime invoiceCounters/{deviceId}              │
└─────────────────────────────────────────────────────────┘
                        ↓
                (Résultat final)
                        ↓
┌─────────────────────────────────────────────────────────┐
│  ✅ Suppression totale réussie                          │
│  • Données locales : SUPPRIMÉES                         │
│  • Données Firebase : SUPPRIMÉES                        │
│  • Code d'activation : SUPPRIMÉ                         │
│  • Conformité RGPD : ✅                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Conclusion

**Pour l'utilisateur :**
- La suppression dans l'app est IMMÉDIATE et LOCALE
- Il devra acheter un nouveau code pour réutiliser l'app
- Pour supprimer le code Firebase, il doit te contacter

**Pour toi (Admin) :**
- Tu gardes le contrôle sur les codes d'activation
- Tu peux supprimer manuellement dans Firebase Console
- La Cloud Function fait le nettoyage automatique

**Conformité RGPD :**
- ✅ Droit à l'effacement respecté (local immédiat + Firebase sur demande)
- ✅ Délai de 30 jours respecté
- ✅ Transparence totale (message clair à l'utilisateur)

---

**Date :** 20 octobre 2025
**Version :** 1.0
