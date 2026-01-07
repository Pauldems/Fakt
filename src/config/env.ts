import Constants from 'expo-constants';

/**
 * Configuration centralisée pour les variables d'environnement
 * Les valeurs sont chargées depuis app.config.js via expo-constants
 */

interface ExtraConfig {
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseAppId?: string;
  firebaseMeasurementId?: string;
  deepLApiKey?: string;
  googleDriveClientId?: string;
  sentryDsn?: string;
}

const extra = (Constants.expoConfig?.extra || {}) as ExtraConfig;

// Validation des variables critiques
const validateEnvVar = (value: string | undefined, name: string): string => {
  if (!value) {
    console.warn(`[ENV] Variable ${name} non définie. Vérifiez votre fichier .env`);
    return '';
  }
  return value;
};

export const ENV = {
  // Firebase
  FIREBASE_API_KEY: validateEnvVar(extra.firebaseApiKey, 'FIREBASE_API_KEY'),
  FIREBASE_AUTH_DOMAIN: validateEnvVar(extra.firebaseAuthDomain, 'FIREBASE_AUTH_DOMAIN'),
  FIREBASE_PROJECT_ID: validateEnvVar(extra.firebaseProjectId, 'FIREBASE_PROJECT_ID'),
  FIREBASE_STORAGE_BUCKET: validateEnvVar(extra.firebaseStorageBucket, 'FIREBASE_STORAGE_BUCKET'),
  FIREBASE_MESSAGING_SENDER_ID: validateEnvVar(extra.firebaseMessagingSenderId, 'FIREBASE_MESSAGING_SENDER_ID'),
  FIREBASE_APP_ID: validateEnvVar(extra.firebaseAppId, 'FIREBASE_APP_ID'),
  FIREBASE_MEASUREMENT_ID: extra.firebaseMeasurementId || '', // Optionnel

  // DeepL
  DEEPL_API_KEY: validateEnvVar(extra.deepLApiKey, 'DEEPL_API_KEY'),

  // Google Drive
  GOOGLE_DRIVE_CLIENT_ID: extra.googleDriveClientId || '',

  // Sentry
  SENTRY_DSN: extra.sentryDsn || '',
} as const;

// Vérification au démarrage (dev uniquement)
if (__DEV__) {
  const missingVars = Object.entries(ENV)
    .filter(([key, value]) => !value && !key.includes('MEASUREMENT') && !key.includes('GOOGLE'))
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.warn('[ENV] Variables manquantes:', missingVars.join(', '));
  }
}

export default ENV;
