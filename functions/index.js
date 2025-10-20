const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

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
