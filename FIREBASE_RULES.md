# Configuration des règles Firebase

## IMPORTANT : Configurez ces règles dans Firebase Console

### 1. Firebase Storage Rules
Allez dans **Firebase Console** → **Storage** → **Rules** et collez :

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

Cliquez sur **Publier**.

### 2. Firestore Database Rules
Allez dans **Firebase Console** → **Firestore Database** → **Rules** et collez :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Cliquez sur **Publier**.

### 3. Vérifier que Firestore est activé
- Si vous voyez "Missing or insufficient permissions", c'est que Firestore n'est pas activé
- Allez dans **Firestore Database** et cliquez sur **Créer une base de données**
- Choisissez le mode **Production**
- Sélectionnez un emplacement (de préférence le même que Storage : us-east1)

## Note de sécurité
Ces règles permettent un accès total. Pour la production, utilisez des règles plus strictes avec authentification.