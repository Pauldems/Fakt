# BookingFakt 📄

**Application mobile de facturation dédiée aux hébergeurs touristiques**

BookingFakt est une application React Native conçue spécifiquement pour les propriétaires d'hébergements de courte durée (Airbnb, locations saisonnières, chambres d'hôtes) qui simplifie la création et la gestion de factures professionnelles.

## ✨ Fonctionnalités principales

### 📋 Gestion des factures
- **Création intuitive** : Formulaire guidé avec calculs automatiques
- **Templates professionnels** : 4 modèles d'invoice (Moderne, Classique, Minimal, Original)
- **Multi-devises** : Support de 10 devises (EUR, USD, GBP, CHF, CAD, JPY, AUD, NOK, SEK, DKK)
- **Numérotation automatique** : Gestion séquentielle des numéros de facture
- **PDF haute qualité** : Génération d'invoices prêtes à imprimer

### 🌐 Support multilingue
- **5 langues** : Français, Anglais, Espagnol, Allemand, Italien
- **Traduction automatique** : Emails traduits avec l'API DeepL
- **Localisation complète** : Invoices et contenus traduits

### 👥 Gestion clientèle
- **Carnet de clients** : Sauvegarde automatique des informations client
- **Auto-complétion** : Sélection rapide des clients récurrents
- **Adresses complètes** : Support optionnel des adresses clients

### 💳 Modes de paiement
- Plateforme (Airbnb, Booking.com...)
- Espèces
- Carte bancaire
- Virement bancaire
- Chèque

### 🏢 Personnalisation entreprise
- **Logo et signature** : Branding personnalisé
- **Informations légales** : SIRET, TVA, coordonnées
- **Templates emails** : Messages personnalisables
- **Paramètres TVA** : Calculs automatiques

### ☁️ Stockage hybride
- **Synchronisation Firebase** : Sauvegarde cloud sécurisée
- **Mode hors-ligne** : Fonctionne sans connexion
- **Google Drive** : Backup automatique des factures

## 🚀 Installation et développement

### Prérequis
- Node.js (≥ 18.0.0)
- npm ou yarn
- React Native development environment
- Expo CLI

### Installation
```bash
# Cloner le projet
git clone [repository-url]
cd BookingFakt

# Installer les dépendances
npm install

# Lancer l'application
npm start
```

### Scripts disponibles
```bash
npm start        # Démarrer le serveur de développement
npm run android  # Lancer sur Android
npm run ios      # Lancer sur iOS
npm run web      # Version web (si supportée)
```

## 🏗️ Architecture technique

### Stack technologique
- **Framework** : React Native + Expo
- **Langage** : TypeScript
- **Navigation** : React Navigation v7
- **Stockage** : AsyncStorage + Firebase Firestore
- **Authentification** : Firebase Auth
- **PDF** : expo-print
- **Formulaires** : react-hook-form

### Structure du projet
```
src/
├── components/          # Composants réutilisables
├── contexts/           # Contextes React (Auth, Theme)
├── features/           # Fonctionnalités par écran
│   ├── activation/     # Système d'activation
│   ├── invoice/        # Création de factures
│   ├── invoiceList/    # Liste et gestion
│   └── settings/       # Paramètres
├── services/           # Services métier
├── theme/             # Thèmes et styles
├── types/             # Types TypeScript
└── utils/             # Utilitaires
```

## 🔑 Système d'activation

L'application utilise un système d'activation basé sur des codes :

### Types d'abonnement
- **Essai** : 7 jours gratuits
- **Mensuel** : 1 mois (4,99€)
- **Trimestriel** : 3 mois (12,99€)
- **Annuel** : 1 an (19,99€)
- **Vie** : Permanent (49,99€)

### Format des codes
- 16 caractères avec tirets (XXXX-XXXX-XXXX-XXXX)
- Validation en temps réel via Firebase
- Un code = un appareil

## 📤 Export et partage

### Options d'export
- **PDF** : Factures prêtes à imprimer
- **CSV** : Export données pour comptabilité
- **Email** : Envoi direct avec pièce jointe

### Intégrations
- Application mail native
- Google Drive (backup)
- Partage système iOS/Android

## 🔧 Configuration

### Variables d'environnement
Créer un fichier `.env` avec :
```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_domain
FIREBASE_PROJECT_ID=your_project_id
# ... autres clés Firebase
```

### Firebase Setup
1. Créer un projet Firebase
2. Activer Authentication et Firestore
3. Configurer les règles de sécurité
4. Ajouter les clés dans `.env`

## 🛡️ Sécurité

- **Isolation des données** : Chaque utilisateur a ses propres données
- **Chiffrement local** : AsyncStorage sécurisé
- **Règles Firebase** : Accès contrôlé côté serveur
- **Validation** : Codes d'activation sécurisés

## 🤝 Contribution

### Guidelines
1. Respecter la structure TypeScript
2. Suivre les conventions de nommage
3. Tester sur iOS et Android
4. Documenter les nouvelles fonctionnalités

### Workflow
1. Fork le projet
2. Créer une branche feature
3. Développer et tester
4. Soumettre une Pull Request

## 📄 Licence

Ce projet est sous licence propriétaire. Tous droits réservés.

## 📞 Support

Pour toute question ou support :
- Créer une issue sur GitHub
- Contacter l'équipe de développement

---

**BookingFakt** - Simplifiez votre facturation d'hébergement touristique 🏠✨