import axios from 'axios';
import { getToken, storeAuth, shouldRefreshToken, clearAuth } from './auth';
import { LoginResponse, AttendanceRecord, Employee } from '../types/attendance';
import { API_BASE_URL } from '../config/api';

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Retry wrapper with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries
 * @param baseDelay Base delay in milliseconds
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[API] Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request logging
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Function to refresh the token
async function refreshToken(): Promise<string | null> {
  if (isRefreshing) {
    return refreshPromise;
  }
  
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const currentToken = await getToken();
      if (!currentToken) return null;
      
      console.log('[API] Attempting to refresh token...');
      const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      
      const { token, employee } = response.data;
      await storeAuth(token, employee);
      console.log('[API] Token refreshed successfully');
      return token;
    } catch (error) {
      console.error('[API] Token refresh failed:', error);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  
  return refreshPromise;
}

// Add response/error logging with token refresh
api.interceptors.response.use(
  (response) => {
    console.log(`[API] ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If we got a 401 and haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const newToken = await refreshToken();
      if (newToken) {
        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } else {
        // Token refresh failed, clear auth
        await clearAuth();
      }
    }
    
    console.error('[API] Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

export interface RegisterResponse {
  message: string;
  email: string;
}

export const authAPI = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },
  
  register: async (name: string, email: string, password: string): Promise<RegisterResponse> => {
    const response = await api.post('/api/auth/register', { name, email, password });
    return response.data;
  },
  
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
  },
};

export const attendanceAPI = {
  recordScan: async (qrCode: string): Promise<{ success: boolean; record: AttendanceRecord }> => {
    const response = await api.post('/api/attendance', { qrCode });
    return response.data;
  },
  
  getMyAttendance: async (): Promise<AttendanceRecord[]> => {
    const response = await api.get('/api/attendance/me');
    return response.data;
  },
  
  updateAttendanceType: async (recordId: string, type: 'arrival' | 'departure'): Promise<{ success: boolean; record: AttendanceRecord }> => {
    const response = await api.put(`/api/attendance/${recordId}`, { type });
    return response.data;
  },
  
  deleteAttendance: async (recordId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/api/attendance/${recordId}`);
    return response.data;
  },
  
  getPendingDeparture: async (): Promise<{ pending: boolean; record?: AttendanceRecord }> => {
    const response = await api.get('/api/attendance/pending-departure');
    return response.data;
  },
  
  confirmDeparture: async (recordId: string): Promise<{ success: boolean; record: AttendanceRecord }> => {
    const response = await api.post(`/api/attendance/confirm-departure/${recordId}`);
    return response.data;
  },
};

export interface EmployeeStats {
  hours: number;
  payment: number;
}

export interface AdminEmployee {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  hourlyRate: number;
  emailVerified: boolean;
  createdAt: string;
  today: EmployeeStats;
  week: EmployeeStats;
  month: EmployeeStats;
}

export interface AdminStats {
  employees: { total: number; verified: number };
  today: { scans: number; hours: number; payment: number };
  week: { scans: number; hours: number; payment: number };
  month: { scans: number; hours: number; payment: number };
  recentActivity: AttendanceRecord[];
}

export const adminAPI = {
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get('/api/admin/stats');
    return response.data;
  },
  
  getEmployees: async (): Promise<AdminEmployee[]> => {
    const response = await api.get('/api/admin/employees');
    return response.data;
  },
  
  updateEmployee: async (id: string, data: { hourlyRate?: number; isAdmin?: boolean }) => {
    const response = await api.put(`/api/admin/employees/${id}`, data);
    return response.data;
  },
};

export default api;
