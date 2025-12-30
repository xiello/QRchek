export interface AttendanceRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  timestamp: string;
  type: 'arrival' | 'departure';
  qrCode: string;
}

export interface Employee {
  id: string;
  username: string;
  email: string;
  password: string; // hashed
  name: string;
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: string;
  createdAt: string;
  isAdmin?: boolean;
  hourlyRate?: number; // Default: 5 EUR
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  employee: {
    id: string;
    name: string;
    email: string;
    isAdmin?: boolean;
  };
}

