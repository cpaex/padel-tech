# 🚀 Instalación Rápida - PadelTech

## ⚡ Setup en 3 Pasos

### 1. Prerrequisitos
- ✅ Node.js 16+ instalado
- ✅ npm o yarn instalado
- ✅ Expo CLI instalado (`npm install -g @expo/cli`)

### 2. Instalación Automática
```bash
# Hacer ejecutable el script de setup
chmod +x setup.sh

# Ejecutar setup automático
./setup.sh
```

### 3. Iniciar la Aplicación
```bash
npm start
```

## 📱 Ejecutar en Dispositivo

### iOS Simulator
```bash
npm run ios
```

### Android Emulator
```bash
npm run android
```

### Web Browser
```bash
npm run web
```

### Dispositivo Físico
1. Instala **Expo Go** en tu dispositivo
2. Escanea el código QR que aparece en la terminal
3. ¡Listo! 🎉

## 🔧 Solución de Problemas

### Error de Dependencias
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error de Metro
```bash
npx expo start --clear
```

### Error de Cámara
- Verifica permisos en configuración del dispositivo
- Reinicia la aplicación

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola para errores
2. Verifica que tienes Node.js 16+
3. Limpia cache: `npx expo start --clear`

---

**¡Disfruta analizando tu técnica de pádel! 🎾✨**
