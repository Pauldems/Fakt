export const msalConfig = {
  // Client ID public pour OneDrive personnel (pas besoin d'Azure AD)
  clientId: '00000000-0000-0000-0000-000000000000', // Client ID générique OneDrive
  authority: 'https://login.microsoftonline.com/consumers', // Pour comptes personnels uniquement
  redirectUri: 'invoicegenerator://auth',
  scopes: [
    'openid',
    'profile',
    'email',
    'offline_access',
    'Files.ReadWrite.AppFolder', // Accès uniquement au dossier de l'app
  ],
  additionalParameters: {
    prompt: 'select_account'
  },
  
  // Configuration OneDrive
  oneDriveApiUrl: 'https://graph.microsoft.com/v1.0',
  appFolderName: 'Apps/InvoiceGenerator', // Dossier automatique dans OneDrive
};