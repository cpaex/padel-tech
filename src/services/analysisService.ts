import { apiClient, ApiResponse } from './apiClient';
import { API_CONFIG } from '../config/apiConfig';

export interface AnalysisResult {
  _id: string;
  userId: string;
  shotType: 'derecha' | 'reves' | 'volea' | 'saque' | 'bandeja' | 'vibora' | 'remate';
  results: {
    overallScore: number;
    posture: number;
    timing: number;
    followThrough: number;
    power: number;
  };
  video: {
    url: string;
    thumbnail?: string;
    duration?: number;
    size?: number;
  };
  improvements: string[];
  status: 'processing' | 'completed' | 'failed' | 'reviewed';
  metadata?: Record<string, any>;
  userNotes?: string;
  tags?: string[];
  comparison?: {
    previousScore: number;
    improvement: number;
    trend: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnalysisRequest {
  shotType: string;
  results: {
    overallScore: number;
    posture: number;
    timing: number;
    followThrough: number;
    power: number;
  };
  video: {
    url: string;
    thumbnail?: string;
    duration?: number;
    size?: number;
  };
  improvements: string[];
  metadata?: Record<string, any>;
  userNotes?: string;
}

export interface UpdateAnalysisRequest {
  results?: {
    overallScore?: number;
    posture?: number;
    timing?: number;
    followThrough?: number;
    power?: number;
  };
  improvements?: string[];
  status?: 'processing' | 'completed' | 'failed' | 'reviewed';
  userNotes?: string;
  tags?: string[];
}

export interface AnalysisListParams {
  page?: number;
  limit?: number;
  shotType?: string;
  status?: string;
  sortBy?: 'createdAt' | 'overallScore' | 'shotType';
  sortOrder?: 'asc' | 'desc';
}

export interface AnalysisListResponse {
  analyses: AnalysisResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: {
    totalAnalyses: number;
    averageScore: number;
    bestScore: number;
    shotTypeDistribution: Record<string, number>;
  };
}

export interface AnalysisStats {
  shotTypeStats: Array<{
    shotType: string;
    count: number;
    averageScore: number;
    bestScore: number;
    recentScores: Array<{
      score: number;
      date: string;
    }>;
  }>;
  overallTrend: 'improving' | 'stable' | 'declining';
  totalAnalyses: number;
}

export interface ProgressData {
  period: 'week' | 'month' | 'quarter' | 'year';
  startDate: string;
  progress: Array<{
    period: string;
    count: number;
    averageScore: number;
    totalScore: number;
  }>;
}

export class AnalysisService {
  async createAnalysis(data: CreateAnalysisRequest): Promise<ApiResponse<{ analysis: AnalysisResult }>> {
    try {
      return await apiClient.post<{ analysis: AnalysisResult }>(
        API_CONFIG.ANALYSIS.CREATE,
        data
      );
    } catch (error) {
      console.error('Create analysis error:', error);
      throw error;
    }
  }

  async getAnalyses(params?: AnalysisListParams): Promise<ApiResponse<AnalysisListResponse>> {
    try {
      return await apiClient.get<AnalysisListResponse>(
        API_CONFIG.ANALYSIS.LIST,
        params
      );
    } catch (error) {
      console.error('Get analyses error:', error);
      throw error;
    }
  }

  async getAnalysis(id: string): Promise<ApiResponse<{ analysis: AnalysisResult }>> {
    try {
      return await apiClient.get<{ analysis: AnalysisResult }>(
        API_CONFIG.ANALYSIS.GET(id)
      );
    } catch (error) {
      console.error('Get analysis error:', error);
      throw error;
    }
  }

  async updateAnalysis(id: string, data: UpdateAnalysisRequest): Promise<ApiResponse<{ analysis: AnalysisResult }>> {
    try {
      return await apiClient.put<{ analysis: AnalysisResult }>(
        API_CONFIG.ANALYSIS.UPDATE(id),
        data
      );
    } catch (error) {
      console.error('Update analysis error:', error);
      throw error;
    }
  }

  async deleteAnalysis(id: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete<void>(
        API_CONFIG.ANALYSIS.DELETE(id)
      );
    } catch (error) {
      console.error('Delete analysis error:', error);
      throw error;
    }
  }

  async getStatsSummary(): Promise<ApiResponse<AnalysisStats>> {
    try {
      return await apiClient.get<AnalysisStats>(
        API_CONFIG.ANALYSIS.STATS_SUMMARY
      );
    } catch (error) {
      console.error('Get stats summary error:', error);
      throw error;
    }
  }

  async getProgress(period?: 'week' | 'month' | 'quarter' | 'year'): Promise<ApiResponse<ProgressData>> {
    try {
      const params = period ? { period } : undefined;
      return await apiClient.get<ProgressData>(
        API_CONFIG.ANALYSIS.STATS_PROGRESS,
        params
      );
    } catch (error) {
      console.error('Get progress error:', error);
      throw error;
    }
  }

  async getAnalysesByType(shotType: string, limit?: number): Promise<ApiResponse<AnalysisListResponse>> {
    try {
      return await this.getAnalyses({
        shotType,
        limit: limit || 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
    } catch (error) {
      console.error('Get analyses by type error:', error);
      throw error;
    }
  }

  async getRecentAnalyses(limit: number = 10): Promise<ApiResponse<AnalysisListResponse>> {
    try {
      return await this.getAnalyses({
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
    } catch (error) {
      console.error('Get recent analyses error:', error);
      throw error;
    }
  }

  async getBestAnalyses(limit: number = 10): Promise<ApiResponse<AnalysisListResponse>> {
    try {
      return await this.getAnalyses({
        limit,
        sortBy: 'overallScore',
        sortOrder: 'desc'
      });
    } catch (error) {
      console.error('Get best analyses error:', error);
      throw error;
    }
  }

  async searchAnalyses(query: string): Promise<ApiResponse<AnalysisListResponse>> {
    try {
      // Implement search based on notes, tags, or shot type
      const searchParams: AnalysisListParams = {
        // This would need backend support for text search
      };
      
      // For now, we'll search by shot type if the query matches
      const shotTypes = ['derecha', 'reves', 'volea', 'saque', 'bandeja', 'vibora', 'remate'];
      const matchedShotType = shotTypes.find(type => 
        type.toLowerCase().includes(query.toLowerCase())
      );
      
      if (matchedShotType) {
        searchParams.shotType = matchedShotType;
      }

      return await this.getAnalyses(searchParams);
    } catch (error) {
      console.error('Search analyses error:', error);
      throw error;
    }
  }

  // Utility methods
  calculateScoreImprovement(currentScore: number, previousScore: number): number {
    if (previousScore === 0) return 0;
    return Math.round(((currentScore - previousScore) / previousScore) * 100);
  }

  getScoreColor(score: number): string {
    if (score >= 90) return '#4CAF50'; // Green
    if (score >= 80) return '#8BC34A'; // Light green
    if (score >= 70) return '#FFC107'; // Yellow
    if (score >= 60) return '#FF9800'; // Orange
    return '#F44336'; // Red
  }

  getScoreDescription(score: number): string {
    if (score >= 90) return 'Excelente';
    if (score >= 80) return 'Muy bueno';
    if (score >= 70) return 'Bueno';
    if (score >= 60) return 'Regular';
    return 'Necesita mejora';
  }

  formatShotType(shotType: string): string {
    const translations: Record<string, string> = {
      derecha: 'Derecha',
      reves: 'Revés',
      volea: 'Volea',
      saque: 'Saque',
      bandeja: 'Bandeja',
      vibora: 'Víbora',
      remate: 'Remate'
    };
    return translations[shotType] || shotType;
  }
}

export const analysisService = new AnalysisService();
export default analysisService;