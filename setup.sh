#!/bin/bash

echo "🎾 PadelTech - Setup Script"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 16 o superior."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js versión $NODE_VERSION detectada. Se requiere versión 16 o superior."
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado."
    exit 1
fi

echo "✅ npm $(npm -v) detectado"

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo "📦 Instalando Expo CLI..."
    npm install -g @expo/cli
else
    echo "✅ Expo CLI ya está instalado"
fi

# Install dependencies
echo "📦 Instalando dependencias..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencias instaladas correctamente"
else
    echo "❌ Error al instalar dependencias"
    exit 1
fi

echo ""
echo "🎉 ¡Setup completado exitosamente!"
echo ""
echo "Para iniciar la aplicación:"
echo "  npm start"
echo ""
echo "Para ejecutar en iOS Simulator:"
echo "  npm run ios"
echo ""
echo "Para ejecutar en Android Emulator:"
echo "  npm run android"
echo ""
echo "Para ejecutar en web:"
echo "  npm run web"
echo ""
echo "¡Disfruta analizando tu técnica de pádel! 🎾✨"
