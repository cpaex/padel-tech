import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Camera, CameraType, CameraRecordingOptions } from 'expo-camera';
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { CameraValidationUtils } from '../utils/cameraValidation';
import { VideoStorageService } from '../services/videoStorageService';

type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Camera'>;
type CameraScreenRouteProp = RouteProp<RootStackParamList, 'Camera'>;

const { width } = Dimensions.get('window');

interface CameraPermissions {
  camera: boolean;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  maxDuration: number;
}

interface VideoFile {
  uri: string;
  size: number;
  duration: number;
}

export default function CameraScreen() {
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const route = useRoute<CameraScreenRouteProp>();
  const { shotType } = route.params;

  // Permission states
  const [permissions, setPermissions] = useState<CameraPermissions>({
    camera: false,
  });
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  // Camera states
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraType] = useState(CameraType.back);

  // Recording states
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    maxDuration: 10,
  });

  // Video states
  const [recordedVideo, setRecordedVideo] = useState<VideoFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedVideoId, setSavedVideoId] = useState<string | null>(null);

  // Error states
  const [error, setError] = useState<string | null>(null);

  // Refs
  const cameraRef = useRef<Camera>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  // Web compatibility check
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    requestPermissions();
    return () => {
      cleanupRecording();
    };
  }, []);

  useEffect(() => {
    if (recordingState.isRecording && !recordingState.isPaused) {
      startRecordingTimer();
    } else {
      stopRecordingTimer();
    }

    return () => {
      stopRecordingTimer();
    };
  }, [recordingState.isRecording, recordingState.isPaused]);

  const requestPermissions = async () => {
    try {
      setPermissionsLoading(true);
      setError(null);

      if (isWeb) {
        // Web compatibility - simulate permissions
        setPermissions({ camera: true });
        setPermissionsLoading(false);
        return;
      }

      console.log('Requesting camera permissions...');
      
      // Request camera permissions only (no microphone)
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      console.log('Camera permission status:', cameraPermission.status);

      const newPermissions = {
        camera: cameraPermission.status === 'granted',
      };

      setPermissions(newPermissions);

      if (!newPermissions.camera) {
        setError('Acceso a la cámara denegado. Por favor, habilita los permisos de cámara en la configuración de la aplicación.');
      }

    } catch (permissionError) {
      console.error('Error requesting permissions:', permissionError);
      setError('Error al solicitar permisos. Por favor, reinicia la aplicación e intenta de nuevo.');
      setPermissions({ camera: false });
    } finally {
      setPermissionsLoading(false);
    }
  };

  const startRecordingTimer = () => {
    recordingInterval.current = setInterval(() => {
      setRecordingState(prev => {
        const newTime = prev.recordingTime + 1;
        
        // Auto-stop recording when max duration is reached
        if (newTime >= prev.maxDuration) {
          stopRecording();
          return { ...prev, recordingTime: prev.maxDuration };
        }
        
        return { ...prev, recordingTime: newTime };
      });
    }, 1000);
  };

  const stopRecordingTimer = () => {
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }
  };

  const cleanupRecording = () => {
    stopRecordingTimer();
    if (cameraRef.current && recordingState.isRecording) {
      try {
        cameraRef.current.stopRecording();
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    }
  };

  const validateCameraState = (): string | null => {
    if (isWeb) return null; // Skip validation for web
    
    if (!permissions.camera) {
      return 'Permisos de cámara no concedidos';
    }
    
    if (!cameraRef.current) {
      return 'Cámara no disponible';
    }
    
    if (!cameraReady) {
      return 'Cámara no está lista';
    }
    
    return null;
  };


  const getVideoInfo = async (uri: string): Promise<{ size: number; duration: number }> => {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      return {
        size: info.exists ? info.size || 0 : 0,
        duration: recordingState.recordingTime,
      };
    } catch (infoError) {
      console.error('Error getting video info:', infoError);
      return { size: 0, duration: recordingState.recordingTime };
    }
  };

  const saveVideoToInternalStorage = async (videoUri: string, videoInfo: { size: number; duration: number }): Promise<string> => {
    try {
      setIsSaving(true);
      console.log('Saving video to internal storage...');
      
      // Initialize video storage service
      await VideoStorageService.initialize();
      
      // Save video with metadata
      const storedVideo = await VideoStorageService.saveVideo(videoUri, {
        shotType,
        timestamp: Date.now(),
        duration: videoInfo.duration,
        size: videoInfo.size,
      });
      
      console.log('Video saved to internal storage:', storedVideo.id);
      setSavedVideoId(storedVideo.id);
      
      return storedVideo.id;
    } catch (saveError) {
      console.error('Error saving video to internal storage:', saveError);
      throw saveError;
    } finally {
      setIsSaving(false);
    }
  };

  const startRecording = async (): Promise<void> => {
    try {
      setError(null);
      setIsProcessing(true);

      // Pre-recording validations
      const storageValidation = await CameraValidationUtils.validateStorageSpace();
      if (!storageValidation.isValid) {
        setError(storageValidation.error || 'Error de almacenamiento');
        setIsProcessing(false);
        return;
      }

      // Cleanup old videos in background
      if (FileSystem.documentDirectory) {
        CameraValidationUtils.cleanupOldVideos(FileSystem.documentDirectory).catch(console.error);
      }

      if (isWeb) {
        // Web simulation
        setRecordingState(prev => ({
          ...prev,
          isRecording: true,
          recordingTime: 0,
        }));
        
        setTimeout(() => {
          stopRecording();
          // Simulate recorded video for web
          const mockVideo: VideoFile = {
            uri: 'web-simulation',
            size: 1000000, // 1MB simulation
            duration: 3,
          };
          setRecordedVideo(mockVideo);
        }, 3000);
        
        setIsProcessing(false);
        return;
      }

      // Validate camera state
      const validationError = validateCameraState();
      if (validationError) {
        setError(validationError);
        setIsProcessing(false);
        return;
      }

      console.log('Starting video recording...');

      // Configure recording options
      const recordingOptions: CameraRecordingOptions = {
        maxDuration: recordingState.maxDuration,
        quality: '720p' as any,
        mute: true, // Mute audio to avoid microphone permission requirements
        maxFileSize: 50 * 1024 * 1024, // 50MB max file size
      };

      // Start recording
      setRecordingState(prev => ({
        ...prev,
        isRecording: true,
        recordingTime: 0,
        isPaused: false,
      }));

      const video = await cameraRef.current!.recordAsync(recordingOptions);
      
      console.log('Video recording completed:', video.uri);

      // Get video information
      const videoInfo = await getVideoInfo(video.uri);
      
      // Validate the recorded video
      const videoValidation = CameraValidationUtils.validateVideoFile(video.uri, videoInfo.size);
      if (!videoValidation.isValid) {
        setError(videoValidation.error || 'Video inválido');
        setIsProcessing(false);
        return;
      }

      const videoFile: VideoFile = {
        uri: video.uri,
        size: videoInfo.size,
        duration: videoInfo.duration,
      };

      setRecordedVideo(videoFile);
      
      // Save to internal storage
      try {
        await saveVideoToInternalStorage(video.uri, videoInfo);
      } catch (storageError) {
        console.error('Failed to save to internal storage:', storageError);
        setError('Error guardando video en almacenamiento interno');
      }

    } catch (recordingError) {
      console.error('Error during recording:', recordingError);
      
      let errorMessage = 'Error desconocido durante la grabación';
      
      if (recordingError instanceof Error) {
        if (recordingError.message.includes('camera')) {
          errorMessage = 'Error de cámara. Por favor, reinicia la aplicación.';
        } else if (recordingError.message.includes('permission')) {
          errorMessage = 'Permisos insuficientes para grabar video.';
        } else if (recordingError.message.includes('storage')) {
          errorMessage = 'Espacio de almacenamiento insuficiente.';
        } else {
          errorMessage = `Error de grabación: ${recordingError.message}`;
        }
      }
      
      setError(errorMessage);
      
      // Reset recording state
      setRecordingState(prev => ({
        ...prev,
        isRecording: false,
        recordingTime: 0,
        isPaused: false,
      }));
      
    } finally {
      setIsProcessing(false);
    }
  };

  const stopRecording = (): void => {
    try {
      console.log('Stopping video recording...');
      
      if (isWeb) {
        setRecordingState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: false,
        }));
        return;
      }

      if (cameraRef.current && recordingState.isRecording) {
        cameraRef.current.stopRecording();
      }

      setRecordingState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false,
      }));

    } catch (stopError) {
      console.error('Error stopping recording:', stopError);
      setError('Error al detener la grabación');
    }
  };

  const retakeVideo = (): void => {
    try {
      console.log('Retaking video...');
      
      // Clear previous video
      setRecordedVideo(null);
      setSavedVideoId(null);
      setError(null);
      setIsProcessing(false);
      setIsSaving(false);
      
      // Reset recording state
      setRecordingState({
        isRecording: false,
        isPaused: false,
        recordingTime: 0,
        maxDuration: 10,
      });
      
    } catch (retakeError) {
      console.error('Error during retake:', retakeError);
      setError('Error al reiniciar grabación');
    }
  };

  const proceedToAnalysis = (): void => {
    if (!recordedVideo) {
      setError('No hay video para analizar');
      return;
    }

    try {
      console.log('Proceeding to analysis with video:', recordedVideo.uri);
      navigation.navigate('Analysis', { 
        videoUri: recordedVideo.uri, 
        shotType 
      });
    } catch (navigationError) {
      console.error('Error navigating to analysis:', navigationError);
      setError('Error al navegar a la pantalla de análisis');
    }
  };

  const getShotTypeName = (type: string): string => {
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

  // Loading screen
  if (permissionsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Solicitando permisos...</Text>
      </View>
    );
  }

  // Permission denied screen
  if (!permissions.camera) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="camera-outline" size={80} color="#e74c3c" />
        <Text style={styles.errorTitle}>Acceso a la cámara requerido</Text>
        <Text style={styles.errorText}>
          {error || 'Esta aplicación necesita acceso a la cámara para grabar videos de tus golpes de pádel.'}
        </Text>
        <View style={styles.errorButtons}>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={requestPermissions}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Web simulation UI
  if (isWeb) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getShotTypeName(shotType)}</Text>
          <View style={styles.headerSpacer} />
        </LinearGradient>

        <View style={styles.webContainer}>
          <View style={styles.webCameraPlaceholder}>
            <Ionicons name="camera" size={80} color="#667eea" />
            <Text style={styles.webCameraText}>Simulación de Cámara</Text>
            <Text style={styles.webCameraSubtext}>
              En dispositivos móviles, aquí verías la vista de la cámara real
            </Text>
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[
                styles.recordButton,
                recordingState.isRecording && styles.recordingButton,
                isProcessing && styles.disabledButton,
              ]}
              onPress={recordingState.isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size={28} color="white" />
              ) : (
                <Ionicons
                  name={recordingState.isRecording ? 'stop' : 'radio-button-on'}
                  size={32}
                  color="white"
                />
              )}
            </TouchableOpacity>
            
            <Text style={styles.instructionText}>
              {isProcessing
                ? 'Procesando...'
                : recordingState.isRecording
                ? `Grabando... ${recordingState.recordingTime}s`
                : 'Toca para simular grabación'}
            </Text>
            
            {recordedVideo && (
              <TouchableOpacity
                style={styles.continueButton}
                onPress={proceedToAnalysis}
              >
                <Text style={styles.continueButtonText}>Continuar al Análisis</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Main camera interface
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getShotTypeName(shotType)}</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {!recordedVideo ? (
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={cameraType}
            onCameraReady={() => setCameraReady(true)}
          >
            <View style={styles.cameraOverlay}>
              {recordingState.isRecording && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingTime}>
                    {recordingState.recordingTime}s / {recordingState.maxDuration}s
                  </Text>
                </View>
              )}
            </View>
          </Camera>

          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[
                styles.recordButton,
                recordingState.isRecording && styles.recordingButton,
                (!cameraReady || isProcessing) && styles.disabledButton,
              ]}
              onPress={recordingState.isRecording ? stopRecording : startRecording}
              disabled={!cameraReady || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size={28} color="white" />
              ) : (
                <Ionicons
                  name={recordingState.isRecording ? 'stop' : 'radio-button-on'}
                  size={32}
                  color="white"
                />
              )}
            </TouchableOpacity>
            
            <Text style={styles.instructionText}>
              {!cameraReady
                ? 'Preparando cámara...'
                : isProcessing
                ? 'Procesando...'
                : recordingState.isRecording
                ? 'Toca para detener la grabación'
                : 'Toca para comenzar a grabar'}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          <Video
            source={{ uri: recordedVideo.uri }}
            style={styles.videoPreview}
            useNativeControls
            resizeMode={"contain" as any}
            isLooping
          />
          
          <View style={styles.previewControls}>
            <View style={styles.videoInfo}>
              <Text style={styles.videoInfoText}>
                Duración: {CameraValidationUtils.formatDuration(recordedVideo.duration)}
              </Text>
              <Text style={styles.videoInfoText}>
                Tamaño: {CameraValidationUtils.formatBytes(recordedVideo.size)}
              </Text>
              {isSaving && (
                <Text style={styles.savingText}>Guardando en almacenamiento interno...</Text>
              )}
              {savedVideoId && (
                <Text style={styles.savedText}>✓ Guardado (ID: {savedVideoId.slice(-6)})</Text>
              )}
            </View>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={retakeVideo}
              >
                <Ionicons name="refresh" size={20} color="#667eea" />
                <Text style={styles.retakeButtonText}>Regrabar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.continueButton}
                onPress={proceedToAnalysis}
              >
                <Ionicons name="arrow-forward" size={20} color="white" />
                <Text style={styles.continueButtonText}>Analizar</Text>
              </TouchableOpacity>
            </View>
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
  headerButton: {
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
  headerSpacer: {
    width: 40,
  },
  errorBanner: {
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorBannerText: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    marginRight: 10,
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
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    backgroundColor: 'white',
    borderRadius: 4,
    marginRight: 6,
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
  disabledButton: {
    opacity: 0.6,
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
    padding: 20,
    backgroundColor: 'white',
  },
  videoInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  videoInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  savingText: {
    fontSize: 12,
    color: '#667eea',
    marginTop: 8,
  },
  savedText: {
    fontSize: 12,
    color: '#2ecc71',
    marginTop: 4,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#667eea',
    backgroundColor: 'white',
  },
  retakeButtonText: {
    marginLeft: 8,
    color: '#667eea',
    fontWeight: '600',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#667eea',
  },
  continueButtonText: {
    marginLeft: 8,
    color: 'white',
    fontWeight: '600',
  },
});