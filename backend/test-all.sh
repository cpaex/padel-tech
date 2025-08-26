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
