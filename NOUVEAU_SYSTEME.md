# 🔐 Nouveau Système d'Activation Simplifié

## Changements principaux

### ✅ Ce qui a été supprimé :
- **Création de compte utilisateur** (email, mot de passe, nom)
- **Système d'authentification Firebase Auth**
- **Connexion/déconnexion**
- **Gestion des comptes multiples**

### ✨ Ce qui a été ajouté :
- **Activation par code uniquement**
- **Stockage local sécurisé**
- **Un code = un appareil (impossible de partager)**
- **Activation définitive après saisie du code**

## 🎯 Fonctionnement

### 1. Premier lancement
```
App démarre → Pas d'activation → Écran d'activation affiché
```

### 2. Activation
```
User saisit code → Validation Firebase → Stockage local → Accès app
```

### 3. Lancements suivants  
```
App démarre → Vérification locale → Accès direct à l'app
```

### 4. Protection anti-partage
- Chaque code ne peut être utilisé qu'**une seule fois**
- L'activation est liée à un **ID d'appareil unique**
- Impossible d'utiliser le même code sur plusieurs appareils

## 🔧 Architecture technique

### Services créés/modifiés :

1. **`src/services/activationService.ts`** (nouveau)
   - Gère l'activation sans authentification
   - Stockage local avec AsyncStorage
   - Vérification d'expiration
   - Ajout de nouveaux codes

2. **`src/contexts/AuthContext.tsx`** (simplifié)
   - Plus de gestion d'utilisateur
   - Juste l'état d'activation de l'app

3. **`src/features/activation/ActivationScreen.tsx`** (simplifié)
   - Interface épurée : juste le code
   - Plus de création de compte

4. **`src/features/settings/SubscriptionSection.tsx`** (adapté)
   - Affiche les infos d'activation locales
   - Bouton de réinitialisation au lieu de déconnexion

## 💾 Stockage des données

### Local (AsyncStorage)
```json
{
  "app_activation_code": "FAKTLIFE12345678",
  "app_activation_data": {
    "code": "FAKTLIFE12345678",
    "type": "lifetime",
    "activatedAt": "2024-01-15T10:30:00Z",
    "expiresAt": null,
    "deviceId": "1642251000-abc123def456",
    "isActive": true
  }
}
```

### Firebase (codes)
```json
{
  "FAKTLIFE12345678": {
    "status": "used",
    "usedAt": "2024-01-15T10:30:00Z",
    "deviceId": "1642251000-abc123def456",
    "type": "lifetime",
    "price": 49.99
  }
}
```

## 🛡️ Sécurité renforcée

### Protection anti-fraude
1. **Code unique** : Impossible de réutiliser un code
2. **Device binding** : Lié à l'appareil d'activation
3. **Vérification serveur** : Validation côté Firebase
4. **Stockage chiffré** : AsyncStorage sécurisé

### Traçabilité
- Quel code a été utilisé
- Quand il a été activé
- Sur quel appareil (ID unique)
- Type d'abonnement

## 📱 Interface utilisateur

### Écran d'activation
- Design épuré et moderne
- Formatage automatique du code
- Messages informatifs clairs
- Indicateurs de sécurité

### Paramètres
- Affichage du statut d'activation
- Informations sur l'appareil
- Possibilité d'ajouter des codes (extension)
- Option de réinitialisation

## 🚀 Avantages du nouveau système

1. **Simplicité** : Plus besoin de créer un compte
2. **Sécurité** : Impossible de partager les codes
3. **Performance** : Pas de vérification serveur à chaque lancement
4. **UX** : Activation en une étape
5. **Maintenance** : Moins de complexité côté serveur

## 🔄 Migration depuis l'ancien système

Si vous aviez déjà l'ancien système :
1. Les anciens codes restent valides
2. Les nouvelles activations utilisent le nouveau système
3. Pas de migration nécessaire pour les codes existants

## 🎯 Utilisation

### Pour l'utilisateur final :
1. Achète un code d'activation
2. Lance l'app
3. Saisit le code une seule fois
4. Utilise l'app normalement, pour toujours (selon le type)

### Pour vous (vendeur) :
1. Générez les codes avec le script
2. Vendez les codes aux clients
3. Chaque code ne peut être utilisé qu'une fois
4. Traçabilité complète dans Firebase