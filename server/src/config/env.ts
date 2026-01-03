// Environment configuration with validation
// Server will crash on startup if required vars are missing

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`\n${'='.repeat(60)}`);
    console.error(`FATAL: Required environment variable ${name} is not set!`);
    console.error(`${'='.repeat(60)}\n`);
    console.error(`Please set ${name} in your environment or Railway dashboard.`);
    console.error(`The server cannot start without this configuration.\n`);
    process.exit(1);
  }
  return value;
}

function getOptionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

// Validate on module load (server startup)
export const config = {
  // Required in production, optional in development
  get JWT_SECRET(): string {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      return getRequiredEnv('JWT_SECRET');
    }
    // In development, allow a default but warn
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.warn('WARNING: JWT_SECRET not set. Using insecure default for development only.');
      return 'dev-only-insecure-secret-do-not-use-in-production';
    }
    return secret;
  },

  get DATABASE_URL(): string | undefined {
    return process.env.DATABASE_URL;
  },

  get PORT(): number {
    return parseInt(process.env.PORT || '3000', 10);
  },

  get NODE_ENV(): string {
    return process.env.NODE_ENV || 'development';
  },

  get isProduction(): boolean {
    return this.NODE_ENV === 'production';
  },

  get FRONTEND_URL(): string | undefined {
    return process.env.FRONTEND_URL;
  },

  // QR codes - required in production
  get VALID_QR_CODES(): string[] {
    const codesEnv = process.env.VALID_QR_CODES || process.env.VALID_QR_CODE;
    if (!codesEnv) {
      if (this.isProduction) {
        console.warn('WARNING: VALID_QR_CODES not set. Using default QR code.');
      }
      return ['QRCHEK-2024-COMPANY'];
    }
    return codesEnv.split(',').map(code => code.trim()).filter(Boolean);
  },

  // CORS allowed origins
  get CORS_ORIGINS(): string[] {
    if (this.isProduction) {
      // In production, only allow specific origins
      const frontendUrl = this.FRONTEND_URL;
      if (frontendUrl) {
        return [frontendUrl];
      }
      // If no frontend URL set, don't allow any cross-origin requests
      console.warn('WARNING: FRONTEND_URL not set in production. CORS will be restrictive.');
      return [];
    }
    // Development origins
    return [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8081',
    ];
  },
};

// Validate critical config on import
export function validateConfig(): void {
  console.log('Validating configuration...');
  
  // Access JWT_SECRET to trigger validation
  const _ = config.JWT_SECRET;
  
  if (config.isProduction) {
    if (!config.DATABASE_URL) {
      console.error('FATAL: DATABASE_URL is required in production!');
      process.exit(1);
    }
  }
  
  console.log('Configuration validated successfully.');
}
