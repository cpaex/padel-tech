import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Video } from 'expo-av';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';

type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Camera'>;
type CameraScreenRouteProp = RouteProp<RootStackParamList, 'Camera'>;

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const route = useRoute<CameraScreenRouteProp>();
  const { shotType } = route.params;

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const cameraRef = useRef<Camera>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  // Web compatibility check
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (isWeb) {
      // Simulate camera permission for web
      setHasPermission(true);
      setCameraReady(true);
      return;
    }

    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, [isWeb]);

  useEffect(() => {
    if (isRecording) {
      recordingInterval.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 10) {
            stopRecording();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    }

    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    if (isWeb) {
      // Simulate recording for web
      setIsRecording(true);
      setRecordingTime(0);
      
      setTimeout(() => {
        setIsRecording(false);
        setRecordedVideo('web-simulation');
        // Auto-redirect to results after recording
        setTimeout(() => {
          processVideoAndRedirect('web-simulation');
        }, 500);
      }, 3000);
      return;
    }

    if (!cameraRef.current || !cameraReady) return;

    try {
      setIsRecording(true);
      setRecordingTime(0);
      
      const video = await cameraRef.current.recordAsync({
        maxDuration: 10,
        quality: Camera.Constants.VideoQuality['720p'],
      });
      
      setRecordedVideo(video.uri);
      setIsRecording(false);
      
      // Auto-redirect to results after recording
      setTimeout(() => {
        processVideoAndRedirect(video.uri);
      }, 500);
    } catch (error) {
      console.error('Error recording video:', error);
      setIsRecording(false);
      Alert.alert('Error', 'No se pudo grabar el video');
    }
  };

  const stopRecording = () => {
    if (isWeb) {
      setIsRecording(false);
      return;
    }

    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  const processVideoAndRedirect = async (videoUri: string) => {
    setIsProcessing(true);
    
    try {
      // Simulate quick processing (in real app, this would be your ML model)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate analysis result
      const analysisResult = {
        overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
        posture: Math.floor(Math.random() * 30) + 70,
        timing: Math.floor(Math.random() * 30) + 70,
        followThrough: Math.floor(Math.random() * 30) + 70,
        power: Math.floor(Math.random() * 30) + 70,
        improvements: getMockImprovements(shotType),
        shotType: shotType,
      };

      // Navigate directly to results
      navigation.replace('Results', { analysisResult });
    } catch (error) {
      console.error('Error processing video:', error);
      Alert.alert('Error', 'No se pudo procesar el video');
      setIsProcessing(false);
    }
  };

  const getMockImprovements = (type: string): string[] => {
    const improvements: { [key: string]: string[] } = {
      derecha: [
        'Mantén la raqueta más alta en la preparación',
        'Mejora la transferencia de peso hacia adelante',
        'Ajusta el timing del impacto con la pelota',
        'Practica el seguimiento completo del golpe',
      ],
      reves: [
        'Gira más los hombros en la preparación',
        'Mantén la raqueta paralela al suelo',
        'Mejora la coordinación mano-ojo',
        'Practica la posición de los pies',
      ],
      volea: [
        'Mantén la raqueta más cerca del cuerpo',
        'Reduce el backswing para mayor control',
        'Mejora la posición de espera',
        'Practica la reacción rápida',
      ],
      saque: [
        'Eleva más la pelota en el lanzamiento',
        'Mejora la coordinación del movimiento',
        'Practica la consistencia del servicio',
        'Ajusta la posición de los pies',
      ],
      bandeja: [
        'Mantén la raqueta más alta',
        'Mejora el ángulo de la raqueta',
        'Practica la precisión del golpe',
        'Ajusta la fuerza según la situación',
      ],
      vibora: [
        'Mejora la posición de la muñeca',
        'Practica el control de la dirección',
        'Ajusta la velocidad del swing',
        'Mantén la concentración en el objetivo',
      ],
      remate: [
        'Mejora la posición de salto',
        'Practica el timing del impacto',
        'Ajusta la fuerza según la situación',
        'Mantén el equilibrio durante el golpe',
      ],
    };

    return improvements[type] || [
      'Practica la técnica básica',
      'Mejora la consistencia',
      'Trabaja en la precisión',
      'Desarrolla la confianza',
    ];
  };

  const retakeVideo = () => {
    setRecordedVideo(null);
    setRecordingTime(0);
    setIsProcessing(false);
  };

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

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Solicitando permisos...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No hay acceso a la cámara</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Web-specific UI
  if (isWeb) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getShotTypeName(shotType)}</Text>
          <View style={styles.placeholder} />
        </LinearGradient>

        <View style={styles.webContainer}>
          <View style={styles.webCameraPlaceholder}>
            <Ionicons name="camera" size={80} color="#667eea" />
            <Text style={styles.webCameraText}>Simulación de Cámara</Text>
            <Text style={styles.webCameraSubtext}>
              En dispositivos móviles, aquí verías la vista de la cámara
            </Text>
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordingButton,
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'radio-button-on'}
                size={32}
                color="white"
              />
            </TouchableOpacity>
            
            <Text style={styles.instructionText}>
              {isProcessing
                ? 'Procesando video...'
                : isRecording
                ? 'Grabando... (Simulación)'
                : 'Toca para simular grabación'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getShotTypeName(shotType)}</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {!recordedVideo ? (
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={CameraType.back}
            onCameraReady={() => setCameraReady(true)}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.recordingIndicator}>
                {isRecording && (
                  <View style={styles.recordingDot}>
                    <Text style={styles.recordingTime}>{recordingTime}s</Text>
                  </View>
                )}
              </View>
            </View>
          </Camera>

          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordingButton,
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={!cameraReady || isProcessing}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'radio-button-on'}
                size={32}
                color="white"
              />
            </TouchableOpacity>
            
            <Text style={styles.instructionText}>
              {isProcessing
                ? 'Procesando video...'
                : isRecording
                ? 'Toca para detener la grabación'
                : 'Toca para comenzar a grabar'}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          {isWeb ? (
            <View style={styles.webVideoPreview}>
              <Ionicons name="videocam" size={60} color="#667eea" />
              <Text style={styles.webVideoText}>Video Simulado</Text>
              <Text style={styles.webVideoSubtext}>
                En dispositivos móviles verías el video real
              </Text>
            </View>
          ) : (
            <Video
              source={{ uri: recordedVideo }}
              style={styles.videoPreview}
              useNativeControls
              resizeMode="contain" as any
            />
          )}
          
          <View style={styles.previewControls}>
            {!isProcessing && (
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={retakeVideo}
              >
                <Ionicons name="refresh" size={20} color="#667eea" />
                <Text style={styles.retakeButtonText}>Regrabar</Text>
              </TouchableOpacity>
            )}
            
            {isProcessing && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="small" color="#667eea" />
                <Text style={styles.processingText}>Procesando video...</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  // Web-specific styles
  webContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webCameraPlaceholder: {
    alignItems: 'center',
    padding: 40,
  },
  webCameraText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  webCameraSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  webVideoPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  webVideoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  webVideoSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  recordingDot: {
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  recordingTime: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingButton: {
    backgroundColor: '#e74c3c',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  previewContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  videoPreview: {
    flex: 1,
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  retakeButtonText: {
    marginLeft: 8,
    color: '#667eea',
    fontWeight: '600',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  processingText: {
    marginLeft: 10,
    color: '#667eea',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    marginBottom: 30,
    textAlign: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
});
