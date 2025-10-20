/**
 * Script pour générer des codes d'activation via l'API web Firebase
 * Utilise les mêmes credentials que l'app
 * 
 * Usage: 
 * node scripts/generateCodesWeb.js [type] [count]
 * 
 * Examples:
 * node scripts/generateCodesWeb.js lifetime 5
 * node scripts/generateCodesWeb.js annual 10
 * node scripts/generateCodesWeb.js monthly 20
 */

// Configuration Firebase (depuis votre projet)
const firebaseConfig = {
  apiKey: "AIzaSyCohJNPfX92aFJnsPE3WQZN-e8yQKsBZT4",
  authDomain: "fakt-33da2.firebaseapp.com",
  projectId: "fakt-33da2",
  storageBucket: "fakt-33da2.appspot.com",
  messagingSenderId: "100644379917",
  appId: "1:100644379917:web:e2f84b978e079fcea5db6e",
  measurementId: "G-X0RGNWEB5H"
};

// Initialiser Firebase
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
    validUntil: null
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

// Vérifier si un code existe déjà dans Firebase
async function codeExists(code) {
  try {
    const docRef = doc(db, 'activationCodes', code);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.log('⚠️  Erreur vérification code:', error.message);
    return false;
  }
}

// Générer un code unique (qui n'existe pas déjà)
async function generateUniqueUniqueCode(type) {
  let code;
  let attempts = 0;
  
  do {
    code = generateUniqueCode(type);
    attempts++;
    
    if (attempts > 50) {
      throw new Error('Impossible de générer un code unique après 50 tentatives');
    }
  } while (await codeExists(code));
  
  return code;
}

// Ajouter un code dans Firebase
async function addCodeToFirebase(code, codeInfo) {
  try {
    const codeDoc = {
      code: code,
      type: codeInfo.type,
      status: 'unused',
      createdAt: new Date().toISOString(),
      expiresAt: null,
      usedBy: null,
      usedAt: null,
      userEmail: null,
      price: codeInfo.price,
      description: codeInfo.description
    };
    
    const docRef = doc(db, 'activationCodes', code);
    await setDoc(docRef, codeDoc);
    
    return true;
  } catch (error) {
    console.error(`❌ Erreur ajout ${code}:`, error.message);
    return false;
  }
}

// Fonction principale pour générer les codes et les ajouter automatiquement à Firebase
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
  
  const codeInfo = CODE_TYPES[type];
  const generatedCodes = [];
  
  console.log(`\n🔄 Génération de ${count} codes de type "${type}"...`);
  console.log(`💰 Prix: ${codeInfo.price}€`);
  console.log(`📝 Description: ${codeInfo.description}\n`);
  
  try {
    // Générer les codes et les ajouter directement à Firebase
    for (let i = 0; i < count; i++) {
      const code = await generateUniqueUniqueCode(type);
      
      // Ajouter à Firebase
      const added = await addCodeToFirebase(code, codeInfo);
      
      if (added) {
        generatedCodes.push({
          displayCode: code,
          type: codeInfo.type,
          price: codeInfo.price,
          description: codeInfo.description
        });
        
        console.log(`✅ ${i + 1}/${count}: ${code} → Ajouté à Firebase`);
      } else {
        console.log(`❌ ${i + 1}/${count}: ${code} → Échec ajout Firebase`);
        i--; // Retry this iteration
      }
    }
    
    console.log(`\n🎉 ${count} codes générés avec succès !`);
    console.log('\n📋 Codes générés et ajoutés à Firebase:');
    console.log('=========================================');
    generatedCodes.forEach((code, index) => {
      console.log(`${index + 1}. ${code.displayCode}`);
    });
    
    // Sauvegarder dans un fichier CSV pour backup
    const fs = require('fs');
    const csvContent = [
      'Code,Type,Prix,Description,Date_creation',
      ...generatedCodes.map(code => 
        `${code.displayCode},${code.type},${code.price},${code.description},${new Date().toISOString()}`
      )
    ].join('\n');
    
    const filename = `codes_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    fs.writeFileSync(filename, csvContent);
    console.log(`\n💾 Backup CSV sauvegardé dans: ${filename}`);
    
    console.log('\n🔥 SUCCÈS:');
    console.log('==========');
    console.log(`✅ ${count} codes ajoutés automatiquement à Firebase !`);
    console.log('✅ Les codes sont immédiatement utilisables dans l\'application !');
    console.log('\n🎯 Codes prêts à utiliser:');
    generatedCodes.forEach((code, index) => {
      console.log(`   ${index + 1}. ${code.displayCode} (${code.description})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

if (command && CODE_TYPES[command]) {
  const count = parseInt(args[1]) || 1;
  generateCodes(command, count).then(() => process.exit(0));
} else {
  console.log(`
🔑 Générateur de codes d'activation Fakt (Version Automatique)
=====================================================================

Usage:
  node generateCodesWeb.js [type] [count]

Types disponibles:
  lifetime   - Accès à vie (49.99€)
  annual     - Accès 1 an (19.99€)
  quarterly  - Accès 3 mois (12.99€)
  monthly    - Accès 1 mois (4.99€)
  trial      - Essai 7 jours (gratuit)

Exemples:
  node generateCodesWeb.js lifetime 5
  node generateCodesWeb.js annual 10
  node generateCodesWeb.js trial 20

🚀 AUTOMATIQUE: Les codes sont directement ajoutés à Firebase !
💡 Aucune manipulation manuelle nécessaire - lancez et c'est prêt !
`);
  process.exit(1);
}