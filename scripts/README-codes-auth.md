# Générateur de Codes d'Activation avec Authentification Firebase

Ce script permet de générer des codes d'activation pour BookingFakt en utilisant l'authentification Firebase avec email/password au lieu du fichier `serviceAccountKey.json`.

## 🔧 Installation et Configuration

### 1. Vérifier que Firebase est installé
Firebase est déjà installé dans le projet (voir package.json).

### 2. Créer un compte admin dans Firebase
1. Allez dans la console Firebase: https://console.firebase.google.com/
2. Sélectionnez votre projet `fakt-33da2`
3. Allez dans **Authentication** > **Users**
4. Cliquez sur **Add user**
5. Créez un utilisateur avec:
   - Email: `admin@votre-domaine.com`
   - Mot de passe: un mot de passe sécurisé

### 3. Configurer les variables d'environnement

#### Windows (Command Prompt):
```cmd
set FIREBASE_ADMIN_EMAIL=admin@votre-domaine.com
set FIREBASE_ADMIN_PASSWORD=votre-mot-de-passe-securise
```

#### Windows (PowerShell):
```powershell
$env:FIREBASE_ADMIN_EMAIL="admin@votre-domaine.com"
$env:FIREBASE_ADMIN_PASSWORD="votre-mot-de-passe-securise"
```

#### Linux/Mac:
```bash
export FIREBASE_ADMIN_EMAIL="admin@votre-domaine.com"
export FIREBASE_ADMIN_PASSWORD="votre-mot-de-passe-securise"
```

## 🚀 Utilisation

### Méthode 1: Scripts simplifiés

#### Windows:
```cmd
# Éditer le fichier generate-codes.bat pour configurer vos credentials
# Puis exécuter:
scripts\generate-codes.bat lifetime 5
scripts\generate-codes.bat annual 10
scripts\generate-codes.bat list
```

#### Linux/Mac:
```bash
# Éditer le fichier generate-codes.sh pour configurer vos credentials
# Puis exécuter:
./scripts/generate-codes.sh lifetime 5
./scripts/generate-codes.sh annual 10
./scripts/generate-codes.sh list
```

### Méthode 2: Script Node.js direct

```bash
# Avec variables d'environnement définies
node scripts/generateCodesAuth.js lifetime 5
node scripts/generateCodesAuth.js annual 10
node scripts/generateCodesAuth.js list

# Ou directement en une ligne (Linux/Mac)
FIREBASE_ADMIN_EMAIL=admin@example.com FIREBASE_ADMIN_PASSWORD=password123 node scripts/generateCodesAuth.js lifetime 5
```

## 📋 Commandes disponibles

### Générer des codes
```bash
node scripts/generateCodesAuth.js [type] [count]
```

**Types disponibles:**
- `lifetime` - Accès à vie (49.99€)
- `annual` - Accès 1 an (19.99€) 
- `quarterly` - Accès 3 mois (12.99€)
- `monthly` - Accès 1 mois (4.99€)
- `trial` - Essai 7 jours (gratuit)

**Exemples:**
```bash
node scripts/generateCodesAuth.js lifetime 5      # 5 codes à vie
node scripts/generateCodesAuth.js annual 10       # 10 codes annuels
node scripts/generateCodesAuth.js trial 20        # 20 codes d'essai
```

### Lister les codes existants
```bash
node scripts/generateCodesAuth.js list [type] [status]
```

**Exemples:**
```bash
node scripts/generateCodesAuth.js list                    # Tous les codes
node scripts/generateCodesAuth.js list annual             # Codes annuels seulement
node scripts/generateCodesAuth.js list annual unused      # Codes annuels non utilisés
node scripts/generateCodesAuth.js list "" used            # Tous les codes utilisés
```

## 📁 Fichiers générés

Chaque génération crée automatiquement:

1. **Fichier CSV**: `codes_[type]_[date].csv`
   ```csv
   Code,Type,Prix,Description,Date_creation
   FAKT-LIFE-A1B2-C3D4,lifetime,49.99,Accès à vie,2025-09-21T10:30:00.000Z
   ```

2. **Fichier JSON**: `codes_[type]_[date].json`
   ```json
   {
     "type": "lifetime",
     "count": 5,
     "generated_at": "2025-09-21T10:30:00.000Z",
     "codes": [
       {
         "code": "FAKT-LIFE-A1B2-C3D4",
         "type": "lifetime",
         "price": 49.99,
         "description": "Accès à vie"
       }
     ]
   }
   ```

## 🔒 Sécurité

### Protection des credentials
- **JAMAIS** committer vos credentials dans le code
- Utilisez les variables d'environnement
- Considérez utiliser un fichier `.env` (non committé)

### Exemple de fichier .env
Créez un fichier `.env` dans le dossier `scripts/`:
```env
FIREBASE_ADMIN_EMAIL=admin@votre-domaine.com
FIREBASE_ADMIN_PASSWORD=votre-mot-de-passe-securise
```

Puis chargez-le dans votre script:
```javascript
require('dotenv').config({ path: './scripts/.env' });
```

## 🆚 Comparaison avec l'ancien script

| Caractéristique | generateCodes.js (ancien) | generateCodesAuth.js (nouveau) |
|------------------|---------------------------|--------------------------------|
| Authentification | serviceAccountKey.json | Email/Password Firebase |
| Setup | Complexe (clé service) | Simple (créer utilisateur) |
| Sécurité | Fichier sensible | Variables d'environnement |
| Déploiement | Difficile | Facile |
| Révocation | Difficile | Facile (désactiver user) |

## 🐛 Dépannage

### Erreur d'authentification
```
❌ Erreur d'authentification: Firebase: Error (auth/user-not-found)
```
**Solution:** Vérifiez que le compte admin existe dans Firebase Auth.

### Erreur de permissions
```
❌ Erreur lors de la création du document: FirebaseError: Missing or insufficient permissions
```
**Solution:** Vérifiez les règles Firestore dans la console Firebase.

### Variables d'environnement non définies
```
🔐 Email admin: admin@example.com
```
**Solution:** Configurez les vraies variables d'environnement avant d'exécuter le script.

## 📞 Support

En cas de problème:
1. Vérifiez que Node.js est installé (`node --version`)
2. Vérifiez que Firebase est configuré correctement
3. Vérifiez les permissions Firestore
4. Vérifiez que le compte admin existe dans Firebase Auth