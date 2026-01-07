const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// ==========================================
// ACTIVATION SÉCURISÉE (Cloud Function)
// ==========================================

/**
 * Cloud Function pour activer l'application de manière sécurisée
 * Toute la logique de validation est côté serveur
 *
 * @param {Object} data - { code, name, email, deviceId }
 * @returns {Object} - { success, message, activationData }
 */
exports.activateApp = functions.https.onCall(async (data, context) => {
  const { code, name, email, deviceId } = data;

  // Validation des paramètres
  if (!code || !name || !email || !deviceId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Paramètres manquants: code, name, email et deviceId sont requis'
    );
  }

  // Validation email basique
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new functions.https.HttpsError('invalid-argument', 'Format email invalide');
  }

  // Formater le code (avec tirets)
  const formattedCode = code.toUpperCase().trim();

  console.log(`🔐 Tentative d'activation - Code: ${formattedCode}, Device: ${deviceId}`);

  const db = admin.firestore();

  try {
    // Utiliser une transaction pour garantir l'atomicité
    const result = await db.runTransaction(async (transaction) => {
      // 1. Récupérer le code d'activation
      const codeRef = db.collection('activationCodes').doc(formattedCode);
      const codeDoc = await transaction.get(codeRef);

      if (!codeDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Code d\'activation invalide');
      }

      const codeData = codeDoc.data();

      // 2. Vérifier que le code n'est pas déjà utilisé
      if (codeData.status === 'used') {
        throw new functions.https.HttpsError(
          'already-exists',
          'Ce code a déjà été utilisé sur un autre appareil'
        );
      }

      if (codeData.status === 'disabled') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Ce code a été désactivé'
        );
      }

      // 3. Calculer la date d'expiration selon le type
      let expiresAt = null;
      const now = new Date();

      switch (codeData.type) {
        case 'trial':
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 jours
          break;
        case 'monthly':
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 jours
          break;
        case 'quarterly':
          expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 jours
          break;
        case 'annual':
          expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 365 jours
          break;
        case 'lifetime':
          expiresAt = null; // Pas d'expiration
          break;
        default:
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Par défaut 30 jours
      }

      // 4. Marquer le code comme utilisé
      transaction.update(codeRef, {
        status: 'used',
        usedAt: admin.firestore.FieldValue.serverTimestamp(),
        deviceId: deviceId,
        userEmail: email,
        userName: name
      });

      // 5. Créer le document utilisateur
      const userRef = db.collection('users').doc(deviceId);
      transaction.set(userRef, {
        name: name,
        email: email,
        deviceId: deviceId,
        activationCode: formattedCode,
        activationType: codeData.type,
        activatedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: expiresAt
      });

      console.log(`✅ Activation réussie - Code: ${formattedCode}, Type: ${codeData.type}`);

      // 6. Retourner les données d'activation
      return {
        code: formattedCode,
        type: codeData.type,
        activatedAt: now.toISOString(),
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        deviceId: deviceId,
        isActive: true,
        name: name,
        email: email
      };
    });

    return {
      success: true,
      message: 'Application activée avec succès !',
      activationData: result
    };

  } catch (error) {
    console.error(`❌ Erreur activation: ${error.message}`);

    // Renvoyer l'erreur si c'est déjà une HttpsError
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Erreur lors de l\'activation. Veuillez réessayer.'
    );
  }
});

/**
 * Cloud Function pour valider un code sans l'activer
 * Utile pour vérifier si un code est valide avant de demander les infos utilisateur
 *
 * @param {Object} data - { code }
 * @returns {Object} - { valid, type, message }
 */
exports.validateCode = functions.https.onCall(async (data, context) => {
  const { code } = data;

  if (!code) {
    throw new functions.https.HttpsError('invalid-argument', 'Code requis');
  }

  const formattedCode = code.toUpperCase().trim();
  const db = admin.firestore();

  try {
    const codeDoc = await db.collection('activationCodes').doc(formattedCode).get();

    if (!codeDoc.exists) {
      return { valid: false, message: 'Code d\'activation invalide' };
    }

    const codeData = codeDoc.data();

    if (codeData.status === 'used') {
      return { valid: false, message: 'Ce code a déjà été utilisé' };
    }

    if (codeData.status === 'disabled') {
      return { valid: false, message: 'Ce code a été désactivé' };
    }

    return {
      valid: true,
      type: codeData.type,
      message: 'Code valide'
    };

  } catch (error) {
    console.error('Erreur validation code:', error);
    throw new functions.https.HttpsError('internal', 'Erreur de validation');
  }
});

// ==========================================
// FONCTIONS EXISTANTES
// ==========================================

/**
 * Cloud Function déclenchée quand un code d'activation est supprimé
 * Supprime automatiquement toutes les données de l'utilisateur associé
 */
exports.onActivationCodeDeleted = functions.firestore
  .document('activationCodes/{codeId}')
  .onDelete(async (snap, context) => {
    const deletedCode = snap.data();
    const codeId = context.params.codeId;

    console.log(`🗑️ Code d'activation supprimé: ${codeId}`);

    // Vérifier si le code était utilisé et avait un deviceId associé
    if (!deletedCode.deviceId) {
      console.log('⚠️ Aucun deviceId associé, rien à supprimer');
      return null;
    }

    const deviceId = deletedCode.deviceId;
    console.log(`📱 Device ID trouvé: ${deviceId}`);

    try {
      const db = admin.firestore();
      const batch = db.batch();

      // 1. Supprimer le document utilisateur principal
      const userRef = db.collection('users').doc(deviceId);
      batch.delete(userRef);
      console.log(`🗑️ Document utilisateur marqué pour suppression: ${deviceId}`);

      // 2. Supprimer tous les paramètres (settings)
      const settingsSnapshot = await db
        .collection('users')
        .doc(deviceId)
        .collection('settings')
        .get();

      settingsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      console.log(`🗑️ ${settingsSnapshot.size} paramètres marqués pour suppression`);

      // 3. Supprimer tous les clients
      const clientsSnapshot = await db
        .collection('users')
        .doc(deviceId)
        .collection('clients')
        .get();

      clientsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      console.log(`🗑️ ${clientsSnapshot.size} clients marqués pour suppression`);

      // 4. Supprimer toutes les factures
      const invoicesSnapshot = await db
        .collection('users')
        .doc(deviceId)
        .collection('invoices')
        .get();

      invoicesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      console.log(`🗑️ ${invoicesSnapshot.size} factures marquées pour suppression`);

      // 5. Supprimer tous les compteurs
      const countersSnapshot = await db
        .collection('users')
        .doc(deviceId)
        .collection('counters')
        .get();

      countersSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      console.log(`🗑️ ${countersSnapshot.size} compteurs marqués pour suppression`);

      // Exécuter toutes les suppressions en une seule transaction
      await batch.commit();

      console.log(`✅ Toutes les données de l'utilisateur ${deviceId} ont été supprimées avec succès`);
      console.log(`📊 Résumé: ${settingsSnapshot.size} settings, ${clientsSnapshot.size} clients, ${invoicesSnapshot.size} factures, ${countersSnapshot.size} compteurs`);

      return {
        success: true,
        deletedCode: codeId,
        deviceId: deviceId,
        deletedData: {
          settings: settingsSnapshot.size,
          clients: clientsSnapshot.size,
          invoices: invoicesSnapshot.size,
          counters: countersSnapshot.size
        }
      };

    } catch (error) {
      console.error('❌ Erreur lors de la suppression des données utilisateur:', error);
      throw new functions.https.HttpsError('internal', `Erreur de suppression: ${error.message}`);
    }
  });

/**
 * Cloud Function HTTP pour supprimer manuellement un utilisateur
 * Usage: POST avec { "deviceId": "xxx" } ou { "codeId": "FAKT-XXXX-XXXX-XXXX" }
 */
exports.deleteUserData = functions.https.onCall(async (data, context) => {
  // Vérification de l'authentification (optionnel - à activer si besoin)
  // if (!context.auth) {
  //   throw new functions.https.HttpsError('unauthenticated', 'Vous devez être authentifié');
  // }

  const { deviceId, codeId } = data;

  if (!deviceId && !codeId) {
    throw new functions.https.HttpsError('invalid-argument', 'deviceId ou codeId requis');
  }

  try {
    const db = admin.firestore();
    let targetDeviceId = deviceId;

    // Si codeId fourni, chercher le deviceId associé
    if (!targetDeviceId && codeId) {
      const codeDoc = await db.collection('activationCodes').doc(codeId).get();
      if (!codeDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Code d\'activation introuvable');
      }
      targetDeviceId = codeDoc.data().deviceId;
    }

    if (!targetDeviceId) {
      throw new functions.https.HttpsError('not-found', 'Aucun utilisateur trouvé');
    }

    console.log(`🗑️ Suppression manuelle des données pour deviceId: ${targetDeviceId}`);

    const batch = db.batch();

    // Supprimer toutes les collections
    const collections = ['settings', 'clients', 'invoices', 'counters'];
    let totalDeleted = 0;

    for (const collectionName of collections) {
      const snapshot = await db
        .collection('users')
        .doc(targetDeviceId)
        .collection(collectionName)
        .get();

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      totalDeleted += snapshot.size;
    }

    // Supprimer le document utilisateur
    const userRef = db.collection('users').doc(targetDeviceId);
    batch.delete(userRef);

    await batch.commit();

    console.log(`✅ ${totalDeleted} documents supprimés pour l'utilisateur ${targetDeviceId}`);

    return {
      success: true,
      deviceId: targetDeviceId,
      deletedDocuments: totalDeleted
    };

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
