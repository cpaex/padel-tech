import { apiClient, ApiResponse } from './apiClient';
import { API_CONFIG } from '../config/apiConfig';
import { User } from './authService';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  profile: {
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    favoriteShot: string;
    experience: number;
    totalAnalyses: number;
    averageScore: number;
    bestScore: number;
    improvementRate: number;
    joinedDate: string;
    lastActivity: string;
    achievements: string[];
    goals: {
      targetScore?: number;
      targetAnalyses?: number;
      focusArea?: string;
    };
    preferences: {
      notifications: boolean;
      language: string;
      units: 'metric' | 'imperial';
      privacy: 'public' | 'private';
    };
  };
  stats: {
    totalSessions: number;
    totalHours: number;
    favoriteTime: string;
    consistency: number;
    shotTypeStats: Record<string, {
      count: number;
      averageScore: number;
      bestScore: number;
      trend: 'improving' | 'stable' | 'declining';
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  profile?: {
    level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    favoriteShot?: string;
    goals?: {
      targetScore?: number;
      targetAnalyses?: number;
      focusArea?: string;
    };
    preferences?: {
      notifications?: boolean;
      language?: string;
      units?: 'metric' | 'imperial';
      privacy?: 'public' | 'private';
    };
  };
}

export interface UserStats {
  totalAnalyses: number;
  averageScore: number;
  bestScore: number;
  improvementRate: number;
  currentStreak: number;
  longestStreak: number;
  totalHours: number;
  favoriteShot: string;
  recentActivity: Array<{
    date: string;
    analysesCount: number;
    averageScore: number;
  }>;
  shotTypeBreakdown: Record<string, {
    count: number;
    percentage: number;
    averageScore: number;
    trend: string;
  }>;
  monthlyProgress: Array<{
    month: string;
    analyses: number;
    averageScore: number;
    improvement: number;
  }>;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: string;
    category: 'score' | 'consistency' | 'improvement' | 'variety';
  }>;
}

export interface UserSettings {
  notifications: {
    analysisComplete: boolean;
    weeklyReport: boolean;
    achievementUnlocked: boolean;
    reminderToAnalyze: boolean;
  };
  privacy: {
    shareStats: boolean;
    publicProfile: boolean;
    allowComparisons: boolean;
  };
  preferences: {
    language: 'es' | 'en';
    units: 'metric' | 'imperial';
    theme: 'light' | 'dark' | 'auto';
    autoSave: boolean;
  };
  goals: {
    weeklyAnalyses?: number;
    targetScore?: number;
    focusArea?: string;
  };
}

export class UserService {
  async getProfile(): Promise<ApiResponse<{ user: UserProfile }>> {
    try {
      return await apiClient.get<{ user: UserProfile }>(
        API_CONFIG.USER.PROFILE
      );
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<{ user: UserProfile }>> {
    try {
      return await apiClient.put<{ user: UserProfile }>(
        API_CONFIG.USER.PROFILE,
        data
      );
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  async getStats(): Promise<ApiResponse<UserStats>> {
    try {
      return await apiClient.get<UserStats>(
        API_CONFIG.USER.STATS
      );
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  async getSettings(): Promise<ApiResponse<UserSettings>> {
    try {
      return await apiClient.get<UserSettings>(
        API_CONFIG.USER.SETTINGS
      );
    } catch (error) {
      console.error('Get settings error:', error);
      throw error;
    }
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    try {
      return await apiClient.put<UserSettings>(
        API_CONFIG.USER.SETTINGS,
        settings
      );
    } catch (error) {
      console.error('Update settings error:', error);
      throw error;
    }
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse<void>> {
    try {
      return await apiClient.put<void>(
        '/users/change-password',
        data
      );
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  async deleteAccount(password: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete<void>('/users/account', {
        body: JSON.stringify({ password }),
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  }

  async exportData(): Promise<ApiResponse<{ downloadUrl: string }>> {
    try {
      return await apiClient.get<{ downloadUrl: string }>(
        '/users/export-data'
      );
    } catch (error) {
      console.error('Export data error:', error);
      throw error;
    }
  }

  // Utility methods
  getLevelProgress(userProfile: UserProfile): {
    currentLevel: string;
    nextLevel: string | null;
    progress: number;
    analysesForNext: number;
  } {
    const levels = [
      { level: 'beginner', minAnalyses: 0, maxAnalyses: 10 },
      { level: 'intermediate', minAnalyses: 10, maxAnalyses: 50 },
      { level: 'advanced', minAnalyses: 50, maxAnalyses: 150 },
      { level: 'expert', minAnalyses: 150, maxAnalyses: Infinity }
    ];

    const currentLevel = userProfile.profile.level;
    const totalAnalyses = userProfile.profile.totalAnalyses;
    
    const currentLevelIndex = levels.findIndex(l => l.level === currentLevel);
    const currentLevelData = levels[currentLevelIndex];
    const nextLevelData = levels[currentLevelIndex + 1];

    if (!nextLevelData) {
      return {
        currentLevel: this.formatLevel(currentLevel),
        nextLevel: null,
        progress: 100,
        analysesForNext: 0
      };
    }

    const progress = Math.min(
      100,
      ((totalAnalyses - currentLevelData.minAnalyses) / 
       (nextLevelData.minAnalyses - currentLevelData.minAnalyses)) * 100
    );

    return {
      currentLevel: this.formatLevel(currentLevel),
      nextLevel: this.formatLevel(nextLevelData.level),
      progress: Math.round(progress),
      analysesForNext: Math.max(0, nextLevelData.minAnalyses - totalAnalyses)
    };
  }

  getScoreImprovement(userProfile: UserProfile): {
    improvement: number;
    trend: 'improving' | 'stable' | 'declining';
    description: string;
  } {
    const improvementRate = userProfile.profile.improvementRate || 0;
    
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    let description = 'Rendimiento estable';

    if (improvementRate > 5) {
      trend = 'improving';
      description = 'Mejorando consistentemente';
    } else if (improvementRate < -5) {
      trend = 'declining';
      description = 'Necesita más práctica';
    }

    return {
      improvement: Math.round(improvementRate * 100) / 100,
      trend,
      description
    };
  }

  getRecommendations(userProfile: UserProfile): Array<{
    type: 'focus_area' | 'goal' | 'practice';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }> {
    const recommendations = [];
    const stats = userProfile.stats;

    // Find weakest shot type
    const shotTypes = Object.entries(stats.shotTypeStats);
    if (shotTypes.length > 0) {
      const weakestShot = shotTypes.reduce((min, current) => 
        current[1].averageScore < min[1].averageScore ? current : min
      );

      if (weakestShot[1].averageScore < userProfile.profile.averageScore - 10) {
        recommendations.push({
          type: 'focus_area',
          title: `Mejorar ${this.formatShotType(weakestShot[0])}`,
          description: `Tu puntuación promedio en ${this.formatShotType(weakestShot[0])} es ${weakestShot[1].averageScore}, considera practicar más este golpe.`,
          priority: 'high'
        });
      }
    }

    // Consistency recommendation
    if (stats.consistency < 70) {
      recommendations.push({
        type: 'practice',
        title: 'Mejorar consistencia',
        description: 'Practica regularmente para mejorar tu consistencia en los análisis.',
        priority: 'medium'
      });
    }

    // Goal-based recommendations
    const targetScore = userProfile.profile.goals?.targetScore;
    if (targetScore && userProfile.profile.averageScore < targetScore) {
      const gap = targetScore - userProfile.profile.averageScore;
      recommendations.push({
        type: 'goal',
        title: 'Alcanzar objetivo de puntuación',
        description: `Te faltan ${Math.round(gap)} puntos para alcanzar tu objetivo de ${targetScore}.`,
        priority: gap > 20 ? 'high' : 'medium'
      });
    }

    return recommendations as Array<{
      type: 'focus_area' | 'goal' | 'practice';
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  }

  private formatLevel(level: string): string {
    const translations: Record<string, string> = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      expert: 'Experto'
    };
    return translations[level] || level;
  }

  private formatShotType(shotType: string): string {
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

  // Achievement system helpers
  checkNewAchievements(userProfile: UserProfile): Array<{
    id: string;
    name: string;
    description: string;
    category: string;
  }> {
    // This would check for new achievements based on user stats
    // Implementation would depend on your achievement system
    return [];
  }

  getNextAchievement(userProfile: UserProfile): {
    name: string;
    description: string;
    progress: number;
    requirement: string;
  } | null {
    // Return the next achievement the user is close to unlocking
    return null;
  }
}

export const userService = new UserService();
export default userService;