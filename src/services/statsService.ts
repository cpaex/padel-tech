import { apiClient, ApiResponse } from './apiClient';
import { API_CONFIG } from '../config/apiConfig';

export interface StatsOverview {
  totalUsers: number;
  totalAnalyses: number;
  averageScore: number;
  totalVideos: number;
  popularShotTypes: Array<{
    shotType: string;
    count: number;
    percentage: number;
  }>;
  userGrowth: Array<{
    period: string;
    newUsers: number;
    totalUsers: number;
  }>;
  analysisGrowth: Array<{
    period: string;
    newAnalyses: number;
    totalAnalyses: number;
  }>;
  topScores: Array<{
    userId: string;
    userName: string;
    shotType: string;
    score: number;
    date: string;
  }>;
}

export interface PerformanceStats {
  user: {
    totalAnalyses: number;
    averageScore: number;
    bestScore: number;
    improvementRate: number;
    rank: number;
    percentile: number;
  };
  shotTypes: Array<{
    shotType: string;
    count: number;
    averageScore: number;
    bestScore: number;
    trend: 'improving' | 'stable' | 'declining';
    rank: number;
    comparison: {
      vsGlobalAverage: number;
      vsLevelAverage: number;
    };
  }>;
  timeAnalysis: {
    bestTimeOfDay: string;
    bestDayOfWeek: string;
    consistency: number;
    streaks: {
      current: number;
      longest: number;
    };
  };
  progress: Array<{
    period: string;
    analyses: number;
    averageScore: number;
    improvement: number;
  }>;
}

export interface ComparisonStats {
  user: {
    totalAnalyses: number;
    averageScore: number;
    level: string;
  };
  comparisons: {
    globalAverage: {
      averageScore: number;
      difference: number;
      percentile: number;
    };
    levelAverage: {
      averageScore: number;
      difference: number;
      percentile: number;
    };
    similarUsers: Array<{
      userId: string;
      userName: string;
      averageScore: number;
      totalAnalyses: number;
      similarity: number;
    }>;
  };
  shotTypeComparisons: Array<{
    shotType: string;
    userScore: number;
    globalAverage: number;
    levelAverage: number;
    userRank: number;
    improvement: number;
  }>;
  trends: Array<{
    period: string;
    userScore: number;
    globalAverage: number;
    levelAverage: number;
  }>;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf';
  dateFrom?: string;
  dateTo?: string;
  includeVideos?: boolean;
  shotTypes?: string[];
  includePersonalData?: boolean;
}

export interface ExportResult {
  downloadUrl: string;
  expiresAt: string;
  filename: string;
  size: number;
  format: string;
}

export class StatsService {
  async getOverview(): Promise<ApiResponse<StatsOverview>> {
    try {
      return await apiClient.get<StatsOverview>(
        API_CONFIG.STATS.OVERVIEW
      );
    } catch (error) {
      console.error('Get overview stats error:', error);
      throw error;
    }
  }

  async getPerformanceStats(
    period?: 'week' | 'month' | 'quarter' | 'year'
  ): Promise<ApiResponse<PerformanceStats>> {
    try {
      const params = period ? { period } : undefined;
      return await apiClient.get<PerformanceStats>(
        API_CONFIG.STATS.PERFORMANCE,
        params
      );
    } catch (error) {
      console.error('Get performance stats error:', error);
      throw error;
    }
  }

  async getComparisonStats(): Promise<ApiResponse<ComparisonStats>> {
    try {
      return await apiClient.get<ComparisonStats>(
        API_CONFIG.STATS.COMPARISON
      );
    } catch (error) {
      console.error('Get comparison stats error:', error);
      throw error;
    }
  }

  async exportStats(options: ExportOptions): Promise<ApiResponse<ExportResult>> {
    try {
      return await apiClient.post<ExportResult>(
        API_CONFIG.STATS.EXPORT,
        options
      );
    } catch (error) {
      console.error('Export stats error:', error);
      throw error;
    }
  }

  async getLeaderboard(
    shotType?: string,
    period?: 'week' | 'month' | 'all',
    limit?: number
  ): Promise<ApiResponse<Array<{
    rank: number;
    userId: string;
    userName: string;
    averageScore: number;
    totalAnalyses: number;
    level: string;
  }>>> {
    try {
      const params: any = {};
      if (shotType) params.shotType = shotType;
      if (period) params.period = period;
      if (limit) params.limit = limit;

      return await apiClient.get('/stats/leaderboard', params);
    } catch (error) {
      console.error('Get leaderboard error:', error);
      throw error;
    }
  }

  async getUserRanking(shotType?: string): Promise<ApiResponse<{
    globalRank: number;
    totalUsers: number;
    percentile: number;
    levelRank: number;
    levelUsers: number;
    levelPercentile: number;
  }>> {
    try {
      const params = shotType ? { shotType } : undefined;
      return await apiClient.get('/stats/ranking', params);
    } catch (error) {
      console.error('Get user ranking error:', error);
      throw error;
    }
  }

  // Utility methods for data processing
  calculateTrend(data: Array<{ period: string; value: number }>): {
    trend: 'improving' | 'stable' | 'declining';
    rate: number;
    description: string;
  } {
    if (data.length < 2) {
      return {
        trend: 'stable',
        rate: 0,
        description: 'Sin datos suficientes'
      };
    }

    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const rate = ((lastValue - firstValue) / firstValue) * 100;

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    let description = 'Rendimiento estable';

    if (rate > 5) {
      trend = 'improving';
      description = `Mejorando ${Math.abs(rate).toFixed(1)}%`;
    } else if (rate < -5) {
      trend = 'declining';
      description = `Declinando ${Math.abs(rate).toFixed(1)}%`;
    }

    return { trend, rate: Math.round(rate * 100) / 100, description };
  }

  formatScore(score: number): string {
    return Math.round(score * 10) / 10 + '';
  }

  formatRank(rank: number, total: number): string {
    const suffix = this.getOrdinalSuffix(rank);
    return `${rank}${suffix} de ${total}`;
  }

  formatPercentile(percentile: number): string {
    return `Top ${Math.round(100 - percentile)}%`;
  }

  getScoreColor(score: number): string {
    if (score >= 90) return '#4CAF50'; // Green
    if (score >= 80) return '#8BC34A'; // Light green
    if (score >= 70) return '#FFC107'; // Yellow
    if (score >= 60) return '#FF9800'; // Orange
    return '#F44336'; // Red
  }

  getTrendColor(trend: 'improving' | 'stable' | 'declining'): string {
    switch (trend) {
      case 'improving': return '#4CAF50';
      case 'declining': return '#F44336';
      default: return '#757575';
    }
  }

  getTrendIcon(trend: 'improving' | 'stable' | 'declining'): string {
    switch (trend) {
      case 'improving': return '↗️';
      case 'declining': return '↘️';
      default: return '➡️';
    }
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

  formatLevel(level: string): string {
    const translations: Record<string, string> = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      expert: 'Experto'
    };
    return translations[level] || level;
  }

  private getOrdinalSuffix(n: number): string {
    if (n % 100 >= 11 && n % 100 <= 13) {
      return 'º';
    }
    switch (n % 10) {
      case 1: return 'º';
      case 2: return 'º';
      case 3: return 'º';
      default: return 'º';
    }
  }

  // Chart data helpers
  prepareChartData(
    data: Array<{ period: string; value: number }>,
    label: string
  ): {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      tension: number;
    }>;
  } {
    return {
      labels: data.map(d => d.period),
      datasets: [{
        label,
        data: data.map(d => d.value),
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        tension: 0.4
      }]
    };
  }

  prepareComparisonChartData(
    userData: Array<{ period: string; value: number }>,
    globalData: Array<{ period: string; value: number }>,
    userLabel: string = 'Tu rendimiento',
    globalLabel: string = 'Promedio global'
  ): {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      tension: number;
    }>;
  } {
    return {
      labels: userData.map(d => d.period),
      datasets: [
        {
          label: userLabel,
          data: userData.map(d => d.value),
          borderColor: '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0.4
        },
        {
          label: globalLabel,
          data: globalData.map(d => d.value),
          borderColor: '#FF9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          tension: 0.4
        }
      ]
    };
  }
}

export const statsService = new StatsService();
export default statsService;