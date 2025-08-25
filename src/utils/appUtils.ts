// PadelTech App Utilities
// Funciones de utilidad para la aplicación real

import { Platform, Dimensions, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

const { width, height } = Dimensions.get('window');

/**
 * Utilidades de la aplicación
 */
export class AppUtils {
  /**
   * Obtener información del dispositivo
   */
  static getDeviceInfo() {
    return {
      platform: Platform.OS,
      version: Platform.Version,
      isIOS: Platform.OS === 'ios',
      isAndroid: Platform.OS === 'android',
      isWeb: Platform.OS === 'web',
      screenWidth: width,
      screenHeight: height,
      isTablet: width > 768,
    };
  }

  /**
   * Validar formato de video
   */
  static isValidVideoFormat(uri: string): boolean {
    const validFormats = ['.mp4', '.mov', '.avi', '.mkv'];
    const extension = uri.toLowerCase().split('.').pop();
    return validFormats.includes(`.${extension}`);
  }

  /**
   * Validar tamaño de video
   */
  static async isValidVideoSize(uri: string, maxSizeMB: number = 100): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        const sizeInMB = fileInfo.size / (1024 * 1024);
        return sizeInMB <= maxSizeMB;
      }
      return false;
    } catch (error) {
      console.error('Error checking video size:', error);
      return false;
    }
  }

  /**
   * Comprimir video (simulado)
   */
  static async compressVideo(uri: string, quality: number = 0.8): Promise<string> {
    // En una aplicación real, aquí usarías una librería de compresión
    // Por ahora, simulamos la compresión
    console.log(`Compressing video: ${uri} with quality: ${quality}`);
    return uri;
  }

  /**
   * Generar nombre único para archivo
   */
  static generateUniqueFileName(prefix: string, extension: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}.${extension}`;
  }

  /**
   * Limpiar archivos temporales
   */
  static async cleanupTempFiles(directory: string, maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const files = await FileSystem.readDirectoryAsync(directory);
      const now = Date.now();

      for (const file of files) {
        const filePath = `${directory}/${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        if (fileInfo.exists && fileInfo.modificationTime) {
          const fileAge = now - fileInfo.modificationTime;
          if (fileAge > maxAge) {
            await FileSystem.deleteAsync(filePath);
            console.log(`Deleted old temp file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }

  /**
   * Guardar video en galería
   */
  static async saveVideoToGallery(videoUri: string, albumName: string = 'PadelTech'): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos para guardar en la galería');
        return false;
      }

      const asset = await MediaLibrary.createAssetAsync(videoUri);
      await MediaLibrary.createAlbumAsync(albumName, asset, false);
      
      return true;
    } catch (error) {
      console.error('Error saving video to gallery:', error);
      Alert.alert('Error', 'No se pudo guardar el video en la galería');
      return false;
    }
  }

  /**
   * Compartir archivo
   */
  static async shareFile(fileUri: string, mimeType: string, title: string): Promise<boolean> {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: title,
        });
        return true;
      } else {
        Alert.alert('Compartir', 'La función de compartir no está disponible en este dispositivo');
        return false;
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      return false;
    }
  }

  /**
   * Formatear fecha
   */
  static formatDate(date: Date | string, format: 'short' | 'long' | 'relative' = 'short'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (format === 'relative') {
      return this.getRelativeTime(dateObj);
    }
    
    if (format === 'long') {
      return dateObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    
    return dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Obtener tiempo relativo
   */
  private static getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'hace un momento';
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`;
    if (diffInSeconds < 2592000) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
    
    return this.formatDate(date, 'short');
  }

  /**
   * Formatear tamaño de archivo
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generar ID único
   */
  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Validar email
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Capitalizar primera letra
   */
  static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Obtener color según puntuación
   */
  static getScoreColor(score: number): string {
    if (score >= 90) return '#4CAF50'; // Verde
    if (score >= 80) return '#8BC34A'; // Verde claro
    if (score >= 70) return '#FFC107'; // Amarillo
    if (score >= 60) return '#FF9800'; // Naranja
    return '#F44336'; // Rojo
  }

  /**
   * Obtener emoji según puntuación
   */
  static getScoreEmoji(score: number): string {
    if (score >= 90) return '🏆';
    if (score >= 80) return '🥇';
    if (score >= 70) return '🥈';
    if (score >= 60) return '🥉';
    return '💪';
  }

  /**
   * Obtener texto descriptivo según puntuación
   */
  static getScoreText(score: number): string {
    if (score >= 90) return 'Excelente';
    if (score >= 80) return 'Muy Bueno';
    if (score >= 70) return 'Bueno';
    if (score >= 60) return 'Regular';
    return 'Necesita Mejora';
  }

  /**
   * Obtener nombre del tipo de golpe
   */
  static getShotTypeName(type: string): string {
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
  }

  /**
   * Obtener nivel según puntuación
   */
  static getLevelFromScore(score: number): string {
    if (score >= 90) return 'expert';
    if (score >= 80) return 'advanced';
    if (score >= 70) return 'intermediate';
    return 'beginner';
  }

  /**
   * Calcular tendencia de mejora
   */
  static calculateImprovementTrend(scores: number[]): 'improving' | 'stable' | 'declining' {
    if (scores.length < 3) return 'stable';
    
    const recentScores = scores.slice(-3);
    const firstScore = recentScores[0];
    const lastScore = recentScores[2];
    
    if (lastScore > firstScore + 5) return 'improving';
    if (lastScore < firstScore - 5) return 'declining';
    return 'stable';
  }

  /**
   * Obtener recomendaciones según puntuación
   */
  static getRecommendations(score: number, shotType: string): string[] {
    const baseRecommendations = [
      'Practica la técnica básica regularmente',
      'Mantén la consistencia en tus movimientos',
      'Graba y revisa tus golpes frecuentemente',
    ];

    if (score < 60) {
      return [
        'Enfócate en la postura básica',
        'Practica el movimiento sin pelota',
        'Busca instrucción profesional',
        ...baseRecommendations,
      ];
    }

    if (score < 80) {
      return [
        'Mejora la precisión del timing',
        'Trabaja en la transferencia de peso',
        'Practica con diferentes velocidades',
        ...baseRecommendations,
      ];
    }

    return [
      'Refina los detalles técnicos',
      'Practica en situaciones de presión',
      'Mantén tu nivel actual',
      ...baseRecommendations,
    ];
  }
}

export default AppUtils;
