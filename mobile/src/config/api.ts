const getEnvApiUrl = (): string | undefined => {
  try {
    return process.env.EXPO_PUBLIC_API_URL;
  } catch {
    return undefined;
  }
};

const DEV_LOCAL_IP = 'http://192.168.0.111:3001';
const FALLBACK_PRODUCTION_URL = 'https://web-production-65f2b.up.railway.app';

export const getApiUrl = (): string => {
  const envUrl = getEnvApiUrl();
  if (envUrl) {
    return envUrl;
  }
  
  // @ts-ignore - __DEV__ is defined by React Native
  const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
  
  if (!isDev) {
    return FALLBACK_PRODUCTION_URL;
  }
  
  return DEV_LOCAL_IP;
};

export const API_BASE_URL = getApiUrl();
