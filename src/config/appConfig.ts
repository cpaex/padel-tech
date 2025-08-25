// PadelTech App Configuration
// Configuración real de la aplicación

export const appConfig = {
  // App Information
  app: {
    name: 'PadelTech',
    version: '1.0.0',
    buildNumber: '1',
    bundleId: 'com.padeltech.app',
  },

  // API Configuration
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.padeltech.com',
    apiKey: process.env.EXPO_PUBLIC_API_KEY || 'demo_key',
    timeout: 30000,
    retryAttempts: 3,
  },

  // Camera Configuration
  camera: {
    maxRecordingDuration: 10, // seconds
    videoQuality: '720p' as const,
    enableAudio: true,
    enableStabilization: true,
    focusMode: 'auto' as const,
  },

  // Analysis Configuration
  analysis: {
    timeout: 30000,
    enableRealTime: false,
    enable3D: false,
    confidenceThreshold: 0.7,
    maxRetries: 3,
  },

  // Storage Configuration
  storage: {
    maxVideoSize: 100 * 1024 * 1024, // 100MB
    enableCompression: true,
    compressionQuality: 0.8,
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
  },

  // UI Configuration
  ui: {
    theme: 'default' as const,
    language: 'es' as const,
    enableAnimations: true,
    enableHapticFeedback: true,
    enableSoundEffects: true,
  },

  // Feature Flags
  features: {
    enableSharing: true,
    enableOfflineMode: true,
    enableProgressTracking: true,
    enableNotifications: true,
    enableDataExport: true,
    enableSocialFeatures: false,
  },

  // Development Configuration
  development: {
    enableLogging: __DEV__,
    enableDebugMode: __DEV__,
    enableMockData: __DEV__,
    enablePerformanceMonitoring: __DEV__,
    enableErrorReporting: true,
  },

  // Analytics Configuration
  analytics: {
    enableTracking: true,
    enableCrashReporting: true,
    enablePerformanceMonitoring: true,
    enableUserBehaviorTracking: false,
  },

  // Security Configuration
  security: {
    enableBiometricAuth: false,
    enableEncryption: true,
    enableSecureStorage: true,
    enableCertificatePinning: false,
  },

  // Performance Configuration
  performance: {
    enableImageOptimization: true,
    enableLazyLoading: true,
    enableCaching: true,
    maxCacheSize: 50 * 1024 * 1024, // 50MB
  },
};

// Environment-specific configurations
export const getEnvironmentConfig = () => {
  if (__DEV__) {
    return {
      ...appConfig,
      api: {
        ...appConfig.api,
        baseUrl: 'http://localhost:3000',
        timeout: 60000,
      },
      development: {
        ...appConfig.development,
        enableMockData: true,
        enableDebugMode: true,
      },
    };
  }

  if (process.env.EXPO_PUBLIC_ENV === 'staging') {
    return {
      ...appConfig,
      api: {
        ...appConfig.api,
        baseUrl: 'https://staging-api.padeltech.com',
      },
    };
  }

  return appConfig;
};

// Default configuration
export default appConfig;
