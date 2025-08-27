// Service exports for easy importing
export { apiClient } from './apiClient';
export { authService } from './authService';
export { analysisService } from './analysisService';
export { videoService } from './videoService';
export { userService } from './userService';
export { statsService } from './statsService';
export { aiService } from './aiService';
export { VideoStorageService } from './videoStorageService';

// Type exports
export type { ApiResponse, ApiError } from './apiClient';
export type { User, LoginRequest, RegisterRequest, AuthResponse } from './authService';
export type { AnalysisResult, CreateAnalysisRequest, UpdateAnalysisRequest } from './analysisService';
export type { VideoFile, VideoUploadOptions, VideoValidationResult } from './videoService';
export type { UserProfile, UserStats, UserSettings } from './userService';
export type { StatsOverview, PerformanceStats, ComparisonStats } from './statsService';
export type { AnalysisRequest, AnalysisResult as AIAnalysisResult } from './aiService';
export type { StoredVideo, VideoMetadata } from './videoStorageService';