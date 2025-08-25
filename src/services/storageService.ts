import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export interface StoredAnalysis {
  id: string;
  shotType: string;
  overallScore: number;
  posture: number;
  timing: number;
  followThrough: number;
  power: number;
  improvements: string[];
  videoUri: string;
  timestamp: string;
  userId: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  joinDate: string;
  totalAnalyses: number;
  averageScore: number;
  favoriteShot: string;
}

export interface ProgressData {
  shotType: string;
  analyses: StoredAnalysis[];
  averageScore: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
  lastPracticed: string;
}

class StorageService {
  private readonly ANALYSES_KEY = 'padeltech_analyses';
  private readonly USER_PROFILE_KEY = 'padeltech_user_profile';
  private readonly PROGRESS_KEY = 'padeltech_progress';
  private readonly SETTINGS_KEY = 'padeltech_settings';

  /**
   * Guardar un nuevo análisis
   */
  async saveAnalysis(analysis: Omit<StoredAnalysis, 'id' | 'timestamp'>): Promise<string> {
    try {
      const id = this.generateId();
      const timestamp = new Date().toISOString();
      
      const fullAnalysis: StoredAnalysis = {
        ...analysis,
        id,
        timestamp,
      };

      const existingAnalyses = await this.getAnalyses();
      existingAnalyses.push(fullAnalysis);
      
      await AsyncStorage.setItem(this.ANALYSES_KEY, JSON.stringify(existingAnalyses));
      
      // Actualizar progreso
      await this.updateProgress(analysis.shotType, fullAnalysis);
      
      return id;
    } catch (error) {
      console.error('Error saving analysis:', error);
      throw new Error('No se pudo guardar el análisis');
    }
  }

  /**
   * Obtener todos los análisis
   */
  async getAnalyses(): Promise<StoredAnalysis[]> {
    try {
      const data = await AsyncStorage.getItem(this.ANALYSES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting analyses:', error);
      return [];
    }
  }

  /**
   * Obtener análisis por tipo de golpe
   */
  async getAnalysesByShotType(shotType: string): Promise<StoredAnalysis[]> {
    const analyses = await this.getAnalyses();
    return analyses.filter(analysis => analysis.shotType === shotType);
  }

  /**
   * Obtener análisis por usuario
   */
  async getAnalysesByUser(userId: string): Promise<StoredAnalysis[]> {
    const analyses = await this.getAnalyses();
    return analyses.filter(analysis => analysis.userId === userId);
  }

  /**
   * Eliminar un análisis
   */
  async deleteAnalysis(analysisId: string): Promise<boolean> {
    try {
      const analyses = await this.getAnalyses();
      const filteredAnalyses = analyses.filter(analysis => analysis.id !== analysisId);
      
      await AsyncStorage.setItem(this.ANALYSES_KEY, JSON.stringify(filteredAnalyses));
      return true;
    } catch (error) {
      console.error('Error deleting analysis:', error);
      return false;
    }
  }

  /**
   * Guardar perfil de usuario
   */
  async saveUserProfile(profile: Omit<UserProfile, 'id' | 'joinDate'>): Promise<string> {
    try {
      const id = this.generateId();
      const joinDate = new Date().toISOString();
      
      const fullProfile: UserProfile = {
        ...profile,
        id,
        joinDate,
      };

      await AsyncStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(fullProfile));
      return id;
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw new Error('No se pudo guardar el perfil');
    }
  }

  /**
   * Obtener perfil de usuario
   */
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(this.USER_PROFILE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Actualizar progreso del usuario
   */
  async updateProgress(shotType: string, analysis: StoredAnalysis): Promise<void> {
    try {
      const progressData = await this.getProgressData();
      
      if (!progressData[shotType]) {
        progressData[shotType] = {
          shotType,
          analyses: [],
          averageScore: 0,
          improvementTrend: 'stable',
          lastPracticed: analysis.timestamp,
        };
      }

      progressData[shotType].analyses.push(analysis);
      progressData[shotType].lastPracticed = analysis.timestamp;
      
      // Calcular promedio
      const scores = progressData[shotType].analyses.map(a => a.overallScore);
      progressData[shotType].averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      
      // Determinar tendencia
      if (progressData[shotType].analyses.length >= 3) {
        const recentScores = progressData[shotType].analyses
          .slice(-3)
          .map(a => a.overallScore);
        
        if (recentScores[0] < recentScores[2]) {
          progressData[shotType].improvementTrend = 'improving';
        } else if (recentScores[0] > recentScores[2]) {
          progressData[shotType].improvementTrend = 'declining';
        } else {
          progressData[shotType].improvementTrend = 'stable';
        }
      }

      await AsyncStorage.setItem(this.PROGRESS_KEY, JSON.stringify(progressData));
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }

  /**
   * Obtener datos de progreso
   */
  async getProgressData(): Promise<Record<string, ProgressData>> {
    try {
      const data = await AsyncStorage.getItem(this.PROGRESS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting progress data:', error);
      return {};
    }
  }

  /**
   * Guardar video en la galería
   */
  async saveVideoToGallery(videoUri: string): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Permisos de galería no concedidos');
      }

      const asset = await MediaLibrary.createAssetAsync(videoUri);
      await MediaLibrary.createAlbumAsync('PadelTech', asset, false);
      
      return true;
    } catch (error) {
      console.error('Error saving video to gallery:', error);
      return false;
    }
  }

  /**
   * Limpiar videos temporales
   */
  async cleanupTempVideos(): Promise<void> {
    try {
      const tempDir = FileSystem.cacheDirectory + 'PadelTech/';
      const files = await FileSystem.readDirectoryAsync(tempDir);
      
      for (const file of files) {
        if (file.endsWith('.mp4')) {
          await FileSystem.deleteAsync(tempDir + file);
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp videos:', error);
    }
  }

  /**
   * Exportar datos del usuario
   */
  async exportUserData(): Promise<string> {
    try {
      const analyses = await this.getAnalyses();
      const profile = await this.getUserProfile();
      const progress = await this.getProgressData();
      
      const exportData = {
        profile,
        analyses,
        progress,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `padeltech_export_${new Date().toISOString().split('T')[0]}.json`;
      
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, jsonString);
      
      return fileUri;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw new Error('No se pudo exportar los datos');
    }
  }

  /**
   * Importar datos del usuario
   */
  async importUserData(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.analyses) {
        await AsyncStorage.setItem(this.ANALYSES_KEY, JSON.stringify(data.analyses));
      }
      
      if (data.profile) {
        await AsyncStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(data.profile));
      }
      
      if (data.progress) {
        await AsyncStorage.setItem(this.PROGRESS_KEY, JSON.stringify(data.progress));
      }
      
      return true;
    } catch (error) {
      console.error('Error importing user data:', error);
      return false;
    }
  }

  /**
   * Generar ID único
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Obtener estadísticas generales
   */
  async getGeneralStats(): Promise<{
    totalAnalyses: number;
    averageScore: number;
    mostPracticedShot: string;
    improvementRate: number;
  }> {
    try {
      const analyses = await this.getAnalyses();
      const progress = await this.getProgressData();
      
      if (analyses.length === 0) {
        return {
          totalAnalyses: 0,
          averageScore: 0,
          mostPracticedShot: 'N/A',
          improvementRate: 0,
        };
      }
      
      const totalAnalyses = analyses.length;
      const averageScore = analyses.reduce((sum, a) => sum + a.overallScore, 0) / totalAnalyses;
      
      // Encontrar el golpe más practicado
      const shotCounts: Record<string, number> = {};
      analyses.forEach(analysis => {
        shotCounts[analysis.shotType] = (shotCounts[analysis.shotType] || 0) + 1;
      });
      
      const mostPracticedShot = Object.entries(shotCounts)
        .sort(([,a], [,b]) => b - a)[0][0];
      
      // Calcular tasa de mejora
      const improvingShots = Object.values(progress)
        .filter(p => p.improvementTrend === 'improving').length;
      const improvementRate = (improvingShots / Object.keys(progress).length) * 100;
      
      return {
        totalAnalyses,
        averageScore: Math.round(averageScore * 100) / 100,
        mostPracticedShot,
        improvementRate: Math.round(improvementRate * 100) / 100,
      };
    } catch (error) {
      console.error('Error getting general stats:', error);
      return {
        totalAnalyses: 0,
        averageScore: 0,
        mostPracticedShot: 'N/A',
        improvementRate: 0,
      };
    }
  }
}

export const storageService = new StorageService();
export default storageService;
