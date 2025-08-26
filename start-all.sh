#!/bin/bash

# 🚀 Script de Inicio Completo para PadelTech
# Ejecuta tanto el backend como la aplicación móvil

set -e

echo "🎾 Iniciando PadelTech - Aplicación Completa"
echo "=============================================="

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

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Asegúrate de estar en el directorio raíz de PadelTech"
    exit 1
fi

# Función para verificar si un puerto está en uso
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Función para esperar a que un servicio esté disponible
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Esperando a que $service_name esté disponible..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            print_success "$service_name está disponible!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name no está disponible después de $max_attempts intentos"
    return 1
}

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    print_warning "Deteniendo servicios..."
    
    # Detener backend si está corriendo
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        print_status "Backend detenido"
    fi
    
    # Detener Expo si está corriendo
    if [ ! -z "$EXPO_PID" ]; then
        kill $EXPO_PID 2>/dev/null || true
        print_status "Expo detenido"
    fi
    
    print_success "Limpieza completada"
    exit 0
}

# Configurar trap para limpiar al salir
trap cleanup SIGINT SIGTERM

# Verificar dependencias
print_status "Verificando dependencias..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    exit 1
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi

# Verificar Expo CLI
if ! command -v expo &> /dev/null; then
    print_warning "Expo CLI no está instalado. Instalando..."
    npm install -g @expo/cli
fi

print_success "Dependencias verificadas"

# Verificar si el backend está corriendo
if check_port 3000; then
    print_warning "Puerto 3000 ya está en uso. Verificando si es el backend..."
    
    if curl -s "http://localhost:3000/health" > /dev/null 2>&1; then
        print_success "Backend ya está corriendo en puerto 3000"
        BACKEND_RUNNING=true
    else
        print_error "Puerto 3000 está ocupado por otro servicio"
        exit 1
    fi
else
    BACKEND_RUNNING=false
fi

# Iniciar backend si no está corriendo
if [ "$BACKEND_RUNNING" = false ]; then
    print_status "Iniciando backend..."
    
    cd backend
    
    # Verificar si las dependencias están instaladas
    if [ ! -d "node_modules" ]; then
        print_status "Instalando dependencias del backend..."
        npm install
    fi
    
    # Iniciar backend en modo desarrollo simple
    print_status "Iniciando servidor de desarrollo..."
    ./start-dev-simple.sh &
    BACKEND_PID=$!
    
    cd ..
    
    # Esperar a que el backend esté disponible
    if wait_for_service "http://localhost:3000/health" "Backend"; then
        print_success "Backend iniciado correctamente en puerto 3000"
    else
        print_error "No se pudo iniciar el backend"
        cleanup
        exit 1
    fi
else
    print_success "Backend ya está corriendo"
fi

# Verificar si Expo está corriendo
if check_port 19006; then
    print_warning "Puerto 19006 ya está en uso. Verificando si es Expo..."
    if curl -s "http://localhost:19006" > /dev/null 2>&1; then
        print_success "Expo ya está corriendo en puerto 19006"
        EXPO_RUNNING=true
    else
        print_error "Puerto 19006 está ocupado por otro servicio"
        exit 1
    fi
else
    EXPO_RUNNING=false
fi

# Iniciar Expo si no está corriendo
if [ "$EXPO_RUNNING" = false ]; then
    print_status "Iniciando aplicación móvil con Expo..."
    
    # Verificar si las dependencias están instaladas
    if [ ! -d "node_modules" ]; then
        print_status "Instalando dependencias de la aplicación..."
        npm install
    fi
    
    # Iniciar Expo
    print_status "Iniciando Expo..."
    npx expo start --web &
    EXPO_PID=$!
    
    # Esperar a que Expo esté disponible
    if wait_for_service "http://localhost:19006" "Expo"; then
        print_success "Expo iniciado correctamente en puerto 19006"
    else
        print_error "No se pudo iniciar Expo"
        cleanup
        exit 1
    fi
else
    print_success "Expo ya está corriendo"
fi

# Mostrar información de servicios
echo ""
echo "🎉 ¡PadelTech está completamente iniciado!"
echo "=============================================="
echo ""
echo "🔗 URLs de los servicios:"
echo "   📱 Backend API: http://localhost:3000"
echo "   📊 Health Check: http://localhost:3000/health"
echo "   📚 API Info: http://localhost:3000/api"
echo "   📱 App Web: http://localhost:19006"
echo ""
echo "💡 Información de desarrollo:"
echo "   - Backend: Modo desarrollo (datos en memoria)"
echo "   - Autenticación: Usa cualquier email + contraseña '123456'"
echo "   - Los datos se almacenan en memoria (se pierden al reiniciar)"
echo ""
echo "📱 Para probar en dispositivo móvil:"
echo "   1. Instala la app Expo Go en tu dispositivo"
echo "   2. Escanea el código QR que aparece en la terminal"
echo "   3. O usa la URL web en tu navegador"
echo ""
echo "🛑 Para detener todos los servicios:"
echo "   Presiona Ctrl+C en esta terminal"
echo ""
echo "=============================================="

# Mantener el script corriendo
print_status "Servicios ejecutándose... Presiona Ctrl+C para detener"
wait
