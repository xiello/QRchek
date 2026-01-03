import axios from 'axios';
import { AttendanceRecord } from '../types/attendance';

// In production, use relative URLs (same origin)
// In development, use localhost with same port (web served from server)
const API_BASE_URL = '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface LoginResponse {
  token: string;
  employee: {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
  };
}

export interface EmployeeStats {
  hours: number;
  payment: number;
}

export interface Employee {
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

export interface MissingDeparture {
  id: string;
  name: string;
  email: string;
  hourlyRate: number;
  lastArrival: string;
  status: 'missing';
}

export interface PendingConfirmation {
  id: string;
  employeeId: string;
  employeeName: string;
  email: string;
  hourlyRate: number;
  departureTime: string;
  status: 'pending_confirmation';
}

export interface Stats {
  employees: {
    total: number;
    verified: number;
    pending: number;
  };
  today: {
    scans: number;
    hours: number;
    payment: number;
  };
  week: {
    scans: number;
    hours: number;
    payment: number;
  };
  month: {
    scans: number;
    hours: number;
    payment: number;
  };
  recentActivity: AttendanceRecord[];
}

export const authAPI = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },
};

export const attendanceAPI = {
  getAllAttendance: async (): Promise<AttendanceRecord[]> => {
    const response = await api.get('/api/attendance');
    return response.data;
  },
};

export const adminAPI = {
  getEmployees: async (): Promise<Employee[]> => {
    const response = await api.get('/api/admin/employees');
    return response.data;
  },
  
  updateEmployee: async (id: string, data: { hourlyRate?: number; isAdmin?: boolean; emailVerified?: boolean }) => {
    const response = await api.put(`/api/admin/employees/${id}`, data);
    return response.data;
  },
  
  verifyEmployee: async (id: string) => {
    const response = await api.post(`/api/admin/employees/${id}/verify`);
    return response.data;
  },
  
  getStats: async (): Promise<Stats> => {
    const response = await api.get('/api/admin/stats');
    return response.data;
  },
  
  getExportURL: (period?: string, employeeId?: string, type?: string) => {
    let url = `${API_BASE_URL}/api/admin/export`;
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (employeeId) params.append('employeeId', employeeId);
    if (type) params.append('type', type);
    if (params.toString()) url += `?${params.toString()}`;
    return url;
  },
  
  getMissingDepartures: async (): Promise<MissingDeparture[]> => {
    const response = await api.get('/api/admin/missing-departures');
    return response.data;
  },
  
  getPendingConfirmations: async (): Promise<PendingConfirmation[]> => {
    const response = await api.get('/api/admin/pending-confirmations');
    return response.data;
  },
  
  triggerAutoCheckout: async (): Promise<{ success: boolean; processed: number; employees: string[] }> => {
    const response = await api.post('/api/admin/auto-checkout');
    return response.data;
  },
  
  deleteEmployee: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/api/admin/employees/${id}`);
    return response.data;
  }
};

export default api;
