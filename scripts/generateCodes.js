/**
 * Script pour générer des codes d'activation
 * 
 * Usage: 
 * node scripts/generateCodes.js [type] [count]
 * 
 * Examples:
 * node scripts/generateCodes.js lifetime 5
 * node scripts/generateCodes.js annual 10
 * node scripts/generateCodes.js monthly 20
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Vous devrez télécharger ce fichier

// Initialiser Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fakt-33da2'
});

const db = admin.firestore();

// Types de codes disponibles
const CODE_TYPES = {
  lifetime: {
    type: 'lifetime',
    description: 'Accès à vie',
    price: 49.99,
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
  const docRef = db.collection('activationCodes').doc(code.replace(/-/g, ''));
  const doc = await docRef.get();
  return doc.exists;
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
  const now = new Date();
  const cleanCode = code.replace(/-/g, ''); // Enlever les tirets pour la clé
  
  const codeDoc = {
    code: cleanCode,
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
  
  await db.collection('activationCodes').doc(cleanCode).set(codeDoc);
  return codeDoc;
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
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
  }
}

// Fonction pour lister les codes existants
async function listCodes(type = null, status = null) {
  console.log('\n📊 Codes d\'activation existants:');
  console.log('=================================');
  
  let query = db.collection('activationCodes');
  
  if (type) {
    query = query.where('type', '==', type);
  }
  
  if (status) {
    query = query.where('status', '==', status);
  }
  
  const snapshot = await query.orderBy('createdAt', 'desc').get();
  
  if (snapshot.empty) {
    console.log('Aucun code trouvé');
    return;
  }
  
  let totalValue = 0;
  const stats = {};
  
  snapshot.forEach(doc => {
    const code = doc.data();
    totalValue += code.price || 0;
    
    const key = `${code.type}_${code.status}`;
    stats[key] = (stats[key] || 0) + 1;
    
    const date = code.createdAt?.toDate?.()?.toLocaleDateString?.('fr-FR') || 'N/A';
    const user = code.userEmail || 'N/A';
    
    console.log(`${code.code} | ${code.type.padEnd(10)} | ${code.status.padEnd(8)} | ${date} | ${user}`);
  });
  
  console.log('\n📈 Statistiques:');
  console.log('================');
  Object.entries(stats).forEach(([key, count]) => {
    console.log(`${key}: ${count}`);
  });
  console.log(`\n💰 Valeur totale: ${totalValue.toFixed(2)}€`);
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
🔑 Générateur de codes d'activation BookingFakt
===============================================

Usage:
  node generateCodes.js [type] [count]
  node generateCodes.js list [type] [status]

Types disponibles:
  lifetime   - Accès à vie (49.99€)
  annual     - Accès 1 an (19.99€)
  quarterly  - Accès 3 mois (12.99€)
  monthly    - Accès 1 mois (4.99€)
  trial      - Essai 7 jours (gratuit)

Exemples:
  node generateCodes.js lifetime 5
  node generateCodes.js annual 10
  node generateCodes.js list
  node generateCodes.js list annual unused
  
Statuts:
  unused - Code pas encore utilisé
  used   - Code déjà activé
  expired - Code expiré
`);
  process.exit(1);
}