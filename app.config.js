import 'dotenv/config';

export default {
  expo: {
    name: "Fakt",
    slug: "fakt",
    scheme: "fakt",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#003580"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.tomburger.faktapp",
      buildNumber: "4",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#003580"
      },
      package: "com.tomburger.fakt",
      versionCode: 2,
      edgeToEdgeEnabled: true,
      permissions: [
        // Android 13+ : nouvelles permissions granulaires pour les médias
        "android.permission.READ_MEDIA_IMAGES",
        // Android <13 : anciennes permissions (fallback automatique)
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "d3bf7ece-0e2a-48e9-894f-0f822c75a89f"
      },
      // Firebase Configuration
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
      // DeepL API
      deepLApiKey: process.env.DEEPL_API_KEY,
      // Google Drive
      googleDriveClientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
      // Sentry
      sentryDsn: process.env.SENTRY_DSN,
    },
    owner: "tommyburger4"
  }
};
