#!/bin/bash

echo "🚀 Iniciando PadelTech Backend (Modo Desarrollo Simple)..."
echo "📱 API disponible en: http://localhost:3000"
echo "📊 Health Check: http://localhost:3000/health"
echo "📚 API Info: http://localhost:3000/api"
echo ""
echo "💡 Modo Desarrollo:"
echo "   - Sin base de datos (datos en memoria)"
echo "   - Usa cualquier email y contraseña '123456'"
echo "   - Reinicia para limpiar datos"
echo ""
echo "Presiona Ctrl+C para detener"
echo "======================================"

node src/server-simple.js
