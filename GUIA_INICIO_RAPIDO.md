# 🚀 **Guía de Inicio Rápido - PadelTech**

## 📋 **Resumen Ejecutivo**

Esta guía te permitirá ejecutar **PadelTech** completamente en tu máquina local en menos de 5 minutos, incluyendo:
- ✅ **Backend API** (puerto 3000)
- ✅ **Aplicación Móvil** (puerto 19006)
- ✅ **Base de datos simulada** (datos en memoria)

## 🎯 **Opción 1: Inicio Automático (Recomendado)**

### **Paso 1: Ejecutar Script de Inicio**
```bash
# Desde el directorio raíz de PadelTech
./start-all.sh
```

### **Paso 2: Esperar a que Todo Esté Listo**
El script automáticamente:
- ✅ Verifica dependencias
- ✅ Inicia el backend
- ✅ Inicia la aplicación móvil
- ✅ Verifica que ambos servicios estén funcionando

### **Paso 3: Acceder a la Aplicación**
- **Backend API**: http://localhost:3000
- **App Web**: http://localhost:19006
- **Health Check**: http://localhost:3000/health

---

## 🔧 **Opción 2: Inicio Manual**

### **Paso 1: Iniciar Backend**
```bash
# Terminal 1 - Backend
cd backend
./start-dev-simple.sh
```

### **Paso 2: Iniciar Aplicación Móvil**
```bash
# Terminal 2 - App Móvil
npx expo start --web
```

---

## 📱 **Cómo Probar la Aplicación**

### **🌐 En Navegador Web**
1. Abre http://localhost:19006
2. La aplicación se cargará automáticamente
3. Puedes usar todas las funcionalidades

### **📱 En Dispositivo Móvil**
1. Instala **Expo Go** desde App Store/Google Play
2. Escanea el código QR que aparece en la terminal
3. La app se abrirá en tu dispositivo

### **💻 En Simulador**
1. Presiona `i` para abrir iOS Simulator
2. Presiona `a` para abrir Android Emulator
3. Presiona `w` para abrir en navegador web

---

## 🔐 **Autenticación de Desarrollo**

### **Credenciales de Prueba**
- **Email**: Cualquier email válido (ej: `test@example.com`)
- **Contraseña**: `123456` (fija para desarrollo)

### **Ejemplo de Uso**
```json
{
  "email": "jugador@padel.com",
  "password": "123456"
}
```

---

## 📊 **Endpoints de la API Disponibles**

### **🔐 Autenticación**
```
POST /api/auth/register    # Registrar usuario
POST /api/auth/login       # Login de usuario
GET  /api/auth/me          # Obtener usuario actual
```

### **📊 Análisis**
```
POST /api/analysis         # Crear análisis
GET  /api/analysis         # Listar análisis
GET  /api/analysis/:id     # Obtener análisis específico
```

### **👥 Usuario**
```
GET  /api/users/profile    # Obtener perfil
```

---

## 🛠️ **Solución de Problemas**

### **❌ Puerto 3000 Ocupado**
```bash
# Verificar qué está usando el puerto
lsof -i :3000

# Detener el proceso
kill -9 <PID>
```

### **❌ Puerto 19006 Ocupado**
```bash
# Verificar qué está usando el puerto
lsof -i :19006

# Detener el proceso
kill -9 <PID>
```

### **❌ Dependencias No Instaladas**
```bash
# Instalar dependencias del backend
cd backend && npm install

# Instalar dependencias de la app
npm install
```

### **❌ Error de Permisos**
```bash
# Dar permisos de ejecución
chmod +x start-all.sh
chmod +x backend/start-dev-simple.sh
```

---

## 🔄 **Reiniciar Servicios**

### **Reinicio Completo**
```bash
# Detener todos los servicios (Ctrl+C)
# Luego ejecutar nuevamente
./start-all.sh
```

### **Reinicio del Backend**
```bash
cd backend
./start-dev-simple.sh
```

### **Reinicio de la App**
```bash
npx expo start --web
```

---

## 📁 **Estructura de Archivos**

```
padel-tech/
├── start-all.sh              # Script de inicio completo
├── package.json              # Dependencias de la app
├── src/                      # Código fuente de la app
├── backend/                  # Backend API
│   ├── start-dev-simple.sh   # Script de inicio del backend
│   ├── src/                  # Código fuente del backend
│   └── package.json          # Dependencias del backend
└── GUIA_INICIO_RAPIDO.md     # Esta guía
```

---

## 🎯 **Funcionalidades Disponibles**

### **🏠 Pantalla Principal**
- ✅ Selección de tipos de golpe
- ✅ Navegación al perfil
- ✅ Diseño moderno con gradientes

### **📹 Grabación de Video**
- ✅ Simulación de cámara (web)
- ✅ Grabación real (dispositivos móviles)
- ✅ Redirección automática a resultados

### **📊 Resultados**
- ✅ Puntuación general de técnica
- ✅ Desglose por aspectos técnicos
- ✅ Mejoras sugeridas
- ✅ Almacenamiento local

### **👤 Perfil de Usuario**
- ✅ Creación de perfil
- ✅ Estadísticas de progreso
- ✅ Configuraciones
- ✅ Exportar/importar datos

---

## 🚀 **Próximos Pasos**

### **1. Probar Funcionalidades Básicas**
- [ ] Registrar un usuario
- [ ] Grabar un golpe (simulado)
- [ ] Ver resultados del análisis
- [ ] Explorar el perfil

### **2. Personalizar la Aplicación**
- [ ] Modificar colores y estilos
- [ ] Agregar nuevos tipos de golpe
- [ ] Personalizar mensajes de mejora

### **3. Conectar con Backend Real**
- [ ] Instalar MongoDB
- [ ] Usar el backend completo
- [ ] Implementar persistencia real

---

## 📞 **Soporte**

### **Problemas Comunes**
- **App no carga**: Verifica que Expo esté corriendo en puerto 19006
- **API no responde**: Verifica que el backend esté corriendo en puerto 3000
- **Error de permisos**: Ejecuta `chmod +x` en los scripts

### **Logs de Debug**
- **Backend**: Los logs aparecen en la terminal del backend
- **App**: Los logs aparecen en la terminal de Expo
- **Errores**: Revisa la consola del navegador (F12)

---

## 🎉 **¡Listo para Desarrollar!**

Con esta configuración tienes:
- ✅ **Entorno completo** funcionando localmente
- ✅ **Backend API** con endpoints funcionales
- ✅ **Aplicación móvil** con todas las funcionalidades
- ✅ **Base de datos simulada** para desarrollo rápido
- ✅ **Scripts automatizados** para inicio y gestión

**¡Disfruta desarrollando con PadelTech! 🎾✨**
