import { API_CONFIG, AUTH_CONFIG } from '../config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
  error?: string;
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
  status?: number;
}

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.defaultHeaders = API_CONFIG.DEFAULT_HEADERS;
  }

  private createTimeoutSignal(timeout: number): AbortSignal {
    // Compatibility wrapper for AbortSignal.timeout
    if (typeof AbortSignal.timeout === 'function') {
      return AbortSignal.timeout(timeout);
    } else {
      // Fallback for environments that don't support AbortSignal.timeout
      const controller = new AbortController();
      setTimeout(() => controller.abort(), timeout);
      return controller.signal;
    }
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getAuthToken();
    const headers = { ...this.defaultHeaders };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const contentType = response.headers.get('content-type');
      let responseData: any;

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        throw {
          success: false,
          message: responseData.message || `HTTP Error: ${response.status}`,
          status: response.status,
          ...responseData
        };
      }

      return responseData;
    } catch (error: any) {
      if (error.status) {
        throw error;
      }
      throw {
        success: false,
        message: 'Network error or invalid response',
        code: 'NETWORK_ERROR'
      };
    }
  }

  private async handleRetry<T>(
    requestFn: () => Promise<Response>,
    retries: number = API_CONFIG.REQUEST_CONFIG.RETRY_ATTEMPTS
  ): Promise<ApiResponse<T>> {
    try {
      const response = await requestFn();
      return await this.handleResponse<T>(response);
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error)) {
        await this.delay(API_CONFIG.REQUEST_CONFIG.RETRY_DELAY);
        return this.handleRetry<T>(requestFn, retries - 1);
      }
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    if (!error.status) return true; // Network errors
    return error.status >= 500 || error.status === 429; // Server errors or rate limit
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async get<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = new URL(endpoint, this.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers = await this.getAuthHeaders();

    return this.handleRetry<T>(
      () => fetch(url.toString(), {
        method: 'GET',
        headers: { ...headers, ...options?.headers },
        signal: this.createTimeoutSignal(API_CONFIG.REQUEST_CONFIG.TIMEOUT),
        ...options
      })
    );
  }

  async post<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getAuthHeaders();

    let body: string | FormData;
    let requestHeaders = { ...headers, ...options?.headers };

    if (data instanceof FormData) {
      body = data;
      // Remove Content-Type to let browser set it with boundary
      delete (requestHeaders as any)['Content-Type'];
    } else {
      body = JSON.stringify(data);
    }

    return this.handleRetry<T>(
      () => fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body,
        signal: this.createTimeoutSignal(API_CONFIG.REQUEST_CONFIG.TIMEOUT),
        ...options
      })
    );
  }

  async put<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getAuthHeaders();

    return this.handleRetry<T>(
      () => fetch(url, {
        method: 'PUT',
        headers: { ...headers, ...options?.headers },
        body: JSON.stringify(data),
        signal: this.createTimeoutSignal(API_CONFIG.REQUEST_CONFIG.TIMEOUT),
        ...options
      })
    );
  }

  async delete<T = any>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getAuthHeaders();

    return this.handleRetry<T>(
      () => fetch(url, {
        method: 'DELETE',
        headers: { ...headers, ...options?.headers },
        signal: this.createTimeoutSignal(API_CONFIG.REQUEST_CONFIG.TIMEOUT),
        ...options
      })
    );
  }

  async uploadFile<T = any>(
    endpoint: string,
    file: any,
    additionalData?: Record<string, any>,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getAuthHeaders();
    
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    // Remove Content-Type to let browser set it with boundary
    const requestHeaders = { ...headers };
    delete requestHeaders['Content-Type'];

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', async () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } else {
            const error = JSON.parse(xhr.responseText);
            reject({
              success: false,
              message: error.message || `HTTP Error: ${xhr.status}`,
              status: xhr.status,
              ...error
            });
          }
        } catch (e) {
          reject({
            success: false,
            message: 'Invalid response format',
            code: 'PARSE_ERROR'
          });
        }
      });

      xhr.addEventListener('error', () => {
        reject({
          success: false,
          message: 'Network error during upload',
          code: 'NETWORK_ERROR'
        });
      });

      xhr.addEventListener('timeout', () => {
        reject({
          success: false,
          message: 'Upload timeout',
          code: 'TIMEOUT_ERROR'
        });
      });

      xhr.open('POST', url);
      
      // Set headers
      Object.entries(requestHeaders).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      
      xhr.timeout = API_CONFIG.REQUEST_CONFIG.TIMEOUT;
      xhr.send(formData);
    });
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl.replace('/api', '')}/health`, {
        method: 'GET',
        signal: this.createTimeoutSignal(5000)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;