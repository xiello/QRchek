import React, { useState, useEffect } from 'react';
import { AttendanceRecord } from '../types/attendance';
import { attendanceAPI, adminAPI, authAPI, Employee, Stats, MissingDeparture, PendingConfirmation } from '../services/api';
import AttendanceList from '../components/AttendanceList';
import EmployeeFilter from '../components/EmployeeFilter';
import './Dashboard.css';

// Slovak translations
const sk = {
  login: 'Prihlásenie',
  adminLogin: 'Admin prihlásenie',
  email: 'Email',
  password: 'Heslo',
  loggingIn: 'Prihlasovanie...',
  logout: 'Odhlásiť sa',
  adminRequired: 'Vyžaduje sa admin prístup',
  loginFailed: 'Prihlásenie zlyhalo',
  
  overview: 'Prehľad',
  employees: 'Zamestnanci',
  records: 'Záznamy',
  
  today: 'Dnes',
  thisWeek: 'Tento týždeň',
  thisMonth: 'Tento mesiac',
  
  scans: 'Skeny',
  hoursWorked: 'Odpracované hodiny',
  amountToPay: 'Na vyplatenie',
  
  exportData: 'Export dát',
  detailedRecords: 'Podrobné záznamy',
  employeeSummary: 'Súhrn zamestnancov',
  exportSummary: 'Exportovať súhrn',
  allTime: 'Celé obdobie',
  
  recentActivity: 'Nedávna aktivita',
  arrival: 'Príchod',
  departure: 'Odchod',
  
  employeeManagement: 'Správa zamestnancov a výplaty',
  name: 'Meno',
  rate: 'Sadzba (€/h)',
  status: 'Stav',
  admin: 'Admin',
  verified: 'Overený',
  pending: 'Čakajúci',
  verify: 'Overiť',
  pendingVerification: 'Čaká na overenie',
  delete: 'Odstrániť',
  confirmDelete: 'Naozaj chcete odstrániť tohto zamestnanca? Všetky jeho záznamy budú vymazané.',
  deleteSuccess: 'Zamestnanec bol úspešne odstránený',
  deleteError: 'Chyba pri odstraňovaní zamestnanca',
  actions: 'Akcie',
  
  loading: 'Načítava sa...',
  retry: 'Skúsiť znova',
  loadError: 'Nepodarilo sa načítať dáta. Skontrolujte či beží server.',
};

export default function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'records'>('overview');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [missingDepartures, setMissingDepartures] = useState<MissingDeparture[]>([]);
  const [pendingConfirmations, setPendingConfirmations] = useState<PendingConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const adminStatus = localStorage.getItem('is_admin');
    if (token && adminStatus === 'true') {
      setIsLoggedIn(true);
      setIsAdmin(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const response = await authAPI.login(email, password);
      if (!response.employee.isAdmin) {
        setLoginError(sk.adminRequired);
        return;
      }
      localStorage.setItem('admin_token', response.token);
      localStorage.setItem('is_admin', 'true');
      setIsLoggedIn(true);
      setIsAdmin(true);
    } catch (err: any) {
      setLoginError(err.response?.data?.error || sk.loginFailed);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('is_admin');
    setIsLoggedIn(false);
    setIsAdmin(false);
  };

  const loadData = async () => {
    try {
      setError(null);
      const [attendanceData, statsData, employeesData, missingData, pendingData] = await Promise.all([
        attendanceAPI.getAllAttendance(),
        adminAPI.getStats(),
        adminAPI.getEmployees(),
        adminAPI.getMissingDepartures(),
        adminAPI.getPendingConfirmations()
      ]);
      setRecords(attendanceData);
      setStats(statsData);
      setEmployees(employeesData);
      setMissingDepartures(missingData);
      setPendingConfirmations(pendingData);
      console.log('Loaded employees:', employeesData.map(e => ({ name: e.name, emailVerified: e.emailVerified })));
      applyFilter(attendanceData, selectedEmployee);
    } catch (err: any) {
      console.error('Error loading data:', err);
      if (err.response?.status === 403) {
        handleLogout();
      } else {
        setError(sk.loadError);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (data: AttendanceRecord[], employeeId: string | null) => {
    if (!employeeId) {
      setFilteredRecords(data);
    } else {
      setFilteredRecords(data.filter((r) => r.employeeId === employeeId));
    }
  };

  const handleUpdateRate = async (empId: string, rate: number) => {
    try {
      await adminAPI.updateEmployee(empId, { hourlyRate: rate });
      await loadData();
    } catch (err) {
      console.error('Error updating rate:', err);
    }
  };

  const handleVerifyEmployee = async (empId: string) => {
    try {
      await adminAPI.verifyEmployee(empId);
      await loadData();
      alert('Zamestnanec bol úspešne overený');
    } catch (err) {
      console.error('Error verifying employee:', err);
      alert('Chyba pri overovaní zamestnanca');
    }
  };

  const handleDeleteEmployee = async (empId: string, empName: string) => {
    if (!confirm(`${sk.confirmDelete}\n\nZamestnanec: ${empName}`)) {
      return;
    }
    try {
      await adminAPI.deleteEmployee(empId);
      await loadData();
      alert(sk.deleteSuccess);
    } catch (err: any) {
      console.error('Error deleting employee:', err);
      alert(err.response?.data?.error || sk.deleteError);
    }
  };

  const handleExport = async (period: string, type?: string) => {
    try {
      const url = adminAPI.getExportURL(period, selectedEmployee || undefined, type);
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = type === 'summary' ? 'suhrn-zamestnancov.csv' : `dochadzka-${period}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      alert('Export zlyhal');
    }
  };

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      loadData();
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, isAdmin]);

  useEffect(() => {
    applyFilter(records, selectedEmployee);
  }, [selectedEmployee, records]);

  // Login screen
  if (!isLoggedIn || !isAdmin) {
    return (
      <div className="dashboard login-screen">
        <div className="login-container">
          <div className="login-logo">
            <div className="login-logo-text">
              <span className="login-logo-am">QR</span>
              <span className="login-logo-c">chek</span>
            </div>
          </div>
          <p>{sk.adminLogin}</p>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder={sk.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loginLoading}
            />
            <input
              type="password"
              placeholder={sk.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loginLoading}
            />
            {loginError && <div className="error-message">{loginError}</div>}
            <button type="submit" disabled={loginLoading}>
              {loginLoading ? sk.loggingIn : sk.login}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard loading">
        <div className="login-logo">
          <div className="login-logo-text">
            <span className="login-logo-am">QR</span>
            <span className="login-logo-c">chek</span>
          </div>
        </div>
        <p>{sk.loading}</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>QRchek Admin</h1>
          <p className="subtitle">Správa dochádzky</p>
        </div>
        <div className="header-right">
          <button onClick={handleLogout} className="logout-btn">{sk.logout}</button>
        </div>
      </header>

      <nav className="tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          {sk.overview}
        </button>
        <button 
          className={activeTab === 'employees' ? 'active' : ''} 
          onClick={() => setActiveTab('employees')}
        >
          {sk.employees}
        </button>
        <button 
          className={activeTab === 'records' ? 'active' : ''} 
          onClick={() => setActiveTab('records')}
        >
          {sk.records}
        </button>
      </nav>

      <main className="dashboard-content">
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={loadData}>{sk.retry}</button>
          </div>
        )}

        {activeTab === 'overview' && stats && (
          <>
            {stats.employees.pending > 0 && (
              <div className="pending-alert">
                <strong>{stats.employees.pending} zamestnancov čaká na overenie</strong>
                <button onClick={() => setActiveTab('employees')}>Zobraziť</button>
              </div>
            )}
            
            {/* Missing Departures Alert */}
            {missingDepartures.length > 0 && (
              <div className="departure-alert missing">
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                  <strong>Chýbajúce odchody</strong>
                  <p>{missingDepartures.length} zamestnanec(ov) sa neodhlásil</p>
                  <div className="alert-list">
                    {missingDepartures.map(emp => (
                      <div key={emp.id} className="alert-item">
                        <span className="item-name">{emp.name}</span>
                        <span className="item-time">
                          Príchod: {new Date(emp.lastArrival).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Pending Confirmations Alert */}
            {pendingConfirmations.length > 0 && (
              <div className="departure-alert pending">
                <div className="alert-icon">⏳</div>
                <div className="alert-content">
                  <strong>Čaká na potvrdenie</strong>
                  <p>{pendingConfirmations.length} auto-odhlásení čaká na potvrdenie</p>
                  <div className="alert-list">
                    {pendingConfirmations.map(conf => (
                      <div key={conf.id} className="alert-item">
                        <span className="item-name">{conf.employeeName}</span>
                        <span className="item-time">
                          Odchod: {new Date(conf.departureTime).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="stats-section">
              <h2>{sk.today}</h2>
              <div className="stats">
                <div className="stat-card">
                  <div className="stat-value">{stats.today.scans}</div>
                  <div className="stat-label">{sk.scans}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.today.hours}h</div>
                  <div className="stat-label">{sk.hoursWorked}</div>
                </div>
                <div className="stat-card highlight">
                  <div className="stat-value">€{stats.today.payment}</div>
                  <div className="stat-label">{sk.amountToPay}</div>
                </div>
              </div>
            </div>

            <div className="stats-section">
              <h2>{sk.thisWeek}</h2>
              <div className="stats">
                <div className="stat-card">
                  <div className="stat-value">{stats.week.scans}</div>
                  <div className="stat-label">{sk.scans}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.week.hours}h</div>
                  <div className="stat-label">{sk.hoursWorked}</div>
                </div>
                <div className="stat-card highlight">
                  <div className="stat-value">€{stats.week.payment}</div>
                  <div className="stat-label">{sk.amountToPay}</div>
                </div>
              </div>
            </div>

            <div className="stats-section">
              <h2>{sk.thisMonth}</h2>
              <div className="stats">
                <div className="stat-card">
                  <div className="stat-value">{stats.month.scans}</div>
                  <div className="stat-label">{sk.scans}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.month.hours}h</div>
                  <div className="stat-label">{sk.hoursWorked}</div>
                </div>
                <div className="stat-card highlight">
                  <div className="stat-value">€{stats.month.payment}</div>
                  <div className="stat-label">{sk.amountToPay}</div>
                </div>
              </div>
            </div>

            <div className="export-section">
              <h2>{sk.exportData}</h2>
              <div className="export-group">
                <h3>{sk.detailedRecords}</h3>
                <div className="export-buttons">
                  <button onClick={() => handleExport('day')}>{sk.today}</button>
                  <button onClick={() => handleExport('week')}>{sk.thisWeek}</button>
                  <button onClick={() => handleExport('month')}>{sk.thisMonth}</button>
                  <button onClick={() => handleExport('all')}>{sk.allTime}</button>
                </div>
              </div>
              <div className="export-group">
                <h3>{sk.employeeSummary}</h3>
                <div className="export-buttons">
                  <button onClick={() => handleExport('all', 'summary')} className="summary-btn">
                    {sk.exportSummary}
                  </button>
                </div>
              </div>
            </div>

            <div className="recent-section">
              <h2>{sk.recentActivity}</h2>
              <div className="recent-list">
                {stats.recentActivity.map((record) => (
                  <div key={record.id} className={`recent-item ${record.type}`}>
                    <span className="name">{record.employeeName}</span>
                    <span className="type">
                      {record.type === 'arrival' ? sk.arrival : sk.departure}
                    </span>
                    <span className="time">
                      {new Date(record.timestamp).toLocaleString('sk-SK')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'employees' && (
          <div className="employees-section">
            <h2>{sk.employeeManagement}</h2>
            <table className="employees-table">
              <thead>
                <tr>
                  <th>{sk.name}</th>
                  <th>{sk.email}</th>
                  <th>{sk.rate}</th>
                  <th>{sk.today}</th>
                  <th>{sk.thisWeek}</th>
                  <th>{sk.thisMonth}</th>
                  <th>{sk.status}</th>
                  <th>{sk.actions}</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="emp-name">{emp.name}</td>
                    <td className="emp-email">{emp.email}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={emp.hourlyRate}
                        onChange={(e) => handleUpdateRate(emp.id, parseFloat(e.target.value))}
                        className="rate-input"
                      />
                    </td>
                    <td className="payment-cell">
                      <div className="hours">{emp.today?.hours || 0}h</div>
                      <div className="payment">€{emp.today?.payment || 0}</div>
                    </td>
                    <td className="payment-cell">
                      <div className="hours">{emp.week?.hours || 0}h</div>
                      <div className="payment">€{emp.week?.payment || 0}</div>
                    </td>
                    <td className="payment-cell">
                      <div className="hours">{emp.month?.hours || 0}h</div>
                      <div className="payment">€{emp.month?.payment || 0}</div>
                    </td>
                    <td>
                      <div className="status-cell">
                        {emp.isAdmin && <span className="badge admin">{sk.admin}</span>}
                        {!emp.isAdmin && emp.emailVerified === true && (
                          <span className="badge verified">{sk.verified}</span>
                        )}
                        {!emp.isAdmin && emp.emailVerified !== true && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span className="badge pending">{sk.pendingVerification}</span>
                            <button 
                              className="verify-btn"
                              onClick={() => handleVerifyEmployee(emp.id)}
                            >
                              ✓ {sk.verify}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {!emp.isAdmin && (
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                          title={sk.delete}
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'records' && (
          <>
            <EmployeeFilter
              records={records}
              selectedEmployee={selectedEmployee}
              onEmployeeChange={setSelectedEmployee}
            />
            <AttendanceList records={filteredRecords} />
          </>
        )}
      </main>
    </div>
  );
}
