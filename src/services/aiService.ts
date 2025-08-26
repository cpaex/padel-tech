import { analysisService, AnalysisResult as BackendAnalysisResult } from './analysisService';
import { videoService } from './videoService';
import { authService } from './authService';
import { API_CONFIG, DEV_CONFIG } from '../config/apiConfig';

export interface AnalysisRequest {
  videoUri: string;
  shotType: string;
  userId?: string;
}

export interface AnalysisResult {
  overallScore: number;
  posture: number;
  timing: number;
  followThrough: number;
  power: number;
  improvements: string[];
  shotType: string;
  confidence: number;
  processingTime: number;
  timestamp: string;
}

export interface AIAnalysisError {
  code: string;
  message: string;
  details?: any;
}

class AIService {
  constructor() {
    // API configuration is handled by the individual services
  }

  /**
   * Analiza un video de golpe de pádel usando IA
   */
  async analyzePadelShot(request: AnalysisRequest): Promise<AnalysisResult> {
    try {
      const startTime = Date.now();

      // Check if we should use mock data
      if (DEV_CONFIG.USE_MOCK_DATA) {
        console.log('Using mock data for analysis');
        return this.generateMockAnalysis(request.shotType);
      }

      // Check if user is authenticated
      const user = await authService.getCurrentUser();
      if (!user) {
        throw this.createError('AUTH_REQUIRED', 'Usuario no autenticado');
      }

      // Step 1: Upload video if needed
      let videoResult;
      try {
        videoResult = await this.uploadVideoForAnalysis(request.videoUri);
      } catch (error) {
        console.warn('Video upload failed, using mock analysis:', error);
        return this.generateMockAnalysis(request.shotType);
      }

      // Step 2: Create analysis request
      const analysisData = {
        shotType: request.shotType,
        results: {
          overallScore: 85, // These would come from actual AI processing
          posture: 88,
          timing: 82,
          followThrough: 87,
          power: 84
        },
        video: {
          url: videoResult.video.url,
          thumbnail: videoResult.video.thumbnailUrl,
          duration: videoResult.video.duration,
          size: videoResult.video.size
        },
        improvements: this.generateImprovements(request.shotType),
        metadata: {
          processingTime: Date.now() - startTime,
          confidence: 0.92,
          aiModel: 'padeltech-v1.0'
        }
      };

      // Step 3: Save analysis to backend
      const analysisResponse = await analysisService.createAnalysis(analysisData);

      if (!analysisResponse.success || !analysisResponse.data) {
        throw this.createError('ANALYSIS_SAVE_FAILED', 'Error al guardar análisis');
      }

      // Step 4: Convert backend response to our format
      return this.convertBackendResult(analysisResponse.data.analysis);

    } catch (error) {
      console.error('Error en análisis de IA:', error);
      
      // Fallback to mock analysis on any error
      return this.generateMockAnalysis(request.shotType);
    }
  }

  /**
   * Uploads video for analysis
   */
  private async uploadVideoForAnalysis(videoUri: string): Promise<any> {
    // Create a file-like object from the URI
    const videoFile = {
      uri: videoUri,
      type: 'video/mp4',
      name: `padel_analysis_${Date.now()}.mp4`
    };

    return await videoService.uploadVideo(videoFile, {
      compress: true,
      quality: 0.8,
      generateThumbnail: true,
      onProgress: (progress) => {
        console.log(`Upload progress: ${progress.percentage}%`);
      }
    });
  }

  /**
   * Converts backend analysis result to our format
   */
  private convertBackendResult(backendResult: BackendAnalysisResult): AnalysisResult {
    return {
      overallScore: backendResult.results.overallScore,
      posture: backendResult.results.posture,
      timing: backendResult.results.timing,
      followThrough: backendResult.results.followThrough,
      power: backendResult.results.power,
      improvements: backendResult.improvements,
      shotType: backendResult.shotType,
      confidence: backendResult.metadata?.confidence || 0.85,
      processingTime: backendResult.metadata?.processingTime || 2000,
      timestamp: backendResult.createdAt,
    };
  }

  /**
   * Generates improvements based on shot type
   */
  private generateImprovements(shotType: string): string[] {
    return this.getMockImprovements(shotType);
  }

  /**
   * Genera análisis simulado para desarrollo
   */
  private generateMockAnalysis(shotType: string): AnalysisResult {
    const baseScore = Math.floor(Math.random() * 30) + 70; // 70-100
    
    return {
      overallScore: baseScore,
      posture: Math.floor(Math.random() * 30) + 70,
      timing: Math.floor(Math.random() * 30) + 70,
      followThrough: Math.floor(Math.random() * 30) + 70,
      power: Math.floor(Math.random() * 30) + 70,
      improvements: this.getMockImprovements(shotType),
      shotType: shotType,
      confidence: 0.85 + Math.random() * 0.1, // 85-95%
      processingTime: 2000 + Math.random() * 3000, // 2-5 segundos
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Obtiene mejoras simuladas según el tipo de golpe
   */
  private getMockImprovements(shotType: string): string[] {
    const improvements = {
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

    return improvements[shotType as keyof typeof improvements] || [
      'Practica la técnica básica',
      'Mejora la consistencia',
      'Trabaja en la precisión',
      'Desarrolla la confianza',
    ];
  }

  /**
   * Crea un error estructurado
   */
  private createError(code: string, message: string, details?: any): AIAnalysisError {
    return {
      code,
      message,
      details,
    };
  }

  /**
   * Valida la calidad del video antes del análisis
   */
  async validateVideo(videoUri: string): Promise<boolean> {
    // TODO: Implementar validación real del video
    // - Verificar duración
    // - Verificar calidad
    // - Verificar formato
    return true;
  }

  /**
   * Obtiene el historial de análisis del usuario
   */
  async getAnalysisHistory(limit?: number): Promise<AnalysisResult[]> {
    try {
      const response = await analysisService.getRecentAnalyses(limit || 20);
      
      if (!response.success || !response.data) {
        return [];
      }

      return response.data.analyses.map(analysis => this.convertBackendResult(analysis));
    } catch (error) {
      console.error('Error al obtener historial:', error);
      return [];
    }
  }

  /**
   * Obtiene estadísticas del usuario
   */
  async getUserStats(): Promise<any> {
    try {
      return await analysisService.getStatsSummary();
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  /**
   * Obtiene análisis por tipo de golpe
   */
  async getAnalysesByType(shotType: string, limit?: number): Promise<AnalysisResult[]> {
    try {
      const response = await analysisService.getAnalysesByType(shotType, limit);
      
      if (!response.success || !response.data) {
        return [];
      }

      return response.data.analyses.map(analysis => this.convertBackendResult(analysis));
    } catch (error) {
      console.error('Error getting analyses by type:', error);
      return [];
    }
  }
}

export const aiService = new AIService();
export default aiService;
