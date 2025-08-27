import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface StorageInfo {
  availableBytes: number;
  totalBytes: number;
  freePercentage: number;
}

export class CameraValidationUtils {
  static readonly MIN_STORAGE_BYTES = 100 * 1024 * 1024; // 100MB minimum
  static readonly MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50MB max video size

  static async validateStorageSpace(): Promise<ValidationResult> {
    try {
      if (Platform.OS === 'web') {
        return { isValid: true };
      }

      const storageInfo = await this.getStorageInfo();
      
      if (storageInfo.availableBytes < this.MIN_STORAGE_BYTES) {
        return {
          isValid: false,
          error: `Espacio insuficiente. Se necesitan al menos ${this.MIN_STORAGE_BYTES / (1024 * 1024)}MB libres.`
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error validating storage space:', error);
      return {
        isValid: false,
        error: 'No se pudo verificar el espacio de almacenamiento disponible.'
      };
    }
  }

  static async getStorageInfo(): Promise<StorageInfo> {
    try {
      if (Platform.OS === 'web') {
        return {
          availableBytes: 1000 * 1024 * 1024, // 1GB simulation
          totalBytes: 10 * 1000 * 1024 * 1024, // 10GB simulation
          freePercentage: 10,
        };
      }

      const diskSpace = await FileSystem.getFreeDiskStorageAsync();
      const totalSpace = await FileSystem.getTotalDiskCapacityAsync();

      return {
        availableBytes: diskSpace,
        totalBytes: totalSpace,
        freePercentage: (diskSpace / totalSpace) * 100,
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      throw new Error('Cannot retrieve storage information');
    }
  }

  static validateVideoFile(uri: string, size: number): ValidationResult {
    try {
      if (!uri || uri.trim() === '') {
        return {
          isValid: false,
          error: 'URI del video no válida.'
        };
      }

      if (size <= 0) {
        return {
          isValid: false,
          error: 'Tamaño del video no válido.'
        };
      }

      if (size > this.MAX_VIDEO_SIZE_BYTES) {
        return {
          isValid: false,
          error: `Video demasiado grande. Máximo ${this.MAX_VIDEO_SIZE_BYTES / (1024 * 1024)}MB permitido.`
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error validating video file:', error);
      return {
        isValid: false,
        error: 'Error al validar el archivo de video.'
      };
    }
  }

  static async ensureDirectoryExists(directory: string): Promise<ValidationResult> {
    try {
      if (Platform.OS === 'web') {
        return { isValid: true };
      }

      const dirInfo = await FileSystem.getInfoAsync(directory);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
        console.log(`Created directory: ${directory}`);
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error ensuring directory exists:', error);
      return {
        isValid: false,
        error: 'No se pudo crear el directorio necesario.'
      };
    }
  }

  static async cleanupOldVideos(directory: string, maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        return;
      }

      const dirInfo = await FileSystem.getInfoAsync(directory);
      if (!dirInfo.exists) {
        return;
      }

      const files = await FileSystem.readDirectoryAsync(directory);
      const now = Date.now();

      for (const file of files) {
        const filePath = `${directory}/${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);

        if (fileInfo.exists && fileInfo.modificationTime) {
          const age = now - fileInfo.modificationTime * 1000;
          
          if (age > maxAgeMs && file.includes('padeltech_')) {
            await FileSystem.deleteAsync(filePath);
            console.log(`Cleaned up old video: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up old videos:', error);
      // Don't throw - cleanup is not critical
    }
  }

  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  static formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}m ${remainingSeconds}s`;
  }

  static generateSafeFilename(shotType: string): string {
    const timestamp = Date.now();
    const safeType = shotType.replace(/[^a-zA-Z0-9]/g, '');
    return `padeltech_${safeType}_${timestamp}.mp4`;
  }
}