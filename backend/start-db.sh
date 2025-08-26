#!/bin/bash

echo "🚀 Iniciando PadelTech Backend con Base de Datos Real"
echo "=================================================="

# Verificar si MongoDB está corriendo
echo "🔍 Verificando conexión a MongoDB..."

if ! command -v mongod &> /dev/null; then
    echo "❌ MongoDB no está instalado o no está en el PATH"
    echo "💡 Instala MongoDB con: brew tap mongodb/brew && brew install mongodb-community"
    echo "💡 O inicia el servicio con: brew services start mongodb/brew/mongodb-community"
    exit 1
fi

# Verificar si MongoDB está corriendo
if ! brew services list | grep -q "mongodb-community.*started"; then
    echo "⚠️  MongoDB no está corriendo"
    echo "💡 Inicia MongoDB con: brew services start mongodb/brew/mongodb-community"
    echo "💡 O ejecuta: mongod --config /opt/homebrew/etc/mongod.conf"
    echo ""
    echo "🔄 Intentando iniciar MongoDB..."
    brew services start mongodb/brew/mongodb-community 2>/dev/null || {
        echo "❌ No se pudo iniciar MongoDB automáticamente"
        echo "💡 Inicia MongoDB manualmente y ejecuta este script nuevamente"
        exit 1
    }
    
    echo "⏳ Esperando que MongoDB esté listo..."
    sleep 5
fi

echo "✅ MongoDB está corriendo"

# Verificar variables de entorno
if [ ! -f .env ]; then
    echo "⚠️  Archivo .env no encontrado, creando configuración por defecto..."
    echo "MONGODB_URI=mongodb://localhost:27017/padeltech" > .env
    echo "JWT_SECRET=padeltech_dev_secret_key_change_in_production" >> .env
    echo "PORT=3000" >> .env
    echo "NODE_ENV=development" >> .env
fi

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Crear directorios necesarios
echo "📁 Creando directorios necesarios..."
mkdir -p uploads logs

# Iniciar servidor
echo "🚀 Iniciando servidor PadelTech con base de datos real..."
echo "📊 Base de datos: MongoDB"
echo "🔗 URL: http://localhost:3000"
echo "📚 API: http://localhost:3000/api"
echo "📊 Health: http://localhost:3000/health"
echo ""
echo "Presiona Ctrl+C para detener el servidor"
echo "=================================================="

npm run dev:db
