/**
 * Script d'administration pour gérer les utilisateurs et codes
 * 
 * Usage: 
 * node scripts/manageUsers.js disable [code]     - Désactiver un code
 * node scripts/manageUsers.js enable [code]      - Réactiver un code  
 * node scripts/manageUsers.js delete [code]      - Supprimer un code
 * node scripts/manageUsers.js list               - Lister tous les codes utilisés
 * node scripts/manageUsers.js user [email]       - Infos d'un utilisateur
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialiser Firebase Admin (réutiliser s'il existe déjà)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'fakt-33da2'
  });
}

const db = admin.firestore();

// Désactiver un code (bloque l'accès sans supprimer les données)
async function disableCode(code) {
  try {
    const cleanCode = code.replace(/-/g, '').toUpperCase();
    const formattedCode = `FAKT-${cleanCode.substring(4, 8)}-${cleanCode.substring(8, 12)}-${cleanCode.substring(12, 16)}`;
    
    const codeRef = db.collection('activationCodes').doc(formattedCode);
    const codeDoc = await codeRef.get();
    
    if (!codeDoc.exists()) {
      console.log('❌ Code non trouvé:', formattedCode);
      return;
    }

    await codeRef.update({
      status: 'disabled',
      disabledAt: admin.firestore.FieldValue.serverTimestamp(),
      disabledBy: 'admin'
    });

    console.log('🔒 Code désactivé:', formattedCode);
    console.log('   → L\'utilisateur sera déconnecté dans les 30 secondes');
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Réactiver un code
async function enableCode(code) {
  try {
    const cleanCode = code.replace(/-/g, '').toUpperCase();
    const formattedCode = `FAKT-${cleanCode.substring(4, 8)}-${cleanCode.substring(8, 12)}-${cleanCode.substring(12, 16)}`;
    
    const codeRef = db.collection('activationCodes').doc(formattedCode);
    const codeDoc = await codeRef.get();
    
    if (!codeDoc.exists()) {
      console.log('❌ Code non trouvé:', formattedCode);
      return;
    }

    await codeRef.update({
      status: 'used', // Remettre en "utilisé"
      enabledAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Code réactivé:', formattedCode);
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Supprimer complètement un code
async function deleteCode(code) {
  try {
    const cleanCode = code.replace(/-/g, '').toUpperCase();
    const formattedCode = `FAKT-${cleanCode.substring(4, 8)}-${cleanCode.substring(8, 12)}-${cleanCode.substring(12, 16)}`;
    
    const codeRef = db.collection('activationCodes').doc(formattedCode);
    const codeDoc = await codeRef.get();
    
    if (!codeDoc.exists()) {
      console.log('❌ Code non trouvé:', formattedCode);
      return;
    }

    const codeData = codeDoc.data();
    
    // Supprimer l'utilisateur associé si il existe
    if (codeData.deviceId) {
      await db.collection('users').doc(codeData.deviceId).delete();
      console.log('🗑️ Utilisateur supprimé');
    }

    // Supprimer le code
    await codeRef.delete();
    console.log('🗑️ Code supprimé:', formattedCode);
    console.log('   → L\'utilisateur sera déconnecté dans les 30 secondes');
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Lister tous les codes utilisés
async function listUsedCodes() {
  try {
    console.log('\n📊 Codes utilisés:');
    console.log('==================');
    
    const snapshot = await db.collection('activationCodes')
      .where('status', 'in', ['used', 'disabled'])
      .orderBy('usedAt', 'desc')
      .get();

    if (snapshot.empty) {
      console.log('Aucun code utilisé');
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      const status = data.status === 'disabled' ? '🔒 DÉSACTIVÉ' : '✅ ACTIF';
      const date = data.usedAt?.toDate?.()?.toLocaleDateString?.('fr-FR') || 'N/A';
      const user = data.userName || data.userEmail || 'N/A';
      
      console.log(`${doc.id} | ${status} | ${data.type.padEnd(10)} | ${date} | ${user}`);
    });
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Infos d'un utilisateur par email
async function getUserInfo(email) {
  try {
    console.log('\n👤 Recherche utilisateur:', email);
    console.log('=============================');
    
    // Chercher dans les codes
    const codeSnapshot = await db.collection('activationCodes')
      .where('userEmail', '==', email)
      .get();

    if (codeSnapshot.empty) {
      console.log('❌ Aucun utilisateur trouvé avec cet email');
      return;
    }

    codeSnapshot.forEach(doc => {
      const data = doc.data();
      const status = data.status === 'disabled' ? '🔒 DÉSACTIVÉ' : '✅ ACTIF';
      
      console.log('Code:', doc.id);
      console.log('Statut:', status);
      console.log('Type:', data.type);
      console.log('Nom:', data.userName || 'N/A');
      console.log('Email:', data.userEmail);
      console.log('Activé le:', data.usedAt?.toDate?.()?.toLocaleDateString?.('fr-FR') || 'N/A');
      console.log('Device ID:', data.deviceId || 'N/A');
    });
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];
const param = args[1];

switch (command) {
  case 'disable':
    if (!param) {
      console.log('Usage: node manageUsers.js disable [code]');
      process.exit(1);
    }
    disableCode(param).then(() => process.exit(0));
    break;
    
  case 'enable':
    if (!param) {
      console.log('Usage: node manageUsers.js enable [code]');
      process.exit(1);
    }
    enableCode(param).then(() => process.exit(0));
    break;
    
  case 'delete':
    if (!param) {
      console.log('Usage: node manageUsers.js delete [code]');
      process.exit(1);
    }
    deleteCode(param).then(() => process.exit(0));
    break;
    
  case 'list':
    listUsedCodes().then(() => process.exit(0));
    break;
    
  case 'user':
    if (!param) {
      console.log('Usage: node manageUsers.js user [email]');
      process.exit(1);
    }
    getUserInfo(param).then(() => process.exit(0));
    break;
    
  default:
    console.log(`
🔧 Script d'administration Fakt
=====================================

Commandes disponibles:

  disable [code]  - Désactiver un code (bloquer l'accès)
  enable [code]   - Réactiver un code  
  delete [code]   - Supprimer complètement un code
  list            - Lister tous les codes utilisés
  user [email]    - Informations d'un utilisateur

Exemples:
  node manageUsers.js disable FAKT-LIFE-A1B2-C3D4
  node manageUsers.js list
  node manageUsers.js user jean.dupont@email.com
`);
    process.exit(1);
}