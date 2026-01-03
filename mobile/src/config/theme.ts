// QRchek - Neutral Brand Theme
// Colors for blue accent on dark background

export const theme = {
  colors: {
    // Primary brand colors
    primary: '#3B82F6',      // Primary Blue
    primaryDark: '#2563EB',  // Darker blue for pressed states
    
    // Backgrounds
    background: '#1A1A1A',   // Main dark background
    surface: '#242424',      // Cards, elevated surfaces
    surfaceLight: '#2E2E2E', // Lighter surface for inputs
    
    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#888888',
    textMuted: '#666666',
    
    // Status colors
    success: '#4CAF50',      // Arrivals/success
    error: '#F44336',        // Departures/errors
    warning: '#FFC107',
    
    // Borders
    border: '#333333',
    borderLight: '#444444',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 16,
    full: 9999,
  },
  
  fonts: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Slovak translations
export const sk = {
  // Auth
  login: 'Prihlásenie',
  register: 'Registrácia',
  email: 'Email',
  password: 'Heslo',
  confirmPassword: 'Potvrdiť heslo',
  name: 'Meno',
  logout: 'Odhlásiť sa',
  dontHaveAccount: 'Nemáte účet?',
  alreadyHaveAccount: 'Máte účet?',
  registerHere: 'Zaregistrujte sa',
  loginHere: 'Prihláste sa',
  loggingIn: 'Prihlasovanie...',
  registering: 'Registrácia...',
  
  // Navigation
  scanner: 'Skener',
  history: 'História',
  admin: 'Admin',
  
  // Scanner
  scanQRCode: 'Naskenuj QR kód',
  pointCamera: 'Nasmeruj kameru na QR kód',
  scanAgain: 'Skenovať znova',
  scanSuccessful: 'Sken úspešný!',
  recordedAt: 'Zaznamenané o',
  
  // Attendance
  arrival: 'Príchod',
  departure: 'Odchod',
  arrivals: 'Príchody',
  departures: 'Odchody',
  
  // Time periods
  today: 'Dnes',
  thisWeek: 'Tento týždeň',
  thisMonth: 'Tento mesiac',
  
  // Stats
  hours: 'Hodiny',
  scans: 'Skeny',
  amountToPay: 'Na vyplatenie',
  
  // Admin
  employees: 'Zamestnanci',
  records: 'Záznamy',
  stats: 'Štatistiky',
  overview: 'Prehľad',
  employeePayments: 'Výplaty zamestnancov',
  hourlyRate: 'Hodinová sadzba',
  recentActivity: 'Nedávna aktivita',
  
  // Actions
  delete: 'Vymazať',
  edit: 'Upraviť',
  save: 'Uložiť',
  cancel: 'Zrušiť',
  export: 'Exportovať',
  exportToday: 'Export dnes',
  exportWeek: 'Export týždeň',
  exportMonth: 'Export mesiac',
  exportAll: 'Export všetko',
  exportSummary: 'Export súhrn',
  
  // Status
  verified: 'Overený',
  loading: 'Načítava sa...',
  noRecords: 'Žiadne záznamy',
  error: 'Chyba',
  success: 'Úspech',
  
  // Camera
  cameraPermission: 'Pre skenovanie QR kódov je potrebné povolenie kamery',
  grantPermission: 'Povoliť kameru',
  
  // Errors
  invalidQRCode: 'Neplatný QR kód',
  scanOfficialQR: 'Prosím, naskenujte oficiálny firemný QR kód.',
  tryAgain: 'Skúsiť znova',
  
  // History
  yourHistory: 'Vaša história dochádzky',
  pullToRefresh: 'Potiahnite pre obnovenie',
  
  // Employee
  loggedInAs: 'Prihlásený ako',
  
  // Week/Month labels
  week: 'Týždeň',
  month: 'Mesiac',
};

export default theme;

