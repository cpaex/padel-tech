import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';

type AnalysisScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Analysis'>;
type AnalysisScreenRouteProp = RouteProp<RootStackParamList, 'Analysis'>;

const { width, height } = Dimensions.get('window');

const analysisSteps = [
  'Inicializando modelo de IA...',
  'Extrayendo frames del video...',
  'Analizando postura corporal...',
  'Evaluando mecánica del golpe...',
  'Calculando métricas de rendimiento...',
  'Generando recomendaciones personalizadas...',
  'Finalizando análisis...',
];

export default function AnalysisScreen() {
  const navigation = useNavigation<AnalysisScreenNavigationProp>();
  const route = useRoute<AnalysisScreenRouteProp>();
  const { videoUri, shotType } = route.params;

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const pulseAnim = new Animated.Value(1);
  const rotateAnim = new Animated.Value(0);

  useEffect(() => {
    // TODO: Reemplazar simulación con llamada real al modelo de deep learning
    // TODO: Implementar las siguientes funciones:
    // TODO: 1. processVideoWithML(videoUri, shotType) - función principal para análisis
    // TODO: 2. initializeMLModel() - cargar el modelo de TensorFlow.js o similar
    // TODO: 3. extractFrames(videoUri) - extraer frames del video para análisis
    // TODO: 4. analyzePosture(frames) - analizar postura en cada frame
    // TODO: 5. evaluateTechnique(postureData) - evaluar técnica basada en postura
    // TODO: 6. generateRecommendations(techniqueData) - generar recomendaciones
    // TODO: La función debería retornar: { overallScore, posture, timing, followThrough, power, improvements }
    
    // CURRENT: Simulate ML model processing - REMOVE when ML model is ready
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < analysisSteps.length - 1) {
          return prev + 1;
        } else {
          setIsComplete(true);
          return prev;
        }
      });
    }, 1500);

    // CURRENT: Simulate progress - REPLACE with real ML progress updates
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 100) {
          return prev + 2;
        }
        return prev;
      });
    }, 100);

    // Animation loops
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );

    pulseLoop.start();
    rotateLoop.start();

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      pulseLoop.stop();
      rotateLoop.stop();
    };
  }, []);

  useEffect(() => {
    if (isComplete) {
      // TODO: REPLACE this mock result with real ML analysis results
      // TODO: The processVideoWithML function should return this exact structure:
      // TODO: { overallScore, posture, timing, followThrough, power, improvements, shotType }
      const mockResult = {
        overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
        posture: Math.floor(Math.random() * 30) + 70,
        timing: Math.floor(Math.random() * 30) + 70,
        followThrough: Math.floor(Math.random() * 30) + 70,
        power: Math.floor(Math.random() * 30) + 70,
        improvements: [
          'Mantén la raqueta más alta en la preparación',
          'Mejora la transferencia de peso',
          'Ajusta el timing del impacto',
          'Practica el seguimiento del golpe',
        ],
        shotType: shotType,
      };

      setTimeout(() => {
        navigation.replace('Results', { analysisResult: mockResult });
      }, 1000);
    }
  }, [isComplete, navigation, shotType]);

  const getShotTypeName = (type: string) => {
    const shotNames: { [key: string]: string } = {
      derecha: 'Derecha',
      reves: 'Revés',
      volea: 'Volea',
      saque: 'Saque',
      bandeja: 'Bandeja',
      vibora: 'Víbora',
      remate: 'Remate',
    };
    return shotNames[type] || type;
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analizando Técnica</Text>
        <Text style={styles.subtitle}>{getShotTypeName(shotType)}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.aiContainer}>
          <Animated.View
            style={[
              styles.aiIcon,
              {
                transform: [
                  { scale: pulseAnim },
                  { rotate: spin },
                ],
              },
            ]}
          >
            <Ionicons name="analytics" size={60} color="white" />
          </Animated.View>
          
          <Text style={styles.aiText}>IA Analizando</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          <Text style={styles.progressSubtext}>
            {progress < 100 ? 'Procesando tu video...' : '¡Análisis completado!'}
          </Text>
        </View>

        <View style={styles.stepsContainer}>
          <Text style={styles.currentStep}>
            {analysisSteps[currentStep]}
          </Text>
          
          <View style={styles.stepsList}>
            {analysisSteps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepDot,
                    index <= currentStep && styles.stepDotActive,
                  ]}
                >
                  {index < currentStep && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepText,
                    index <= currentStep && styles.stepTextActive,
                  ]}
                >
                  {step}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {isComplete
            ? '¡Análisis completado! Preparando tus resultados...'
            : 'Nuestro modelo de IA está analizando cada detalle de tu técnica'}
        </Text>
        {!isComplete && (
          <Text style={styles.footerSubtext}>
            Tiempo estimado: {Math.max(1, Math.ceil((100 - progress) / 10))} segundos
          </Text>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  aiContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  aiIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  aiText: {
    fontSize: 20,
    color: 'white',
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 15,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  progressSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  stepsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  currentStep: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  stepsList: {
    width: '100%',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepDotActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  stepTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  footerSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
