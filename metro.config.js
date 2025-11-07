const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Solution robuste pour les erreurs expo-modules-core
config.resolver = {
  ...config.resolver,

  // Exclure les fichiers Electron du bundle
  blockList: [
    /electron\.js$/,
    /preload\.js$/
  ],

  // Résolution personnalisée pour gérer les imports manquants
  resolveRequest: (context, moduleName, platform) => {
    // Si c'est un module problématique d'expo-modules-core
    if (moduleName === './web' || 
        moduleName === './uuid' || 
        moduleName === './sweet/setUpErrorManager.fx' ||
        moduleName.includes('expo-modules-core') && 
        (moduleName.includes('/web') || moduleName.includes('/uuid') || moduleName.includes('.fx'))) {
      
      // Rediriger vers notre module vide
      return {
        filePath: path.join(__dirname, 'src/utils/empty-module.js'),
        type: 'sourceFile',
      };
    }
    
    // Utiliser la résolution par défaut pour les autres modules
    return context.resolveRequest(context, moduleName, platform);
  }
};

// Nettoyer le cache
config.resetCache = true;

module.exports = config;