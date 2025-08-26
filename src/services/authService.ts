import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, ApiResponse } from './apiClient';
import { API_CONFIG, AUTH_CONFIG } from '../config/apiConfig';

export interface User {
  _id: string;
  name: string;
  email: string;
  profile?: {
    level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    favoriteShot?: string;
    experience?: number;
    totalAnalyses?: number;
    averageScore?: number;
  };
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  profile?: {
    level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    favoriteShot?: string;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export class AuthService {
  private currentUser: User | null = null;
  private tokenExpiryTimer: NodeJS.Timeout | null = null;

  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>(
        API_CONFIG.AUTH.LOGIN,
        credentials
      );

      if (response.success && response.data) {
        await this.storeAuthData(response.data);
        this.currentUser = response.data.user;
        this.setupTokenRefresh(response.data.token);
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>(
        API_CONFIG.AUTH.REGISTER,
        userData
      );

      if (response.success && response.data) {
        await this.storeAuthData(response.data);
        this.currentUser = response.data.user;
        this.setupTokenRefresh(response.data.token);
      }

      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint
      await apiClient.post(API_CONFIG.AUTH.LOGOUT);
    } catch (error) {
      console.warn('Backend logout error:', error);
    } finally {
      // Always clear local data
      await this.clearAuthData();
      this.currentUser = null;
      this.clearTokenRefreshTimer();
    }
  }

  async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>(
        API_CONFIG.AUTH.REFRESH
      );

      if (response.success && response.data) {
        await this.storeAuthData(response.data);
        this.currentUser = response.data.user;
        this.setupTokenRefresh(response.data.token);
      }

      return response;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      await this.logout();
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    try {
      // Check if this is a guest user first - avoid API calls for guests
      const isGuest = await this.isGuestUser();
      const userData = await AsyncStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.USER_DATA);
      
      if (isGuest && userData) {
        // Return guest user data without any API call
        this.currentUser = JSON.parse(userData);
        return this.currentUser;
      }

      // Only make API call for non-guest users
      if (!isGuest) {
        const response = await apiClient.get<{ user: User }>(API_CONFIG.AUTH.ME);
        
        if (response.success && response.data) {
          this.currentUser = response.data.user;
          return this.currentUser;
        }
      }
    } catch (error) {
      // Double-check if it's a guest user before logging error
      const isGuest = await this.isGuestUser();
      const userData = await AsyncStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.USER_DATA);
      
      if (isGuest && userData) {
        // Return guest user even if somehow we got here
        this.currentUser = JSON.parse(userData);
        return this.currentUser;
      }
      
      // Only log error for non-guest users
      if (!isGuest) {
        console.error('Get current user error:', error);
        await this.clearAuthData();
      }
    }

    return null;
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.post('/auth/forgot-password', data);
  }

  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.post('/auth/reset-password', data);
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
      
      if (!token) {
        return false;
      }

      // Check if token is expired
      if (this.isTokenExpired(token)) {
        try {
          await this.refreshToken();
          return true;
        } catch (error) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Authentication check error:', error);
      return false;
    }
  }

  async initializeAuth(): Promise<User | null> {
    try {
      const isAuth = await this.isAuthenticated();
      
      if (isAuth) {
        const user = await this.getCurrentUser();
        if (user) {
          const token = await AsyncStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
          if (token) {
            this.setupTokenRefresh(token);
          }
        }
        return user;
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    }

    return null;
  }

  private async storeAuthData(authData: AuthResponse): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN, authData.token],
        [AUTH_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(authData.user)],
        [AUTH_CONFIG.STORAGE_KEYS.LAST_LOGIN, new Date().toISOString()]
      ]);
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  }

  private async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
        AUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
        AUTH_CONFIG.STORAGE_KEYS.USER_DATA,
        AUTH_CONFIG.STORAGE_KEYS.LAST_LOGIN,
        'IS_GUEST_USER'
      ]);
      this.currentUser = null;
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  private setupTokenRefresh(token: string): void {
    if (!AUTH_CONFIG.AUTO_REFRESH) return;

    // Clear existing timer
    this.clearTokenRefreshTimer();

    try {
      // Decode JWT payload to get expiration time
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilRefresh = expiryTime - currentTime - (AUTH_CONFIG.REFRESH_THRESHOLD * 1000);

      if (timeUntilRefresh > 0) {
        this.tokenExpiryTimer = setTimeout(() => {
          this.refreshToken().catch(error => {
            console.error('Auto token refresh failed:', error);
          });
        }, timeUntilRefresh);
      }
    } catch (error) {
      console.error('Error setting up token refresh:', error);
    }
  }

  private clearTokenRefreshTimer(): void {
    if (this.tokenExpiryTimer) {
      clearTimeout(this.tokenExpiryTimer);
      this.tokenExpiryTimer = null;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true; // Assume expired if can't parse
    }
  }

  getCurrentUserSync(): User | null {
    return this.currentUser;
  }

  async loginAsGuest(): Promise<User> {
    // Crear un usuario invitado temporal
    const guestUser: User = {
      _id: 'guest-' + Date.now(),
      name: 'Usuario Invitado',
      email: 'guest@padeltech.com',
      profile: {
        level: 'beginner',
        favoriteShot: 'derecha',
        experience: 0,
        totalAnalyses: 0,
        averageScore: 0,
      },
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    this.currentUser = guestUser;
    
    // Guardar en AsyncStorage como invitado
    await AsyncStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(guestUser));
    await AsyncStorage.setItem('IS_GUEST_USER', 'true');

    return guestUser;
  }

  async isGuestUser(): Promise<boolean> {
    try {
      const isGuest = await AsyncStorage.getItem('IS_GUEST_USER');
      return isGuest === 'true';
    } catch (error) {
      return false;
    }
  }

  async clearAllData(): Promise<void> {
    await this.clearAuthData();
    console.log('All user data cleared');
  }
}

export const authService = new AuthService();
export default authService;