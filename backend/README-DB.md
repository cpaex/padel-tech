# 🗄️ PadelTech Backend - Base de Datos Real

Backend completo para PadelTech con MongoDB, autenticación JWT, y API RESTful para análisis de técnica de pádel.

## 🚀 Características

### **Base de Datos**
- ✅ **MongoDB** con Mongoose ODM
- ✅ **Modelos completos** para Usuarios y Análisis
- ✅ **Relaciones** entre entidades
- ✅ **Validaciones** de esquema
- ✅ **Índices** para optimización

### **Autenticación y Seguridad**
- ✅ **JWT** (JSON Web Tokens)
- ✅ **Bcrypt** para hash de contraseñas
- ✅ **Middleware de autenticación**
- ✅ **Rate limiting** y protección DDoS
- ✅ **Helmet** para headers de seguridad
- ✅ **CORS** configurado

### **API Endpoints**
- ✅ **Autenticación**: registro, login, refresh, logout
- ✅ **Usuarios**: perfil, estadísticas, configuraciones
- ✅ **Análisis**: crear, listar, obtener, actualizar, eliminar
- ✅ **Videos**: upload, gestión, thumbnails
- ✅ **Estadísticas**: rendimiento, comparaciones, exportación

### **Funcionalidades Avanzadas**
- ✅ **Upload de videos** con Multer
- ✅ **Generación de thumbnails** con Sharp
- ✅ **Agregaciones MongoDB** para estadísticas
- ✅ **Exportación de datos** (JSON/CSV)
- ✅ **Sistema de logs** estructurado
- ✅ **Compresión** de respuestas

## 🛠️ Instalación

### **Prerrequisitos**
- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB >= 5.0

### **1. Instalar MongoDB**
```bash
# macOS con Homebrew
brew install mongodb-community
brew services start mongodb-community

# Ubuntu/Debian
sudo apt update
sudo apt install mongodb
sudo systemctl start mongodb

# Windows
# Descargar e instalar desde https://www.mongodb.com/try/download/community
```

### **2. Clonar y configurar**
```bash
cd backend
npm install
```

### **3. Configurar variables de entorno**
```bash
# El script start-db.sh crea automáticamente un .env básico
# O crear manualmente:
cp .env.example .env
```

**Variables de entorno principales:**
```env
MONGODB_URI=mongodb://localhost:27017/padeltech
JWT_SECRET=tu_secret_key_super_segura
PORT=3000
NODE_ENV=development
```

## 🚀 Uso

### **Inicio Rápido**
```bash
# Iniciar con base de datos real
./start-db.sh

# O manualmente
npm run dev:db
```

### **Scripts Disponibles**
```bash
npm start          # Producción
npm run dev        # Desarrollo con nodemon
npm run dev:db     # Desarrollo con base de datos real
npm run dev:simple # Desarrollo con datos en memoria
npm run seed       # Poblar base de datos con datos de prueba
npm test           # Ejecutar tests
npm run lint       # Linting del código
```

## 📊 Estructura de la Base de Datos

### **Colección: Users**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (único),
  password: String (hasheada),
  profile: {
    level: String,        // beginner, intermediate, advanced, expert
    favoriteShot: String, // derecha, reves, volea, saque, bandeja, vibora, remate
    experience: Number,   // años de experiencia
    bio: String
  },
  stats: {
    totalAnalyses: Number,
    averageScore: Number,
    bestScore: Number,
    totalTime: Number,
    favoriteShot: String
  },
  settings: {
    notifications: { email: Boolean, push: Boolean, weeklyReport: Boolean },
    privacy: { publicProfile: Boolean, shareAnalytics: Boolean },
    language: String,
    timezone: String
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### **Colección: Analyses**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  shotType: String,
  videoPath: String,
  duration: Number,
  results: {
    overallScore: Number,
    posture: { score: Number, feedback: String },
    timing: { score: Number, feedback: String },
    followThrough: { score: Number, feedback: String },
    power: { score: Number, feedback: String }
  },
  improvements: [String],
  metadata: {
    device: String,
    location: String,
    weather: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 🔌 API Endpoints

### **Autenticación**
```
POST   /api/auth/register     # Registro de usuario
POST   /api/auth/login        # Login
POST   /api/auth/refresh      # Refresh token
POST   /api/auth/logout       # Logout
POST   /api/auth/forgot-password # Recuperar contraseña
POST   /api/auth/reset-password  # Resetear contraseña
```

### **Usuarios**
```
GET    /api/users/profile     # Obtener perfil
PUT    /api/users/profile     # Actualizar perfil
GET    /api/users/stats       # Estadísticas del usuario
PUT    /api/users/settings    # Actualizar configuraciones
DELETE /api/users/account     # Eliminar cuenta
GET    /api/users/leaderboard # Tabla de líderes
```

### **Análisis**
```
POST   /api/analysis         # Crear análisis
GET    /api/analysis         # Listar análisis del usuario
GET    /api/analysis/:id     # Obtener análisis específico
PUT    /api/analysis/:id     # Actualizar análisis
DELETE /api/analysis/:id     # Eliminar análisis
GET    /api/analysis/summary # Resumen de análisis
GET    /api/analysis/progress # Progreso del usuario
```

### **Videos**
```
POST   /api/videos/upload    # Subir video
GET    /api/videos/:id       # Obtener video
DELETE /api/videos/:id       # Eliminar video
POST   /api/videos/:id/thumbnail # Generar thumbnail
GET    /api/videos/user/:userId # Videos de un usuario
```

### **Estadísticas**
```
GET    /api/stats/overview   # Vista general
GET    /api/stats/performance # Rendimiento detallado
GET    /api/stats/comparison # Comparaciones
GET    /api/stats/export     # Exportar datos
```

## 🧪 Testing

### **Ejecutar Tests**
```bash
npm test
```

### **Tests Disponibles**
- ✅ **Modelos**: validación de esquemas
- ✅ **Rutas**: endpoints de la API
- ✅ **Middleware**: autenticación y validación
- ✅ **Integración**: flujos completos

## 📈 Monitoreo y Logs

### **Health Check**
```
GET /health
```

### **Logs**
- **Nivel**: info, warn, error
- **Formato**: JSON estructurado
- **Archivo**: `./logs/app.log`
- **Rotación**: automática

### **Métricas**
- **Rate limiting**: requests por IP
- **Performance**: tiempo de respuesta
- **Errores**: conteo y tipos
- **Uso de base de datos**: queries y tiempo

## 🔒 Seguridad

### **Protecciones Implementadas**
- ✅ **Rate limiting**: 100 requests/15min por IP
- ✅ **Slow down**: delay progresivo para requests repetidos
- ✅ **Helmet**: headers de seguridad
- ✅ **CORS**: configuración restrictiva
- ✅ **Validación**: entrada de datos
- ✅ **Sanitización**: prevención de inyección

### **Autenticación**
- ✅ **JWT**: tokens seguros
- ✅ **Refresh tokens**: renovación automática
- ✅ **Password hashing**: bcrypt con salt
- ✅ **Session management**: control de sesiones

## 🚀 Despliegue

### **Producción**
```bash
# Configurar variables de entorno
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/padeltech
JWT_SECRET=secret_super_seguro_produccion

# Iniciar
npm start
```

### **Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### **Variables de Entorno de Producción**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/padeltech
JWT_SECRET=secret_super_seguro_produccion
JWT_EXPIRES_IN=1d
ALLOWED_ORIGINS=https://tudominio.com
RATE_LIMIT_MAX_REQUESTS=200
MAX_FILE_SIZE=10485760
```

## 📚 Recursos Adicionales

### **Documentación**
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [JWT.io](https://jwt.io/)

### **Herramientas de Desarrollo**
- **MongoDB Compass**: GUI para MongoDB
- **Postman**: Testing de API
- **Insomnia**: Cliente REST alternativo

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](../LICENSE) para detalles.

## 🆘 Soporte

- **Issues**: [GitHub Issues](https://github.com/tu-usuario/padel-tech/issues)
- **Documentación**: [Wiki del proyecto](https://github.com/tu-usuario/padel-tech/wiki)
- **Email**: soporte@padeltech.com

---

**¡Desarrollado con ❤️ por el equipo PadelTech!** 🏓✨
