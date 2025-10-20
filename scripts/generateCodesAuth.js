/**
 * Script pour générer des codes d'activation avec authentification Firebase
 * 
 * Usage: 
 * node scripts/generateCodesAuth.js [type] [count]
 * 
 * Examples:
 * node scripts/generateCodesAuth.js lifetime 5
 * node scripts/generateCodesAuth.js annual 10
 * node scripts/generateCodesAuth.js monthly 20
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, doc, setDoc, getDoc, query, where, orderBy, getDocs } = require('firebase/firestore');

// Configuration Firebase (même que dans firebaseConfig.ts)
const firebaseConfig = {
  apiKey: "AIzaSyBjW5k615PsMeBT4uskn9JFliju04YoZ1I",
  authDomain: "fakt-33da2.firebaseapp.com",
  projectId: "fakt-33da2",
  storageBucket: "fakt-33da2.firebasestorage.app",
  messagingSenderId: "811992642333",
  appId: "1:811992642333:web:93d1636a1619859f0b67f4",
  measurementId: "G-XM8CKQLJHS"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Credentials admin (à configurer)
const ADMIN_EMAIL = process.env.FIREBASE_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.FIREBASE_ADMIN_PASSWORD || 'your-admin-password';

// Types de codes disponibles
const CODE_TYPES = {
  lifetime: {
    type: 'lifetime',
    description: 'Accès à vie',
    price: 199.99,
    validUntil: null
  },
  annual: {
    type: 'annual',
    description: 'Accès 1 an',
    price: 19.99,
    validUntil: null // Calculé lors de l'activation
  },
  quarterly: {
    type: 'quarterly',
    description: 'Accès 3 mois',
    price: 12.99,
    validUntil: null
  },
  monthly: {
    type: 'monthly',
    description: 'Accès 1 mois',
    price: 4.99,
    validUntil: null
  },
  trial: {
    type: 'trial',
    description: 'Essai 7 jours',
    price: 0,
    validUntil: null
  }
};

// Fonction d'authentification admin
async function authenticateAdmin() {
  try {
    console.log('🔐 Authentification en cours...');
    const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Authentification réussie pour:', userCredential.user.email);
    return true;
  } catch (error) {
    console.error('❌ Erreur d\'authentification:', error.message);
    console.log('\n💡 Conseil: Assurez-vous que:');
    console.log('- Votre email admin est correct');
    console.log('- Votre mot de passe est correct');
    console.log('- Le compte admin existe dans Firebase Auth');
    console.log('- Les variables d\'environnement FIREBASE_ADMIN_EMAIL et FIREBASE_ADMIN_PASSWORD sont définies');
    return false;
  }
}

// Générer un code unique
function generateUniqueCode(type) {
  const prefix = type.toUpperCase().substring(0, 4);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = `FAKT-${prefix}-`;
  
  // Générer 8 caractères restants
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

// Vérifier si un code existe déjà
async function codeExists(code) {
  try {
    const docRef = doc(db, 'activationCodes', code); // Garder les tirets
    const docSnapshot = await getDoc(docRef);
    return docSnapshot.exists();
  } catch (error) {
    console.error('Erreur lors de la vérification du code:', error);
    return true; // En cas d'erreur, on assume que le code existe pour éviter les doublons
  }
}

// Générer un code unique (qui n'existe pas déjà)
async function generateUniqueUniqueCode(type) {
  let code;
  let attempts = 0;
  
  do {
    code = generateUniqueCode(type);
    attempts++;
    
    if (attempts > 100) {
      throw new Error('Impossible de générer un code unique après 100 tentatives');
    }
  } while (await codeExists(code));
  
  return code;
}

// Créer un document de code dans Firestore
async function createCodeDocument(code, codeInfo) {
  try {
    const now = new Date();

    const codeDoc = {
      code: code, // Garder les tirets !
      type: codeInfo.type,
      status: 'unused',
      createdAt: now,
      expiresAt: codeInfo.validUntil,
      usedBy: null,
      usedAt: null,
      userEmail: null,
      price: codeInfo.price,
      description: codeInfo.description
    };

    const docRef = doc(db, 'activationCodes', code); // Utiliser le code avec tirets comme ID
    await setDoc(docRef, codeDoc);
    return codeDoc;
  } catch (error) {
    console.error('Erreur lors de la création du document:', error);
    throw error;
  }
}

// Fonction principale
async function generateCodes(type, count) {
  if (!CODE_TYPES[type]) {
    console.error(`Type de code invalide: ${type}`);
    console.log('Types disponibles:', Object.keys(CODE_TYPES).join(', '));
    return;
  }
  
  if (count <= 0 || count > 100) {
    console.error('Le nombre de codes doit être entre 1 et 100');
    return;
  }

  // Authentification requise
  const isAuthenticated = await authenticateAdmin();
  if (!isAuthenticated) {
    console.error('❌ Authentification échouée. Impossible de continuer.');
    return;
  }
  
  const codeInfo = CODE_TYPES[type];
  const generatedCodes = [];
  
  console.log(`\n🔄 Génération de ${count} codes de type "${type}"...`);
  console.log(`💰 Prix: ${codeInfo.price}€`);
  console.log(`📝 Description: ${codeInfo.description}\n`);
  
  try {
    for (let i = 0; i < count; i++) {
      const code = await generateUniqueUniqueCode(type);
      const codeDoc = await createCodeDocument(code, codeInfo);
      generatedCodes.push(code);
      
      console.log(`✅ ${i + 1}/${count}: ${code}`);
    }
    
    console.log(`\n🎉 ${count} codes générés avec succès !`);
    console.log('\n📋 Codes générés:');
    console.log('================');
    generatedCodes.forEach((code, index) => {
      console.log(`${index + 1}. ${code}`);
    });
    
    // Sauvegarder dans un fichier CSV
    const fs = require('fs');
    const csvContent = [
      'Code,Type,Prix,Description,Date_creation',
      ...generatedCodes.map(code => 
        `${code},${codeInfo.type},${codeInfo.price},${codeInfo.description},${new Date().toISOString()}`
      )
    ].join('\n');
    
    const filename = `codes_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    fs.writeFileSync(filename, csvContent);
    console.log(`\n💾 Codes sauvegardés dans: ${filename}`);

    // Sauvegarder aussi en JSON
    const jsonContent = {
      type: type,
      count: count,
      generated_at: new Date().toISOString(),
      codes: generatedCodes.map(code => ({
        code: code,
        type: codeInfo.type,
        price: codeInfo.price,
        description: codeInfo.description
      }))
    };
    
    const jsonFilename = `codes_${type}_${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(jsonFilename, JSON.stringify(jsonContent, null, 2));
    console.log(`💾 Codes sauvegardés en JSON dans: ${jsonFilename}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
  }
}

// Fonction pour lister les codes existants
async function listCodes(type = null, status = null) {
  // Authentification requise
  const isAuthenticated = await authenticateAdmin();
  if (!isAuthenticated) {
    console.error('❌ Authentification échouée. Impossible de continuer.');
    return;
  }

  console.log('\n📊 Codes d\'activation existants:');
  console.log('=================================');
  
  try {
    let queryRef = collection(db, 'activationCodes');
    
    // Note: Firebase Web SDK ne permet pas de chaîner where() et orderBy() facilement
    // On récupère tous les documents et on filtre côté client
    const snapshot = await getDocs(queryRef);
    
    if (snapshot.empty) {
      console.log('Aucun code trouvé');
      return;
    }
    
    let codes = [];
    snapshot.forEach(doc => {
      const codeData = doc.data();
      
      // Filtrer par type si spécifié
      if (type && codeData.type !== type) return;
      
      // Filtrer par statut si spécifié
      if (status && codeData.status !== status) return;
      
      codes.push(codeData);
    });

    // Trier par date de création (plus récent en premier)
    codes.sort((a, b) => {
      const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
      const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
      return bDate - aDate;
    });
    
    if (codes.length === 0) {
      console.log('Aucun code trouvé avec les critères spécifiés');
      return;
    }
    
    let totalValue = 0;
    const stats = {};
    
    codes.forEach(code => {
      totalValue += code.price || 0;
      
      const key = `${code.type}_${code.status}`;
      stats[key] = (stats[key] || 0) + 1;
      
      const date = code.createdAt?.toDate?.()?.toLocaleDateString?.('fr-FR') || 
                   (code.createdAt ? new Date(code.createdAt).toLocaleDateString('fr-FR') : 'N/A');
      const user = code.userEmail || 'N/A';
      
      console.log(`${code.code} | ${code.type.padEnd(10)} | ${code.status.padEnd(8)} | ${date} | ${user}`);
    });
    
    console.log('\n📈 Statistiques:');
    console.log('================');
    Object.entries(stats).forEach(([key, count]) => {
      console.log(`${key}: ${count}`);
    });
    console.log(`\n💰 Valeur totale: ${totalValue.toFixed(2)}€`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des codes:', error);
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

if (command === 'list') {
  listCodes(args[1], args[2]).then(() => process.exit(0));
} else if (command && CODE_TYPES[command]) {
  const count = parseInt(args[1]) || 1;
  generateCodes(command, count).then(() => process.exit(0));
} else {
  console.log(`
🔑 Générateur de codes d'activation Fakt (Auth Version)
==============================================================

Configuration requise:
  Variables d'environnement:
  - FIREBASE_ADMIN_EMAIL=votre-email-admin@example.com
  - FIREBASE_ADMIN_PASSWORD=votre-mot-de-passe-admin

Usage:
  node generateCodesAuth.js [type] [count]
  node generateCodesAuth.js list [type] [status]

Types disponibles:
  lifetime   - Accès à vie (49.99€)
  annual     - Accès 1 an (19.99€)
  quarterly  - Accès 3 mois (12.99€)
  monthly    - Accès 1 mois (4.99€)
  trial      - Essai 7 jours (gratuit)

Exemples:
  node generateCodesAuth.js lifetime 5
  node generateCodesAuth.js annual 10
  node generateCodesAuth.js list
  node generateCodesAuth.js list annual unused
  
Statuts:
  unused - Code pas encore utilisé
  used   - Code déjà activé
  expired - Code expiré

Configuration des variables d'environnement:
  Windows:
    set FIREBASE_ADMIN_EMAIL=admin@example.com
    set FIREBASE_ADMIN_PASSWORD=password123
    node generateCodesAuth.js lifetime 5

  Linux/Mac:
    export FIREBASE_ADMIN_EMAIL=admin@example.com
    export FIREBASE_ADMIN_PASSWORD=password123
    node generateCodesAuth.js lifetime 5

  Ou directement:
    FIREBASE_ADMIN_EMAIL=admin@example.com FIREBASE_ADMIN_PASSWORD=password123 node generateCodesAuth.js lifetime 5
`);
  process.exit(1);
}