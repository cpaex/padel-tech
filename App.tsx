import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Import screens with error handling
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import VideoHistoryScreen from './src/screens/VideoHistoryScreen';
import { VideoStorageService } from './src/services/videoStorageService';

// Simplified imports to avoid potential issues
let LoginScreen: React.ComponentType<any> | null = null;
let ResultsScreen: React.ComponentType<any> | null = null;
let ProfileScreen: React.ComponentType<any> | null = null;
let authService: any = null;

try {
  const LoginScreenModule = require('./src/screens/LoginScreen');
  LoginScreen = LoginScreenModule?.default || null;
  
  const ResultsScreenModule = require('./src/screens/ResultsScreen');
  ResultsScreen = ResultsScreenModule?.default || null;
  
  const ProfileScreenModule = require('./src/screens/ProfileScreen');
  ProfileScreen = ProfileScreenModule?.default || null;
  
  const authModule = require('./src/services/authService');
  authService = authModule?.authService || null;
} catch (error) {
  console.warn('Optional screens/services not loaded:', error);
}

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Camera: { shotType: string };
  Analysis: { videoUri: string; shotType: string };
  Results: { analysisResult: any };
  Profile: undefined;
  VideoHistory: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>¡Oops! Algo salió mal</Text>
          <Text style={errorStyles.message}>
            La aplicación encontró un error inesperado.
          </Text>
          <Text style={errorStyles.error}>
            {this.state.error?.message || 'Error desconocido'}
          </Text>
          <TouchableOpacity
            style={errorStyles.button}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={errorStyles.buttonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#667eea',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  error: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buttonText: {
    color: '#667eea',
    fontWeight: 'bold',
  },
});

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing PadelTech...');
      
      // Initialize video storage
      try {
        await VideoStorageService.initialize();
        console.log('Video storage initialized successfully');
      } catch (error) {
        console.warn('Video storage initialization failed, continuing:', error);
      }
      
      console.log('App initialization complete');
    } catch (error) {
      console.error('App initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando PadelTech...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Camera" component={CameraScreen} />
            <Stack.Screen name="Analysis" component={AnalysisScreen} />
            <Stack.Screen name="VideoHistory" component={VideoHistoryScreen} />
            {ResultsScreen && (
              <Stack.Screen name="Results" component={ResultsScreen} />
            )}
            {ProfileScreen && (
              <Stack.Screen name="Profile" component={ProfileScreen} />
            )}
            {LoginScreen && (
              <Stack.Screen name="Login" component={LoginScreen} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#667eea',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: 'white',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});