import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Linking } from 'react-native';

// Configuration Google OAuth
const CLIENT_ID = '380676393487-c8n03g68r6cbj48g0e83iiddrs3jd9l0.apps.googleusercontent.com';
const REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: 'com.tomburger.fakt',
  path: 'redirect'
});
// Redirect URI pour Expo Go
const EXPO_REDIRECT_URI = 'https://auth.expo.io/@jure1367/fakt';
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Clés de stockage
const TOKEN_KEY = '@google_drive_token';
const USER_INFO_KEY = '@google_drive_user';

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
}

interface GoogleUser {
  email: string;
  name: string;
  picture?: string;
}

class GoogleDriveService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  /**
   * Initialise le service en chargeant le token existant
   */
  async init() {
    try {
      const tokenData = await AsyncStorage.getItem(TOKEN_KEY);
      if (tokenData) {
        const { accessToken, refreshToken } = JSON.parse(tokenData);
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        console.log('✅ Token Google Drive chargé');
      }
    } catch (error) {
      console.error('❌ Erreur chargement token:', error);
    }
  }

  /**
   * Vérifie si l'utilisateur est connecté à Google Drive
   */
  isConnected(): boolean {
    return this.accessToken !== null;
  }

  /**
   * Authentifie l'utilisateur avec Google (méthode simplifiée)
   */
  async authenticate(): Promise<boolean> {
    try {
      console.log('🔄 Démarrage authentification Google...');
      
      // Pour Expo Go, utiliser une approche simplifiée
      return await this.authenticateWithExpoGo();
    } catch (error) {
      console.error('❌ Erreur authentification:', error);
      return false;
    }
  }

  /**
   * Authentification adaptée à Expo Go
   */
  private async authenticateWithExpoGo(): Promise<boolean> {
    try {
      // URL simplifiée qui ouvre juste Google OAuth
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${CLIENT_ID}&` +
        `redirect_uri=urn:ietf:wg:oauth:2.0:oob&` + // Mode "manual"
        `response_type=code&` +
        `scope=${encodeURIComponent(SCOPES.join(' '))}&` +
        `prompt=consent`;

      console.log('🌐 Ouverture page Google OAuth...');
      
      // Ouvrir dans le navigateur
      await Linking.openURL(authUrl);
      
      // Demander à l'utilisateur de coller le code manuellement
      return new Promise((resolve) => {
        // Simuler un succès pour l'instant - dans une vraie implémentation,
        // on afficherait un popup pour que l'utilisateur colle le code
        setTimeout(() => {
          console.log('ℹ️ Authentification manuelle requise');
          resolve(false);
        }, 1000);
      });
      
    } catch (error) {
      console.error('❌ Erreur authentification Expo Go:', error);
      return false;
    }
  }

  /**
   * Authentification avec navigateur externe
   */
  private async authenticateWithBrowser(): Promise<boolean> {
    try {
      console.log('🔄 Tentative avec Linking...');

      // Utiliser le bon redirect URI selon l'environnement
      const isExpoGo = !AuthSession.Constants?.manifest;
      const mobileRedirectUri = isExpoGo ? EXPO_REDIRECT_URI : REDIRECT_URI;

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(mobileRedirectUri)}&` +
        `response_type=token&` +
        `scope=${encodeURIComponent(SCOPES.join(' '))}&` +
        `prompt=consent&` +
        `include_granted_scopes=true`;

      console.log('🌐 Ouverture navigateur via Linking...');
      console.log('🔗 URL:', authUrl);
      
      // Écouter le retour de l'URL
      return new Promise((resolve) => {
        const handleUrl = (event: { url: string }) => {
          console.log('📥 URL reçue:', event.url);
          
          if (event.url.includes('auth.expo.io/@jure1367/fakt') ||
              event.url.startsWith(REDIRECT_URI) ||
              event.url.startsWith('com.tomburger.fakt://')) {
            // Nettoyer l'écoute
            Linking.removeEventListener('url', handleUrl);
            
            // Parser l'URL pour extraire le token
            try {
              const urlFragment = event.url.split('#')[1];
              if (urlFragment) {
                const urlParams = new URLSearchParams(urlFragment);
                const accessToken = urlParams.get('access_token');
                
                if (accessToken) {
                  this.accessToken = accessToken;
                  
                  console.log('🎯 Token extrait, longueur:', this.accessToken.length);
                  
                  // Sauvegarder le token
                  AsyncStorage.setItem(TOKEN_KEY, JSON.stringify({
                    accessToken: this.accessToken,
                    refreshToken: urlParams.get('refresh_token'),
                    expiresIn: urlParams.get('expires_in'),
                    tokenType: urlParams.get('token_type'),
                  })).then(async () => {
                    // Récupérer les infos utilisateur
                    const userInfo = await this.getUserInfo();
                    if (userInfo) {
                      console.log('✅ Authentification Linking réussie pour:', userInfo.email);
                      resolve(true);
                    } else {
                      resolve(false);
                    }
                  });
                  return;
                }
              }
            } catch (parseError) {
              console.error('❌ Erreur parsing URL:', parseError);
            }
            
            resolve(false);
          }
        };

        // Écouter les changements d'URL
        Linking.addEventListener('url', handleUrl);
        
        // Ouvrir l'URL d'authentification
        Linking.openURL(authUrl).catch((error) => {
          console.error('❌ Erreur ouverture URL:', error);
          Linking.removeEventListener('url', handleUrl);
          resolve(false);
        });

        // Timeout après 5 minutes
        setTimeout(() => {
          Linking.removeEventListener('url', handleUrl);
          console.log('⏰ Timeout authentification');
          resolve(false);
        }, 300000);
      });
      
    } catch (error) {
      console.error('❌ Erreur Linking:', error);
      return false;
    }
  }

  /**
   * Déconnecte l'utilisateur
   */
  async disconnect() {
    this.accessToken = null;
    this.refreshToken = null;
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_INFO_KEY);
    console.log('✅ Déconnexion Google Drive');
  }

  /**
   * Récupère les informations de l'utilisateur
   */
  async getUserInfo(): Promise<GoogleUser | null> {
    if (!this.accessToken) return null;

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (response.ok) {
        const userInfo = await response.json();
        await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
        return userInfo;
      }

      return null;
    } catch (error) {
      console.error('❌ Erreur récupération infos utilisateur:', error);
      return null;
    }
  }

  /**
   * Crée un dossier dans Google Drive
   */
  async createFolder(folderName: string, parentId?: string): Promise<string | null> {
    if (!this.accessToken) {
      console.error('❌ Non connecté à Google Drive');
      return null;
    }

    try {
      // Vérifier si le dossier existe déjà
      const existingFolder = await this.findFolder(folderName, parentId);
      if (existingFolder) {
        console.log(`📁 Dossier "${folderName}" existe déjà`);
        return existingFolder.id;
      }

      // Créer le dossier
      const metadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentId && { parents: [parentId] }),
      };

      const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      });

      if (response.ok) {
        const folder = await response.json();
        console.log(`✅ Dossier "${folderName}" créé avec ID: ${folder.id}`);
        return folder.id;
      }

      return null;
    } catch (error) {
      console.error('❌ Erreur création dossier:', error);
      return null;
    }
  }

  /**
   * Recherche un dossier par nom
   */
  async findFolder(folderName: string, parentId?: string): Promise<GoogleDriveFile | null> {
    if (!this.accessToken) return null;

    try {
      let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      if (parentId) {
        query += ` and '${parentId}' in parents`;
      }

      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.files && data.files.length > 0) {
          return data.files[0];
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Erreur recherche dossier:', error);
      return null;
    }
  }

  /**
   * Upload un fichier PDF vers Google Drive
   */
  async uploadPDF(pdfPath: string, fileName: string, folderId: string): Promise<boolean> {
    if (!this.accessToken) {
      console.error('❌ Non connecté à Google Drive');
      return false;
    }

    try {
      // Lire le fichier PDF
      const pdfContent = await FileSystem.readAsStringAsync(pdfPath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convertir base64 en Blob
      const pdfBlob = this.base64ToBlob(pdfContent, 'application/pdf');

      // Métadonnées du fichier
      const metadata = {
        name: fileName,
        mimeType: 'application/pdf',
        parents: [folderId],
      };

      // Créer le form data pour l'upload multipart
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', pdfBlob);

      // Upload le fichier
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: form,
      });

      if (response.ok) {
        const file = await response.json();
        console.log(`✅ Fichier "${fileName}" uploadé avec ID: ${file.id}`);
        return true;
      }

      console.error('❌ Erreur upload, status:', response.status);
      return false;
    } catch (error) {
      console.error('❌ Erreur upload PDF:', error);
      return false;
    }
  }

  /**
   * Vérifie si un fichier existe déjà dans un dossier
   */
  async fileExists(fileName: string, folderId: string): Promise<boolean> {
    if (!this.accessToken) return false;

    try {
      const query = `name='${fileName}' and '${folderId}' in parents and trashed=false`;
      
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.files && data.files.length > 0;
      }

      return false;
    } catch (error) {
      console.error('❌ Erreur vérification fichier:', error);
      return false;
    }
  }

  /**
   * Synchronise une facture avec Google Drive
   */
  async syncInvoice(pdfPath: string, invoiceNumber: string, propertyName?: string): Promise<boolean> {
    if (!this.isConnected()) {
      console.log('⚠️ Non connecté à Google Drive, synchronisation ignorée');
      return false;
    }

    try {
      console.log('🔄 Synchronisation facture vers Google Drive...');

      // Créer le dossier principal "Factures" s'il n'existe pas
      const mainFolderId = await this.createFolder('Factures');
      if (!mainFolderId) {
        console.error('❌ Impossible de créer le dossier principal');
        return false;
      }

      // Créer le sous-dossier par propriété
      const propertyFolderName = propertyName || 'Sans propriété';
      const propertyFolderId = await this.createFolder(propertyFolderName, mainFolderId);
      if (!propertyFolderId) {
        console.error('❌ Impossible de créer le dossier de propriété');
        return false;
      }

      // Vérifier si le fichier existe déjà
      const fileName = `${invoiceNumber}.pdf`;
      const exists = await this.fileExists(fileName, propertyFolderId);
      if (exists) {
        console.log(`⚠️ Facture ${fileName} existe déjà dans Drive`);
        return true;
      }

      // Upload le PDF
      const success = await this.uploadPDF(pdfPath, fileName, propertyFolderId);
      if (success) {
        console.log(`✅ Facture ${fileName} synchronisée vers Drive/${propertyFolderName}`);
      }

      return success;
    } catch (error) {
      console.error('❌ Erreur synchronisation facture:', error);
      return false;
    }
  }

  /**
   * Convertit base64 en Blob
   */
  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * Récupère les infos utilisateur sauvegardées
   */
  async getSavedUserInfo(): Promise<GoogleUser | null> {
    try {
      const userInfo = await AsyncStorage.getItem(USER_INFO_KEY);
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      return null;
    }
  }
}

export default new GoogleDriveService();