import { query, queryOne, execute } from '../db';
import { AttendanceRecord, Employee } from '../types/attendance';

// ==================== ATTENDANCE FUNCTIONS ====================

export async function readAttendance(): Promise<AttendanceRecord[]> {
  const rows = await query<any>(`
    SELECT id, employee_id as "employeeId", employee_name as "employeeName", 
           type, timestamp, '' as "qrCode"
    FROM attendance
    ORDER BY timestamp DESC
  `);
  return rows.map(row => ({
    ...row,
    timestamp: row.timestamp.toISOString(),
  }));
}

export async function addAttendance(record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> {
  const result = await queryOne<any>(`
    INSERT INTO attendance (employee_id, employee_name, type, timestamp)
    VALUES ($1, $2, $3, $4)
    RETURNING id, employee_id as "employeeId", employee_name as "employeeName", type, timestamp
  `, [record.employeeId, record.employeeName, record.type, record.timestamp]);
  
  return {
    ...result,
    timestamp: result.timestamp.toISOString(),
    qrCode: record.qrCode || '',
  };
}

export async function getAttendanceByEmployee(employeeId: string): Promise<AttendanceRecord[]> {
  const rows = await query<any>(`
    SELECT id, employee_id as "employeeId", employee_name as "employeeName", 
           type, timestamp, '' as "qrCode"
    FROM attendance
    WHERE employee_id = $1
    ORDER BY timestamp DESC
  `, [employeeId]);
  
  return rows.map(row => ({
    ...row,
    timestamp: row.timestamp.toISOString(),
  }));
}

export async function getLastAttendance(employeeId: string): Promise<AttendanceRecord | null> {
  const row = await queryOne<any>(`
    SELECT id, employee_id as "employeeId", employee_name as "employeeName", 
           type, timestamp, '' as "qrCode"
    FROM attendance
    WHERE employee_id = $1
    ORDER BY timestamp DESC
    LIMIT 1
  `, [employeeId]);
  
  if (!row) return null;
  
  return {
    ...row,
    timestamp: row.timestamp.toISOString(),
  };
}

export async function updateAttendanceType(recordId: string, newType: 'arrival' | 'departure'): Promise<AttendanceRecord | null> {
  const row = await queryOne<any>(`
    UPDATE attendance
    SET type = $1
    WHERE id = $2
    RETURNING id, employee_id as "employeeId", employee_name as "employeeName", type, timestamp
  `, [newType, recordId]);
  
  if (!row) return null;
  
  return {
    ...row,
    timestamp: row.timestamp.toISOString(),
    qrCode: '',
  };
}

export async function findAttendanceById(recordId: string): Promise<AttendanceRecord | null> {
  const row = await queryOne<any>(`
    SELECT id, employee_id as "employeeId", employee_name as "employeeName", 
           type, timestamp, '' as "qrCode"
    FROM attendance
    WHERE id = $1
  `, [recordId]);
  
  if (!row) return null;
  
  return {
    ...row,
    timestamp: row.timestamp.toISOString(),
  };
}

export async function deleteAttendance(recordId: string): Promise<boolean> {
  const result = await execute(`
    DELETE FROM attendance WHERE id = $1
  `, [recordId]);
  
  return result.rowCount > 0;
}

// ==================== EMPLOYEE FUNCTIONS ====================

export async function readEmployees(): Promise<Employee[]> {
  const rows = await query<any>(`
    SELECT id, name, email, password_hash as password, is_admin as "isAdmin", 
           hourly_rate as "hourlyRate", email_verified as "emailVerified",
           verification_token as "verificationToken", 
           verification_token_expires as "verificationTokenExpires",
           created_at as "createdAt"
    FROM employees
  `);
  
  return rows.map(row => ({
    ...row,
    username: row.email, // For backward compatibility
    isAdmin: row.isAdmin || false,
    hourlyRate: parseFloat(row.hourlyRate) || 5,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
    verificationTokenExpires: row.verificationTokenExpires?.toISOString(),
  }));
}

export async function findEmployeeById(id: string): Promise<Employee | null> {
  const row = await queryOne<any>(`
    SELECT id, name, email, password_hash as password, is_admin as "isAdmin", 
           hourly_rate as "hourlyRate", email_verified as "emailVerified",
           verification_token as "verificationToken", 
           verification_token_expires as "verificationTokenExpires",
           created_at as "createdAt"
    FROM employees
    WHERE id = $1
  `, [id]);
  
  if (!row) return null;
  
  return {
    ...row,
    username: row.email,
    isAdmin: row.isAdmin || false,
    hourlyRate: parseFloat(row.hourlyRate) || 5,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
    verificationTokenExpires: row.verificationTokenExpires?.toISOString(),
  };
}

export async function findEmployeeByEmail(email: string): Promise<Employee | null> {
  const row = await queryOne<any>(`
    SELECT id, name, email, password_hash as password, is_admin as "isAdmin", 
           hourly_rate as "hourlyRate", email_verified as "emailVerified",
           verification_token as "verificationToken", 
           verification_token_expires as "verificationTokenExpires",
           created_at as "createdAt"
    FROM employees
    WHERE LOWER(email) = LOWER($1)
  `, [email]);
  
  if (!row) return null;
  
  return {
    ...row,
    username: row.email,
    isAdmin: row.isAdmin || false,
    hourlyRate: parseFloat(row.hourlyRate) || 5,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
    verificationTokenExpires: row.verificationTokenExpires?.toISOString(),
  };
}

export async function findEmployeeByUsername(username: string): Promise<Employee | null> {
  // Username is now email for backward compatibility
  return findEmployeeByEmail(username);
}

export async function findEmployeeByVerificationToken(token: string): Promise<Employee | null> {
  const row = await queryOne<any>(`
    SELECT id, name, email, password_hash as password, is_admin as "isAdmin", 
           hourly_rate as "hourlyRate", email_verified as "emailVerified",
           verification_token as "verificationToken", 
           verification_token_expires as "verificationTokenExpires",
           created_at as "createdAt"
    FROM employees
    WHERE verification_token = $1
  `, [token]);
  
  if (!row) return null;
  
  return {
    ...row,
    username: row.email,
    isAdmin: row.isAdmin || false,
    hourlyRate: parseFloat(row.hourlyRate) || 5,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
    verificationTokenExpires: row.verificationTokenExpires?.toISOString(),
  };
}

export async function addEmployee(employee: Omit<Employee, 'id'> & { id?: string }): Promise<Employee> {
  const row = await queryOne<any>(`
    INSERT INTO employees (name, email, password_hash, is_admin, hourly_rate, email_verified, verification_token, verification_token_expires)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, name, email, password_hash as password, is_admin as "isAdmin", 
              hourly_rate as "hourlyRate", email_verified as "emailVerified",
              verification_token as "verificationToken",
              created_at as "createdAt"
  `, [
    employee.name,
    employee.email,
    employee.password,
    employee.isAdmin || false,
    employee.hourlyRate || 5,
    employee.emailVerified || false,
    employee.verificationToken || null,
    employee.verificationTokenExpires || null,
  ]);
  
  return {
    ...row,
    username: row.email,
    isAdmin: row.isAdmin || false,
    hourlyRate: parseFloat(row.hourlyRate) || 5,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
  };
}

export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee | null> {
  // Build dynamic update query
  const setClauses: string[] = [];
  const values: any[] = [];
  let paramCount = 1;
  
  if (updates.name !== undefined) {
    setClauses.push(`name = $${paramCount++}`);
    values.push(updates.name);
  }
  if (updates.email !== undefined) {
    setClauses.push(`email = $${paramCount++}`);
    values.push(updates.email);
  }
  if (updates.password !== undefined) {
    setClauses.push(`password_hash = $${paramCount++}`);
    values.push(updates.password);
  }
  if (updates.isAdmin !== undefined) {
    setClauses.push(`is_admin = $${paramCount++}`);
    values.push(updates.isAdmin);
  }
  if (updates.hourlyRate !== undefined) {
    setClauses.push(`hourly_rate = $${paramCount++}`);
    values.push(updates.hourlyRate);
  }
  if (updates.emailVerified !== undefined) {
    setClauses.push(`email_verified = $${paramCount++}`);
    values.push(updates.emailVerified);
  }
  if (updates.verificationToken !== undefined) {
    setClauses.push(`verification_token = $${paramCount++}`);
    values.push(updates.verificationToken);
  }
  if (updates.verificationTokenExpires !== undefined) {
    setClauses.push(`verification_token_expires = $${paramCount++}`);
    values.push(updates.verificationTokenExpires);
  }
  
  if (setClauses.length === 0) return findEmployeeById(id);
  
  values.push(id);
  
  const row = await queryOne<any>(`
    UPDATE employees
    SET ${setClauses.join(', ')}
    WHERE id = $${paramCount}
    RETURNING id, name, email, password_hash as password, is_admin as "isAdmin", 
              hourly_rate as "hourlyRate", email_verified as "emailVerified",
              verification_token as "verificationToken",
              created_at as "createdAt"
  `, values);
  
  if (!row) return null;
  
  return {
    ...row,
    username: row.email,
    isAdmin: row.isAdmin || false,
    hourlyRate: parseFloat(row.hourlyRate) || 5,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
  };
}

// Legacy functions for backward compatibility (deprecated, use async versions)
export function writeAttendance(): void {
  console.warn('writeAttendance is deprecated - data is now in PostgreSQL');
}

export function writeEmployees(): void {
  console.warn('writeEmployees is deprecated - data is now in PostgreSQL');
}
