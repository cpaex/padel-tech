// PadelTech Configuration Example
// Copy this file to config.js and fill in your values

export const config = {
  // API Configuration (for future ML model integration)
  api: {
    baseUrl: 'https://api.padeltech.com',
    apiKey: 'your_api_key_here',
    timeout: 30000,
  },

  // Camera Configuration
  camera: {
    maxRecordingDuration: 10,
    videoQuality: '720p',
    enableAudio: true,
  },

  // Analysis Configuration
  analysis: {
    timeout: 30000,
    enableRealTime: false,
    enable3D: false,
  },

  // Development Configuration
  development: {
    enableLogging: true,
    enableDebugMode: false,
    enableMockData: true, // Set to false in production
  },

  // Feature Flags
  features: {
    enableSharing: true,
    enableOfflineMode: false,
    enableProgressTracking: true,
  },

  // UI Configuration
  ui: {
    theme: 'default',
    language: 'es',
    enableAnimations: true,
  },
};

export default config;
