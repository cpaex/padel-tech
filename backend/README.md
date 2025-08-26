# 🚀 PadelTech Backend API

Backend completo para la aplicación PadelTech, proporcionando una API REST robusta para el análisis de técnica de pádel.

## 📋 **Características Principales**

### 🔐 **Autenticación y Seguridad**
- **JWT Tokens** con expiración configurable
- **Bcrypt** para hashing seguro de contraseñas
- **Rate Limiting** por IP y usuario
- **CORS** configurado para múltiples orígenes
- **Helmet** para headers de seguridad
- **Validación** de datos con express-validator

### 👥 **Gestión de Usuarios**
- Registro y login de usuarios
- Perfiles personalizables con niveles de experiencia
- Estadísticas automáticas de progreso
- Configuraciones personalizables
- Recuperación de contraseñas

### 📊 **Análisis de Golpes**
- Almacenamiento de resultados de análisis
- Historial completo de sesiones
- Estadísticas detalladas por tipo de golpe
- Seguimiento de progreso temporal
- Comparación con análisis anteriores

### 🎥 **Gestión de Videos**
- Almacenamiento seguro de videos
- Generación de thumbnails
- Compresión y optimización
- Integración con servicios de almacenamiento en la nube

### 📈 **Analíticas y Reportes**
- Estadísticas en tiempo real
- Progreso por períodos (semana, mes, trimestre, año)
- Distribución por tipos de golpe
- Tendencias de mejora

## 🏗️ **Arquitectura**

```
src/
├── models/          # Modelos de MongoDB
├── routes/          # Rutas de la API
├── middleware/      # Middleware personalizado
├── services/        # Lógica de negocio
├── utils/           # Utilidades y helpers
├── config/          # Configuración
└── server.js        # Punto de entrada
```

## 🚀 **Instalación y Configuración**

### **Prerrequisitos**
- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm >= 8.0.0

### **1. Clonar y Instalar Dependencias**
```bash
cd backend
npm install
```

### **2. Configurar Variables de Entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

### **3. Configurar Base de Datos**
```bash
# Asegúrate de que MongoDB esté corriendo
mongod
```

### **4. Ejecutar el Servidor**
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📚 **Endpoints de la API**

### **🔐 Autenticación**
```
POST   /api/auth/register          # Registrar usuario
POST   /api/auth/login             # Login de usuario
POST   /api/auth/refresh           # Refrescar token
POST   /api/auth/logout            # Logout
POST   /api/auth/forgot-password   # Solicitar reset
POST   /api/auth/reset-password    # Resetear contraseña
GET    /api/auth/me                # Obtener usuario actual
```

### **👥 Usuarios**
```
GET    /api/users/profile          # Obtener perfil
PUT    /api/users/profile          # Actualizar perfil
GET    /api/users/stats            # Estadísticas del usuario
PUT    /api/users/settings         # Actualizar configuraciones
DELETE /api/users/account          # Eliminar cuenta
```

### **📊 Análisis**
```
POST   /api/analysis               # Crear análisis
GET    /api/analysis               # Listar análisis
GET    /api/analysis/:id           # Obtener análisis específico
PUT    /api/analysis/:id           # Actualizar análisis
DELETE /api/analysis/:id           # Eliminar análisis
GET    /api/analysis/stats/summary # Resumen de estadísticas
GET    /api/analysis/stats/progress # Progreso del usuario
```

### **🎥 Videos**
```
POST   /api/videos/upload          # Subir video
GET    /api/videos/:id             # Obtener video
DELETE /api/videos/:id             # Eliminar video
POST   /api/videos/:id/thumbnail   # Generar thumbnail
```

### **📈 Estadísticas**
```
GET    /api/stats/overview         # Vista general
GET    /api/stats/performance      # Rendimiento
GET    /api/stats/comparison       # Comparaciones
GET    /api/stats/export           # Exportar datos
```

## 🔧 **Configuración de Producción**

### **Variables de Entorno Críticas**
```bash
NODE_ENV=production
JWT_SECRET=secret_super_seguro_y_largo
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/padeltech
ALLOWED_ORIGINS=https://tuapp.com,https://www.tuapp.com
```

### **Optimizaciones Recomendadas**
- **PM2** para gestión de procesos
- **Nginx** como reverse proxy
- **Redis** para cache y sesiones
- **MongoDB Atlas** para base de datos en la nube
- **AWS S3** para almacenamiento de videos

## 🧪 **Testing**

### **Ejecutar Tests**
```bash
# Tests unitarios
npm test

# Tests con coverage
npm run test:coverage

# Tests de integración
npm run test:integration
```

### **Tests Disponibles**
- ✅ Modelos de datos
- ✅ Rutas de la API
- ✅ Middleware de autenticación
- ✅ Validaciones
- ✅ Servicios de negocio

## 📊 **Monitoreo y Logs**

### **Logs Estructurados**
- **Morgan** para logs HTTP
- **Winston** para logs de aplicación
- **Rotación** automática de archivos
- **Niveles** de log configurables

### **Métricas**
- **Response times**
- **Error rates**
- **Database performance**
- **Memory usage**

## 🔒 **Seguridad**

### **Medidas Implementadas**
- ✅ **JWT** con expiración
- ✅ **Rate limiting** por IP y usuario
- ✅ **CORS** configurado
- ✅ **Helmet** para headers de seguridad
- ✅ **Validación** de entrada
- ✅ **Sanitización** de datos
- ✅ **Bcrypt** para contraseñas

### **Recomendaciones Adicionales**
- **HTTPS** en producción
- **API Keys** para endpoints sensibles
- **Audit logs** para acciones críticas
- **Backup** automático de base de datos

## 🚀 **Deployment**

### **Docker (Recomendado)**
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### **Heroku**
```bash
heroku create padeltech-api
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=tu_uri_mongodb
git push heroku main
```

### **AWS EC2**
```bash
# Instalar Node.js y MongoDB
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Configurar PM2
npm install -g pm2
pm2 start server.js
pm2 startup
```

## 📈 **Escalabilidad**

### **Estrategias Implementadas**
- **Índices** optimizados en MongoDB
- **Paginación** en endpoints de listado
- **Cache** para consultas frecuentes
- **Rate limiting** por usuario

### **Futuras Mejoras**
- **Microservicios** para funcionalidades específicas
- **Load balancing** con múltiples instancias
- **Database sharding** para grandes volúmenes
- **CDN** para archivos estáticos

## 🤝 **Contribución**

### **Estándares de Código**
- **ESLint** para linting
- **Prettier** para formateo
- **Conventional Commits** para mensajes
- **Code review** obligatorio

### **Proceso de Desarrollo**
1. Fork del repositorio
2. Crear feature branch
3. Implementar cambios
4. Ejecutar tests
5. Crear Pull Request

## 📞 **Soporte**

### **Contacto**
- **Email**: soporte@padeltech.com
- **Documentación**: https://docs.padeltech.com
- **Issues**: GitHub Issues

### **Recursos Adicionales**
- **API Docs**: https://api.padeltech.com/docs
- **Postman Collection**: [Descargar](https://api.padeltech.com/postman)
- **Swagger UI**: https://api.padeltech.com/swagger

---

**PadelTech Backend** - Construido con ❤️ para la comunidad de pádel 🎾
