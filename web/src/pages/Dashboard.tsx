import React, { useState, useEffect } from 'react';
import { AttendanceRecord } from '../types/attendance';
import { attendanceAPI, adminAPI, authAPI, Employee, Stats } from '../services/api';
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
      const [attendanceData, statsData, employeesData] = await Promise.all([
        attendanceAPI.getAllAttendance(),
        adminAPI.getStats(),
        adminAPI.getEmployees()
      ]);
      setRecords(attendanceData);
      setStats(statsData);
      setEmployees(employeesData);
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
              <span className="login-logo-am">AM</span>
              <span className="login-logo-c">C</span>
            </div>
            <div className="login-logo-tagline">TVOJ COFFEESHOP</div>
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
            <span className="login-logo-am">AM</span>
            <span className="login-logo-c">C</span>
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
          <h1>
            <span className="header-logo-am">AM</span>
            <span className="header-logo-c">C</span>
            {' '}Admin
          </h1>
          <p className="subtitle">Tvoj Coffeeshop - Správa dochádzky</p>
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
                    <td className="status-cell">
                      {emp.isAdmin && <span className="badge admin">{sk.admin}</span>}
                      {emp.emailVerified ? (
                        <span className="badge verified">{sk.verified}</span>
                      ) : (
                        <>
                          <span className="badge pending">{sk.pendingVerification}</span>
                          <button 
                            className="verify-btn"
                            onClick={() => handleVerifyEmployee(emp.id)}
                            title="Overiť zamestnanca"
                          >
                            {sk.verify}
                          </button>
                        </>
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
