# 🔥 Structure Firebase pour Fakt

## 📊 Organisation des données par utilisateur

Chaque utilisateur qui active l'application avec un code d'activation a ses propres données dans Firebase, organisées sous son `deviceId` unique.

## 🗂️ Structure complète

```
📁 Firebase Firestore Database

├── 📁 activationCodes/                    # Codes d'activation (global)
│   ├── 📄 FAKT-LIFE-ABCD-1234            # Code avec tirets
│   │   ├── code: "FAKT-LIFE-ABCD-1234"
│   │   ├── type: "lifetime"
│   │   ├── status: "used"/"unused"
│   │   ├── price: 49.99
│   │   ├── usedBy: "device_123456789"
│   │   └── userEmail: "user@email.com"
│   └── 📄 FAKT-TRIA-EFGH-5678
│
└── 📁 users/                              # Données par utilisateur
    └── 📁 {deviceId}/                     # Ex: device_123456789_abc123
        ├── 📁 settings/                   # Paramètres et propriétés
        │   └── 📄 main
        │       ├── companyName: "Ma Société"
        │       ├── companyAddress: "123 Rue Example"
        │       ├── phoneNumber: "0123456789"
        │       ├── propertyTemplates: [...]    # 🏠 PROPRIÉTÉS ICI
        │       ├── customProperties: [...]
        │       └── invoiceTemplate: "modern"
        │
        ├── 📁 clients/                    # 👥 CLIENTS ICI
        │   ├── 📄 client_123_abc
        │   │   ├── id: "client_123_abc"
        │   │   ├── name: "Dupont"
        │   │   ├── firstName: "Jean"
        │   │   ├── email: "jean.dupont@email.com"
        │   │   ├── address: "456 Rue Client, 75001 Paris"
        │   │   └── lastUsed: "2025-09-21T12:00:00.000Z"
        │   └── 📄 client_456_def
        │
        ├── 📁 invoices/                   # 🧾 FACTURES ICI
        │   ├── 📄 invoice_789_ghi
        │   │   ├── id: "invoice_789_ghi"
        │   │   ├── firstName: "Jean"
        │   │   ├── lastName: "Dupont"
        │   │   ├── email: "jean.dupont@email.com"
        │   │   ├── arrivalDate: "15/09/2025"
        │   │   ├── departureDate: "22/09/2025"
        │   │   ├── pricePerNight: "120"
        │   │   ├── extras: [...]
        │   │   ├── selectedPropertyId: "prop_123"
        │   │   ├── createdAt: "2025-09-21T12:00:00.000Z"
        │   │   └── userId: "device_123456789_abc123"
        │   └── 📄 invoice_101_jkl
        │
        └── 📁 counters/                   # Compteurs de numérotation
            └── 📄 main
                ├── lastInvoiceNumber: 42
                └── updatedAt: "2025-09-21T12:00:00.000Z"
```

## 🎯 Accès aux données pour chaque utilisateur

### 🏠 **Propriétés de l'utilisateur**
- **Chemin Firebase** : `users/{deviceId}/settings/main`
- **Champ** : `propertyTemplates`
- **Format** :
```json
{
  "propertyTemplates": [
    {
      "id": "prop_123",
      "name": "Appartement Paris",
      "properties": [
        {"name": "Ville", "value": "Paris"},
        {"name": "Adresse", "value": "123 Rue Example"}
      ],
      "defaultPrice": 120
    }
  ]
}
```

### 👥 **Clients de l'utilisateur**
- **Chemin Firebase** : `users/{deviceId}/clients/{clientId}`
- **Un document par client** :
```json
{
  "id": "client_123_abc",
  "name": "Dupont",
  "firstName": "Jean",
  "email": "jean.dupont@email.com",
  "address": "456 Rue Client, 75001 Paris",
  "lastUsed": "2025-09-21T12:00:00.000Z"
}
```

### 🧾 **Factures de l'utilisateur**
- **Chemin Firebase** : `users/{deviceId}/invoices/{invoiceId}`
- **Une facture par document** :
```json
{
  "id": "invoice_789_ghi",
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean.dupont@email.com",
  "arrivalDate": "15/09/2025",
  "departureDate": "22/09/2025",
  "numberOfNights": "7",
  "pricePerNight": "120",
  "taxAmount": "8.40",
  "extras": [
    {
      "name": "Ménage",
      "price": 30,
      "quantity": 1,
      "translationKey": "cleaning"
    }
  ],
  "selectedPropertyId": "prop_123",
  "invoiceNumber": "042",
  "invoiceDate": "21/09/2025",
  "userId": "device_123456789_abc123",
  "createdAt": "2025-09-21T12:00:00.000Z"
}
```

## 🔑 Récupération de l'ID utilisateur

L'ID utilisateur (`deviceId`) est stocké dans les données d'activation locales :

```typescript
// Récupérer l'ID utilisateur
const userDataService = require('./services/userDataService');
const userId = await userDataService.getUserId();

// Accéder aux données
const userRef = doc(db, 'users', userId);
const clientsRef = collection(db, 'users', userId, 'clients');
const invoicesRef = collection(db, 'users', userId, 'invoices');
```

## 🔄 Services de gestion

- **`userDataService.ts`** : Service principal Firebase
- **`hybridClientService.ts`** : Gestion clients (Firebase + local)
- **`hybridSettingsService.ts`** : Gestion paramètres (Firebase + local)
- **`userInfoService.ts`** : Informations utilisateur depuis activation

## 🚀 Avantages de cette structure

1. **Isolation des données** : Chaque utilisateur a ses propres données
2. **Évolutivité** : Structure scalable pour de nombreux utilisateurs
3. **Sécurité** : Pas de mélange de données entre utilisateurs
4. **Performance** : Requêtes optimisées par utilisateur
5. **Mode hors ligne** : Cache local synchronisé avec Firebase

## 🎯 Recherche dans Firebase Console

Pour voir les données d'un utilisateur spécifique dans Firebase Console :

1. Aller dans **Firestore Database**
2. Naviguer vers `users` → `{deviceId de l'utilisateur}`
3. Les 4 collections principales :
   - `settings/main` → **Propriétés et paramètres**
   - `clients/` → **Liste des clients**
   - `invoices/` → **Liste des factures**
   - `counters/main` → **Compteurs**