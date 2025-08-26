import { apiClient, ApiResponse } from './apiClient';
import { API_CONFIG, UPLOAD_CONFIG } from '../config/apiConfig';

export interface VideoFile {
  _id: string;
  userId: string;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  duration?: number;
  format: string;
  quality?: string;
  metadata?: {
    width?: number;
    height?: number;
    bitrate?: number;
    fps?: number;
  };
  analysisId?: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface VideoUploadOptions {
  compress?: boolean;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  generateThumbnail?: boolean;
  onProgress?: (progress: UploadProgress) => void;
}

export interface VideoValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo?: {
    size: number;
    duration?: number;
    format: string;
    dimensions?: {
      width: number;
      height: number;
    };
  };
}

export class VideoService {
  async uploadVideo(
    videoFile: any,
    options: VideoUploadOptions = {}
  ): Promise<ApiResponse<{ video: VideoFile }>> {
    try {
      // Validate video before upload
      const validation = await this.validateVideo(videoFile);
      if (!validation.isValid) {
        throw {
          success: false,
          message: 'Video validation failed',
          errors: validation.errors
        };
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('video', videoFile);
      
      // Add options to form data
      if (options.compress !== undefined) {
        formData.append('compress', String(options.compress));
      }
      if (options.quality) {
        formData.append('quality', String(options.quality));
      }
      if (options.maxWidth) {
        formData.append('maxWidth', String(options.maxWidth));
      }
      if (options.maxHeight) {
        formData.append('maxHeight', String(options.maxHeight));
      }
      if (options.generateThumbnail !== undefined) {
        formData.append('generateThumbnail', String(options.generateThumbnail));
      }

      // Upload with progress tracking
      return await apiClient.uploadFile<{ video: VideoFile }>(
        API_CONFIG.VIDEO.UPLOAD,
        videoFile,
        {
          compress: options.compress,
          quality: options.quality,
          maxWidth: options.maxWidth,
          maxHeight: options.maxHeight,
          generateThumbnail: options.generateThumbnail
        },
        options.onProgress ? (progress: number) => {
          options.onProgress!({
            loaded: progress,
            total: 100,
            percentage: progress
          });
        } : undefined
      );

    } catch (error) {
      console.error('Video upload error:', error);
      throw error;
    }
  }

  async getVideo(id: string): Promise<ApiResponse<{ video: VideoFile }>> {
    try {
      return await apiClient.get<{ video: VideoFile }>(
        API_CONFIG.VIDEO.GET(id)
      );
    } catch (error) {
      console.error('Get video error:', error);
      throw error;
    }
  }

  async deleteVideo(id: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete<void>(
        API_CONFIG.VIDEO.DELETE(id)
      );
    } catch (error) {
      console.error('Delete video error:', error);
      throw error;
    }
  }

  async getThumbnail(id: string): Promise<string> {
    try {
      const response = await apiClient.get<{ thumbnailUrl: string }>(
        API_CONFIG.VIDEO.THUMBNAIL(id)
      );
      
      if (response.success && response.data) {
        return response.data.thumbnailUrl;
      }
      
      throw new Error('Failed to get thumbnail URL');
    } catch (error) {
      console.error('Get thumbnail error:', error);
      throw error;
    }
  }

  async validateVideo(videoFile: any): Promise<VideoValidationResult> {
    const result: VideoValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Check file size
      if (videoFile.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
        result.isValid = false;
        result.errors.push(`El archivo es demasiado grande. Máximo permitido: ${this.formatFileSize(UPLOAD_CONFIG.MAX_FILE_SIZE)}`);
      }

      // Check file format
      const fileExtension = this.getFileExtension(videoFile.name || videoFile.uri);
      if (!UPLOAD_CONFIG.ALLOWED_FORMATS.VIDEO.includes(fileExtension.toLowerCase())) {
        result.isValid = false;
        result.errors.push(`Formato de video no soportado. Formatos permitidos: ${UPLOAD_CONFIG.ALLOWED_FORMATS.VIDEO.join(', ')}`);
      }

      // Get file info
      result.fileInfo = {
        size: videoFile.size,
        format: fileExtension
      };

      // Add warnings for large files
      if (videoFile.size > UPLOAD_CONFIG.MAX_FILE_SIZE * 0.8) {
        result.warnings.push('El archivo es bastante grande, podría tardar en subir');
      }

      // Check if video duration can be obtained (platform specific)
      try {
        const duration = await this.getVideoDuration(videoFile);
        if (duration) {
          result.fileInfo.duration = duration;
          
          // Warn if video is too long
          if (duration > 60) { // 60 seconds
            result.warnings.push('Videos largos podrían tomar más tiempo en procesarse');
          }
        }
      } catch (error) {
        console.warn('Could not determine video duration:', error);
      }

    } catch (error) {
      console.error('Video validation error:', error);
      result.isValid = false;
      result.errors.push('Error al validar el video');
    }

    return result;
  }

  async compressVideo(
    videoFile: any,
    options: {
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
    } = {}
  ): Promise<any> {
    // This would need platform-specific implementation
    // For React Native, you might use libraries like react-native-video-processing
    // For web, you might use ffmpeg.wasm
    
    console.log('Video compression would be implemented here');
    return videoFile; // Return original for now
  }

  private async getVideoDuration(videoFile: any): Promise<number | null> {
    // Platform-specific implementation needed
    // For React Native: use react-native-video-processing or similar
    // For web: create video element and get duration
    
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && videoFile instanceof File) {
        // Web implementation
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
          resolve(video.duration);
        };
        
        video.onerror = () => {
          resolve(null);
        };
        
        video.src = URL.createObjectURL(videoFile);
      } else {
        // React Native implementation would go here
        resolve(null);
      }
    });
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop() || '';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Utility methods
  getVideoUrl(video: VideoFile): string {
    return video.url;
  }

  getThumbnailUrl(video: VideoFile): string | null {
    return video.thumbnailUrl || null;
  }

  getVideoDurationFormatted(duration: number): string {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  getVideoSizeFormatted(size: number): string {
    return this.formatFileSize(size);
  }

  getVideoQualityLabel(video: VideoFile): string {
    if (!video.metadata?.width || !video.metadata?.height) {
      return 'Desconocida';
    }

    const { width, height } = video.metadata;
    
    if (height >= 2160) return '4K';
    if (height >= 1080) return 'Full HD';
    if (height >= 720) return 'HD';
    if (height >= 480) return 'SD';
    return 'Baja';
  }

  isVideoReady(video: VideoFile): boolean {
    return video.status === 'ready';
  }

  isVideoProcessing(video: VideoFile): boolean {
    return video.status === 'processing' || video.status === 'uploading';
  }

  hasVideoFailed(video: VideoFile): boolean {
    return video.status === 'failed';
  }
}

export const videoService = new VideoService();
export default videoService;