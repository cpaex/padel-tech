# PadelTech 🎾

Una aplicación móvil moderna para analizar la técnica de golpes de pádel utilizando inteligencia artificial.

## 🚀 Características

### 🏠 Pantalla Principal
- Selección de 7 tipos de golpes de pádel
- Diseño moderno con gradientes y efectos glassmorphism
- Iconos distintivos para cada golpe
- Navegación fluida entre pantallas

### 📹 Grabación de Video
- Acceso a la cámara trasera del dispositivo
- Grabación automática de 10 segundos máximo
- Controles intuitivos para iniciar/detener
- Preview en tiempo real del video
- Opción de regrabar si no estás satisfecho

### 🤖 Análisis con IA
- Pantalla de loading con animaciones
- Simulación de procesamiento de modelo de ML
- Pasos detallados del análisis
- Barra de progreso visual
- (En producción conectarías aquí tu modelo entrenado)

### 📊 Resultados Detallados
- Puntuación general de técnica (0-100%)
- Desglose por aspectos técnicos:
  - Postura
  - Timing
  - Seguimiento
  - Potencia
- Lista de mejoras específicas
- Barras de progreso visuales con colores
- Emojis y calificaciones descriptivas

## 🛠️ Tecnologías Utilizadas

- **React Native** - Framework principal
- **Expo** - Plataforma de desarrollo
- **TypeScript** - Tipado estático
- **React Navigation** - Navegación entre pantallas
- **Expo Camera** - Acceso a la cámara
- **Expo AV** - Reproducción de video
- **React Native Reanimated** - Animaciones fluidas
- **Linear Gradient** - Gradientes modernos

## 📱 Tipos de Golpes Soportados

1. **Derecha** 🎾 - Golpe de derecha
2. **Revés** 🏓 - Golpe de revés
3. **Volea** ⚡ - Volea rápida
4. **Saque** 🚀 - Saque inicial
5. **Bandeja** 🥄 - Golpe de bandeja
6. **Víbora** 🐍 - Golpe de víbora
7. **Remate** 💥 - Remate potente

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (versión 16 o superior)
- npm o yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (para desarrollo en iOS)
- Android Studio (para desarrollo en Android)

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd padel-tech
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   yarn install
   ```

3. **Iniciar la aplicación**
   ```bash
   npm start
   # o
   yarn start
   ```

4. **Ejecutar en dispositivo/simulador**
   - Presiona `i` para iOS Simulator
   - Presiona `a` para Android Emulator
   - Escanea el código QR con la app Expo Go en tu dispositivo físico

## 📱 Uso de la Aplicación

### 1. Selección de Golpe
- Abre la aplicación
- Selecciona el tipo de golpe que quieres analizar
- Cada golpe tiene su propio icono y descripción

### 2. Grabación de Video
- La cámara se activará automáticamente
- Posiciónate para grabar tu golpe
- Toca el botón de grabación para comenzar
- La grabación se detendrá automáticamente a los 10 segundos
- Puedes detener manualmente tocando el botón de stop

### 3. Análisis de IA
- El video se enviará para análisis
- Observa el progreso en tiempo real
- La IA analizará diferentes aspectos de tu técnica

### 4. Resultados
- Revisa tu puntuación general
- Analiza los detalles por categoría
- Lee las recomendaciones de mejora
- Comparte tus resultados o prueba otro golpe

## 🔧 Configuración de Permisos

### iOS
- Cámara: `NSCameraUsageDescription`
- Micrófono: `NSMicrophoneUsageDescription`

### Android
- `android.permission.CAMERA`
- `android.permission.RECORD_AUDIO`
- `android.permission.WRITE_EXTERNAL_STORAGE`

## 🎨 Diseño y UX

### Principios de Diseño
- **Glassmorphism**: Efectos de cristal y transparencia
- **Gradientes Modernos**: Colores vibrantes y atractivos
- **Animaciones Fluidas**: Transiciones suaves entre pantallas
- **Responsive Design**: Adaptable a diferentes tamaños de pantalla

### Paleta de Colores
- **Primario**: #667eea (Azul)
- **Secundario**: #764ba2 (Púrpura)
- **Acento**: #f093fb (Rosa)
- **Éxito**: #4CAF50 (Verde)
- **Advertencia**: #FFC107 (Amarillo)
- **Error**: #F44336 (Rojo)

## 🚧 Desarrollo y Personalización

### Estructura del Proyecto
```
padel-tech/
├── src/
│   └── screens/
│       ├── HomeScreen.tsx      # Pantalla principal
│       ├── CameraScreen.tsx    # Grabación de video
│       ├── AnalysisScreen.tsx  # Análisis con IA
│       └── ResultsScreen.tsx   # Resultados
├── App.tsx                     # Navegación principal
├── package.json               # Dependencias
├── app.json                   # Configuración Expo
├── tsconfig.json             # Configuración TypeScript
└── babel.config.js           # Configuración Babel
```

### Personalización del Modelo de IA
Para conectar tu modelo de deep learning real:

1. **Modifica `AnalysisScreen.tsx`**
   - Reemplaza la simulación con llamadas a tu API
   - Integra el procesamiento real del video

2. **Configura el Backend**
   - Endpoint para análisis de video
   - Modelo entrenado con datos de pádel
   - API de resultados estructurados

3. **Optimizaciones**
   - Compresión de video antes del envío
   - Cache de resultados
   - Análisis offline cuando sea posible

## 📊 Métricas y Análisis

### Aspectos Técnicos Evaluados
- **Postura**: Posición del cuerpo y raqueta
- **Timing**: Momento exacto del impacto
- **Seguimiento**: Continuidad del movimiento
- **Potencia**: Fuerza y velocidad del golpe

### Sistema de Puntuación
- **90-100%**: Excelente 🏆
- **80-89%**: Muy Bueno 🥇
- **70-79%**: Bueno 🥈
- **60-69%**: Regular 🥉
- **0-59%**: Necesita Mejora 💪

## 🔮 Roadmap Futuro

### Funcionalidades Planificadas
- [ ] Análisis en tiempo real
- [ ] Comparación con jugadores profesionales
- [ ] Historial de sesiones
- [ ] Estadísticas de progreso
- [ ] Modo multijugador
- [ ] Integración con wearables
- [ ] Exportación de videos
- [ ] Compartir en redes sociales

### Mejoras Técnicas
- [ ] Modelo de IA más preciso
- [ ] Análisis 3D del movimiento
- [ ] Reconocimiento de patrones
- [ ] Machine Learning personalizado
- [ ] Optimización de rendimiento

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes preguntas o necesitas ayuda:

- Abre un issue en GitHub
- Contacta al equipo de desarrollo
- Consulta la documentación de Expo

## 🙏 Agradecimientos

- Equipo de Expo por la plataforma
- Comunidad de React Native
- Jugadores de pádel que probaron la aplicación
- Entrenadores que validaron las métricas

---

**PadelTech** - Mejora tu técnica de pádel con el poder de la IA 🎾✨
