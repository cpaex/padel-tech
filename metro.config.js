const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuración para manejar mejor los límites de archivos
config.watchFolders = [];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Reducir el número de archivos monitoreados
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.alias = {};

// Configuración de cache
config.cacheStores = [];

module.exports = config;
