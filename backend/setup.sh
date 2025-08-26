#!/bin/bash

# 🚀 Script de Configuración para PadelTech Backend
# Este script configura automáticamente el entorno de desarrollo

set -e

echo "🎾 Configurando PadelTech Backend..."
echo "======================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con color
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Asegúrate de estar en el directorio backend/"
    exit 1
fi

# Verificar Node.js
print_status "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Por favor instálalo desde https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$NODE_MAJOR" -lt 16 ]; then
    print_error "Node.js versión 16 o superior es requerida. Versión actual: $NODE_VERSION"
    exit 1
fi

print_success "Node.js $NODE_VERSION detectado"

# Verificar npm
print_status "Verificando npm..."
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi

NPM_VERSION=$(npm --version)
print_success "npm $NPM_VERSION detectado"

# Verificar MongoDB
print_status "Verificando MongoDB..."
if ! command -v mongod &> /dev/null; then
    print_warning "MongoDB no está instalado. Por favor instálalo:"
    echo "  - macOS: brew install mongodb-community"
    echo "  - Ubuntu: sudo apt-get install mongodb"
    echo "  - Windows: https://docs.mongodb.com/manual/installation/"
    echo ""
    print_warning "O usa MongoDB Atlas (cloud): https://www.mongodb.com/atlas"
else
    MONGODB_VERSION=$(mongod --version | head -n1 | cut -d' ' -f3)
    print_success "MongoDB $MONGODB_VERSION detectado"
fi

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    print_status "Creando archivo .env..."
    cat > .env << EOF
# Configuración del Servidor
NODE_ENV=development
PORT=3000

# Base de Datos
MONGODB_URI=mongodb://localhost:27017/padeltech

# JWT
JWT_SECRET=padeltech_dev_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Archivos y Media
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_VIDEO_FORMATS=mp4,mov,avi,mkv
ALLOWED_IMAGE_FORMATS=jpg,jpeg,png,webp

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# Seguridad
BCRYPT_ROUNDS=12
SESSION_SECRET=padeltech_dev_session_secret

# Monitoreo
ENABLE_METRICS=true
METRICS_PORT=9090

# Testing
TEST_MONGODB_URI=mongodb://localhost:27017/padeltech_test
JEST_TIMEOUT=30000
EOF
    print_success "Archivo .env creado"
else
    print_warning "Archivo .env ya existe. Verifica que las configuraciones sean correctas."
fi

# Crear directorios necesarios
print_status "Creando directorios necesarios..."
mkdir -p uploads
mkdir -p logs
mkdir -p temp
print_success "Directorios creados"

# Instalar dependencias
print_status "Instalando dependencias..."
npm install

if [ $? -eq 0 ]; then
    print_success "Dependencias instaladas correctamente"
else
    print_error "Error instalando dependencias"
    exit 1
fi

# Verificar si MongoDB está corriendo
print_status "Verificando conexión a MongoDB..."
if command -v mongod &> /dev/null; then
    if pgrep -x "mongod" > /dev/null; then
        print_success "MongoDB está corriendo"
    else
        print_warning "MongoDB no está corriendo. Iniciando..."
        mongod --fork --logpath /dev/null --dbpath /tmp/mongodb
        sleep 2
        if pgrep -x "mongod" > /dev/null; then
            print_success "MongoDB iniciado correctamente"
        else
            print_warning "No se pudo iniciar MongoDB. Asegúrate de que esté configurado correctamente."
        fi
    fi
else
    print_warning "MongoDB no está instalado localmente. Considera usar MongoDB Atlas."
fi

# Crear script de inicio
print_status "Creando script de inicio..."
cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando PadelTech Backend en modo desarrollo..."
echo "📱 API disponible en: http://localhost:3000"
echo "📊 Health Check: http://localhost:3000/health"
echo "📚 Documentación: http://localhost:3000/api"
echo ""
echo "Presiona Ctrl+C para detener"
echo "======================================"

npm run dev
EOF

chmod +x start-dev.sh
print_success "Script de inicio creado (start-dev.sh)"

# Crear script de producción
print_status "Creando script de producción..."
cat > start-prod.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando PadelTech Backend en modo producción..."
echo "📱 API disponible en: http://localhost:3000"
echo "📊 Health Check: http://localhost:3000/health"
echo "======================================"

npm start
EOF

chmod +x start-prod.sh
print_success "Script de producción creado (start-prod.sh)"

# Crear script de testing
print_status "Creando script de testing..."
cat > test-all.sh << 'EOF'
#!/bin/bash
echo "🧪 Ejecutando tests de PadelTech Backend..."
echo "======================================"

# Tests unitarios
echo "📊 Ejecutando tests unitarios..."
npm test

# Tests con coverage
echo "📈 Ejecutando tests con coverage..."
npm run test:coverage

echo "✅ Todos los tests completados"
EOF

chmod +x test-all.sh
print_success "Script de testing creado (test-all.sh)"

# Verificar que todo esté configurado
print_status "Verificando configuración..."
if [ -f ".env" ] && [ -d "node_modules" ]; then
    print_success "✅ Configuración completada exitosamente!"
else
    print_error "❌ Error en la configuración"
    exit 1
fi

echo ""
echo "🎉 ¡PadelTech Backend está listo!"
echo "======================================"
echo ""
echo "📋 Próximos pasos:"
echo "1. Edita el archivo .env con tus configuraciones"
echo "2. Asegúrate de que MongoDB esté corriendo"
echo "3. Ejecuta: ./start-dev.sh"
echo ""
echo "🔗 URLs importantes:"
echo "   - API: http://localhost:3000/api"
echo "   - Health: http://localhost:3000/health"
echo "   - Documentación: http://localhost:3000/api"
echo ""
echo "📚 Comandos útiles:"
echo "   - Desarrollo: ./start-dev.sh"
echo "   - Producción: ./start-prod.sh"
echo "   - Testing: ./test-all.sh"
echo "   - Instalar dependencias: npm install"
echo "   - Linting: npm run lint"
echo ""
echo "🚀 ¡Disfruta desarrollando con PadelTech!"
