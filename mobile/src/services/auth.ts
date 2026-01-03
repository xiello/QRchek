import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginResponse, Employee } from '../types/attendance';

const TOKEN_KEY = '@qrchek:token';
const EMPLOYEE_KEY = '@qrchek:employee';
const TOKEN_TIMESTAMP_KEY = '@qrchek:token_timestamp';

// Token validity period (check if token is older than 25 days)
const TOKEN_REFRESH_THRESHOLD_DAYS = 25;

export async function storeAuth(token: string, employee: Employee): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(EMPLOYEE_KEY, JSON.stringify(employee));
  await AsyncStorage.setItem(TOKEN_TIMESTAMP_KEY, Date.now().toString());
}

export async function getToken(): Promise<string | null> {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

export async function getEmployee(): Promise<Employee | null> {
  const employeeStr = await AsyncStorage.getItem(EMPLOYEE_KEY);
  if (!employeeStr) return null;
  return JSON.parse(employeeStr);
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(EMPLOYEE_KEY);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return token !== null;
}

/**
 * Check if token should be refreshed (older than threshold)
 */
export async function shouldRefreshToken(): Promise<boolean> {
  const timestampStr = await AsyncStorage.getItem(TOKEN_TIMESTAMP_KEY);
  if (!timestampStr) return true;
  
  const timestamp = parseInt(timestampStr, 10);
  const ageInDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
  
  return ageInDays > TOKEN_REFRESH_THRESHOLD_DAYS;
}

/**
 * Get token age in days
 */
export async function getTokenAgeDays(): Promise<number> {
  const timestampStr = await AsyncStorage.getItem(TOKEN_TIMESTAMP_KEY);
  if (!timestampStr) return 999;
  
  const timestamp = parseInt(timestampStr, 10);
  return (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
}
