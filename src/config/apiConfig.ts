// Configuración de la API para PadelTech
export const API_CONFIG = {
  // URLs base
  BASE_URL: __DEV__ 
    ? 'http://localhost:3000/api'  // Desarrollo local
    : 'https://api.padeltech.com/api', // Producción
  
  // Endpoints de autenticación
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  
  // Endpoints de usuario
  USER: {
    PROFILE: '/users/profile',
    STATS: '/users/stats',
    SETTINGS: '/users/settings',
  },
  
  // Endpoints de análisis
  ANALYSIS: {
    CREATE: '/analysis',
    LIST: '/analysis',
    GET: (id: string) => `/analysis/${id}`,
    UPDATE: (id: string) => `/analysis/${id}`,
    DELETE: (id: string) => `/analysis/${id}`,
    STATS_SUMMARY: '/analysis/stats/summary',
    STATS_PROGRESS: '/analysis/stats/progress',
  },
  
  // Endpoints de videos
  VIDEO: {
    UPLOAD: '/videos/upload',
    GET: (id: string) => `/videos/${id}`,
    DELETE: (id: string) => `/videos/${id}`,
    THUMBNAIL: (id: string) => `/videos/${id}/thumbnail`,
  },
  
  // Endpoints de estadísticas
  STATS: {
    OVERVIEW: '/stats/overview',
    PERFORMANCE: '/stats/performance',
    COMPARISON: '/stats/comparison',
    EXPORT: '/stats/export',
  },
  
  // Configuración de requests
  REQUEST_CONFIG: {
    TIMEOUT: 30000, // 30 segundos
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 segundo
  },
  
  // Headers por defecto
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Códigos de estado HTTP
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
  
  // Mensajes de error comunes
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
    TIMEOUT_ERROR: 'La solicitud tardó demasiado. Intenta de nuevo.',
    SERVER_ERROR: 'Error del servidor. Intenta más tarde.',
    UNAUTHORIZED: 'Sesión expirada. Inicia sesión nuevamente.',
    VALIDATION_ERROR: 'Datos inválidos. Verifica la información.',
  },
};

// Configuración para desarrollo
export const DEV_CONFIG = {
  // Simular delay para testing
  SIMULATE_DELAY: __DEV__ ? 1000 : 0,
  
  // Logs detallados en desarrollo
  LOG_REQUESTS: __DEV__,
  LOG_RESPONSES: __DEV__,
  
  // Mock data en desarrollo
  USE_MOCK_DATA: __DEV__ && false, // Cambiar a true para usar datos simulados
  
  // Backend local
  LOCAL_BACKEND: 'http://localhost:3000',
  
  // Verificar conexión al backend
  CHECK_BACKEND_HEALTH: __DEV__,
};

// Configuración de autenticación
export const AUTH_CONFIG = {
  // Duración del token (en segundos)
  TOKEN_EXPIRY: 7 * 24 * 60 * 60, // 7 días
  
  // Refresh automático del token
  AUTO_REFRESH: true,
  REFRESH_THRESHOLD: 5 * 60, // 5 minutos antes de expirar
  
  // Almacenamiento local
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'padeltech_access_token',
    REFRESH_TOKEN: 'padeltech_refresh_token',
    USER_DATA: 'padeltech_user_data',
    LAST_LOGIN: 'padeltech_last_login',
  },
};

// Configuración de cache
export const CACHE_CONFIG = {
  // Tiempo de vida del cache (en segundos)
  TTL: {
    USER_PROFILE: 5 * 60, // 5 minutos
    ANALYSIS_LIST: 2 * 60, // 2 minutos
    STATS: 10 * 60, // 10 minutos
    VIDEOS: 30 * 60, // 30 minutos
  },
  
  // Tamaño máximo del cache
  MAX_SIZE: {
    USER_PROFILE: 1,
    ANALYSIS_LIST: 100,
    STATS: 10,
    VIDEOS: 50,
  },
};

// Configuración de upload
export const UPLOAD_CONFIG = {
  // Tamaño máximo de archivo (en bytes)
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  
  // Formatos permitidos
  ALLOWED_FORMATS: {
    VIDEO: ['mp4', 'mov', 'avi', 'mkv'],
    IMAGE: ['jpg', 'jpeg', 'png', 'webp'],
  },
  
  // Calidad de compresión
  COMPRESSION: {
    VIDEO: {
      QUALITY: 0.8,
      MAX_WIDTH: 1920,
      MAX_HEIGHT: 1080,
    },
    IMAGE: {
      QUALITY: 0.9,
      MAX_WIDTH: 1920,
      MAX_HEIGHT: 1080,
    },
  },
  
  // Chunk size para uploads grandes
  CHUNK_SIZE: 1024 * 1024, // 1MB
};

// Configuración de analytics
export const ANALYTICS_CONFIG = {
  // Eventos a trackear
  EVENTS: {
    USER_REGISTER: 'user_register',
    USER_LOGIN: 'user_login',
    ANALYSIS_CREATED: 'analysis_created',
    VIDEO_UPLOADED: 'video_uploaded',
    SHOT_ANALYZED: 'shot_analyzed',
    PROFILE_UPDATED: 'profile_updated',
  },
  
  // Propiedades de usuario
  USER_PROPERTIES: [
    'level',
    'experience',
    'favorite_shot',
    'total_analyses',
    'average_score',
  ],
  
  // Propiedades de evento
  EVENT_PROPERTIES: [
    'shot_type',
    'overall_score',
    'analysis_duration',
    'video_size',
    'device_type',
  ],
};

export default API_CONFIG;
