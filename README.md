# BookingFakt - Système d'Activation

## 🚀 Génération de codes d'activation

### 1. Prérequis
- Placez le fichier `serviceAccountKey.json` dans le dossier `scripts/`
- Ce fichier se télécharge depuis Firebase Console → Paramètres → Comptes de service

### 2. Commandes de génération

```bash
# Installer les dépendances (une seule fois)
npm install firebase-admin

# Générer 5 codes à vie (49.99€ chacun)
node scripts/generateCodes.js lifetime 5

# Générer 10 codes annuels (19.99€ chacun)
node scripts/generateCodes.js annual 10

# Générer 20 codes mensuels (4.99€ chacun)
node scripts/generateCodes.js monthly 20

# Générer 50 codes d'essai gratuits (7 jours)
node scripts/generateCodes.js trial 50

# Lister tous les codes
node scripts/generateCodes.js list

# Lister codes par type et statut
node scripts/generateCodes.js list annual unused
```

### 3. Types de codes disponibles

| Type | Durée | Prix | Description |
|------|-------|------|-------------|
| `lifetime` | À vie | 49.99€ | Accès permanent |
| `annual` | 1 an | 19.99€ | Accès annuel |
| `quarterly` | 3 mois | 12.99€ | Accès trimestriel |
| `monthly` | 1 mois | 4.99€ | Accès mensuel |
| `trial` | 7 jours | Gratuit | Période d'essai |

### 4. Utilisation des codes

- Chaque code ne peut être utilisé qu'**une seule fois**
- Un code = un appareil (impossible de partager)
- Les codes sont automatiquement sauvegardés en CSV
- Suivi complet dans Firebase Console

### 5. Support client

**Email :** contact@topal.fr

**Template email pour vos clients :**
```
Merci pour votre achat de BookingFakt !

Votre code d'activation : XXXX-XXXX-XXXX-XXXX

Instructions :
1. Téléchargez l'app BookingFakt
2. Lancez l'app et saisissez votre code
3. Votre licence est activée !

Support : contact@topal.fr
```

## 🛠️ Configuration initiale

Voir le fichier `ACTIVATION_SYSTEM.md` pour la configuration complète de Firebase.

## 📱 Fonctionnement de l'app

1. **Premier lancement** → Écran d'activation
2. **Saisie du code** → Validation et activation
3. **Lancements suivants** → Accès direct (plus de code à saisir)

---

**Documentation complète :** `ACTIVATION_SYSTEM.md`