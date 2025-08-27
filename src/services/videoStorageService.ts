import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoredVideo {
  id: string;
  uri: string;
  shotType: string;
  fileName: string;
  timestamp: number;
  duration: number;
  size: number;
  analysisResult?: any;
}

export interface VideoMetadata {
  shotType: string;
  timestamp: number;
  duration: number;
  size: number;
  analysisResult?: any;
}

export class VideoStorageService {
  private static readonly VIDEOS_DIRECTORY = `${FileSystem.documentDirectory}padeltech_videos/`;
  private static readonly VIDEOS_INDEX_KEY = 'padeltech_videos_index';
  
  /**
   * Initialize the video storage directory
   */
  static async initialize(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        console.log('Skipping video storage initialization on web platform');
        return;
      }

      if (!FileSystem.documentDirectory) {
        console.warn('Document directory not available, skipping video storage');
        return;
      }

      const dirInfo = await FileSystem.getInfoAsync(this.VIDEOS_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.VIDEOS_DIRECTORY, { intermediates: true });
        console.log('Created videos directory:', this.VIDEOS_DIRECTORY);
      } else {
        console.log('Videos directory already exists:', this.VIDEOS_DIRECTORY);
      }
    } catch (error) {
      console.warn('Video storage initialization failed, continuing without it:', error);
      // Don't throw error, just warn and continue
    }
  }

  /**
   * Save video to internal storage with metadata
   */
  static async saveVideo(
    videoUri: string,
    metadata: VideoMetadata
  ): Promise<StoredVideo> {
    try {
      if (Platform.OS === 'web') {
        // Web simulation
        const mockVideo: StoredVideo = {
          id: Date.now().toString(),
          uri: videoUri,
          fileName: `web_video_${Date.now()}.mp4`,
          ...metadata,
        };
        await this.addVideoToIndex(mockVideo);
        return mockVideo;
      }

      await this.initialize();

      // Generate unique filename
      const videoId = Date.now().toString();
      const fileName = `${metadata.shotType}_${videoId}.mp4`;
      const destinationUri = `${this.VIDEOS_DIRECTORY}${fileName}`;

      // Copy video to internal storage
      await FileSystem.copyAsync({
        from: videoUri,
        to: destinationUri,
      });

      console.log('Video saved to internal storage:', destinationUri);

      // Create video record
      const storedVideo: StoredVideo = {
        id: videoId,
        uri: destinationUri,
        fileName,
        ...metadata,
      };

      // Update videos index
      await this.addVideoToIndex(storedVideo);

      return storedVideo;
    } catch (error) {
      console.error('Error saving video:', error);
      throw new Error('Failed to save video to internal storage');
    }
  }

  /**
   * Get all stored videos
   */
  static async getAllVideos(): Promise<StoredVideo[]> {
    try {
      const indexData = await AsyncStorage.getItem(this.VIDEOS_INDEX_KEY);
      if (!indexData) {
        return [];
      }

      const videos: StoredVideo[] = JSON.parse(indexData);
      
      if (Platform.OS === 'web') {
        return videos;
      }

      // Verify videos still exist and update index if needed
      const validVideos: StoredVideo[] = [];
      let indexChanged = false;

      for (const video of videos) {
        const fileInfo = await FileSystem.getInfoAsync(video.uri);
        if (fileInfo.exists) {
          validVideos.push(video);
        } else {
          indexChanged = true;
          console.log('Video file no longer exists:', video.fileName);
        }
      }

      if (indexChanged) {
        await this.updateVideosIndex(validVideos);
      }

      return validVideos.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting videos:', error);
      return [];
    }
  }

  /**
   * Get videos by shot type
   */
  static async getVideosByShotType(shotType: string): Promise<StoredVideo[]> {
    try {
      const allVideos = await this.getAllVideos();
      return allVideos.filter(video => video.shotType === shotType);
    } catch (error) {
      console.error('Error getting videos by shot type:', error);
      return [];
    }
  }

  /**
   * Delete a video
   */
  static async deleteVideo(videoId: string): Promise<void> {
    try {
      const videos = await this.getAllVideos();
      const videoToDelete = videos.find(v => v.id === videoId);
      
      if (!videoToDelete) {
        throw new Error('Video not found');
      }

      if (Platform.OS !== 'web') {
        // Delete physical file
        const fileInfo = await FileSystem.getInfoAsync(videoToDelete.uri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(videoToDelete.uri);
          console.log('Deleted video file:', videoToDelete.fileName);
        }
      }

      // Update index
      const updatedVideos = videos.filter(v => v.id !== videoId);
      await this.updateVideosIndex(updatedVideos);
    } catch (error) {
      console.error('Error deleting video:', error);
      throw new Error('Failed to delete video');
    }
  }

  /**
   * Update analysis result for a video
   */
  static async updateVideoAnalysis(
    videoId: string,
    analysisResult: any
  ): Promise<void> {
    try {
      const videos = await this.getAllVideos();
      const videoIndex = videos.findIndex(v => v.id === videoId);
      
      if (videoIndex === -1) {
        throw new Error('Video not found');
      }

      videos[videoIndex].analysisResult = analysisResult;
      await this.updateVideosIndex(videos);
      console.log('Updated analysis result for video:', videoId);
    } catch (error) {
      console.error('Error updating video analysis:', error);
      throw new Error('Failed to update video analysis');
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    totalVideos: number;
    totalSize: number;
    oldestVideo?: StoredVideo;
    newestVideo?: StoredVideo;
  }> {
    try {
      const videos = await this.getAllVideos();
      
      const totalSize = videos.reduce((sum, video) => sum + (video.size || 0), 0);
      const sortedByDate = [...videos].sort((a, b) => a.timestamp - b.timestamp);
      
      return {
        totalVideos: videos.length,
        totalSize,
        oldestVideo: sortedByDate[0],
        newestVideo: sortedByDate[sortedByDate.length - 1],
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { totalVideos: 0, totalSize: 0 };
    }
  }

  /**
   * Clean up old videos (older than specified days)
   */
  static async cleanupOldVideos(maxAgeDays: number = 30): Promise<number> {
    try {
      const videos = await this.getAllVideos();
      const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
      const now = Date.now();
      
      const videosToDelete = videos.filter(
        video => (now - video.timestamp) > maxAgeMs
      );
      
      for (const video of videosToDelete) {
        await this.deleteVideo(video.id);
      }
      
      console.log(`Cleaned up ${videosToDelete.length} old videos`);
      return videosToDelete.length;
    } catch (error) {
      console.error('Error cleaning up old videos:', error);
      return 0;
    }
  }

  /**
   * Private method to add video to index
   */
  private static async addVideoToIndex(video: StoredVideo): Promise<void> {
    const videos = await this.getAllVideos();
    videos.push(video);
    await this.updateVideosIndex(videos);
  }

  /**
   * Private method to update videos index
   */
  private static async updateVideosIndex(videos: StoredVideo[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.VIDEOS_INDEX_KEY, JSON.stringify(videos));
    } catch (error) {
      console.error('Error updating videos index:', error);
      throw new Error('Failed to update videos index');
    }
  }

  /**
   * Export/share a video (returns the internal URI for sharing)
   */
  static async getVideoForSharing(videoId: string): Promise<string | null> {
    try {
      const videos = await this.getAllVideos();
      const video = videos.find(v => v.id === videoId);
      return video ? video.uri : null;
    } catch (error) {
      console.error('Error getting video for sharing:', error);
      return null;
    }
  }

  /**
   * Format bytes for display
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Format duration for display
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}m ${remainingSeconds}s`;
  }
}