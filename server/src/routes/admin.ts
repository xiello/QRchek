import express from 'express';
import { 
  readEmployees, 
  readAttendance, 
  updateEmployee,
  findEmployeeById
} from '../models/attendance';
import { authenticateToken, requireAdmin } from '../middleware/admin';
import { AttendanceRecord } from '../types/attendance';

const router = express.Router();

// All admin routes require authentication and admin access
router.use(authenticateToken);
router.use(requireAdmin);

// Helper function to calculate hours and payments for a set of records
function calculateEmployeeStats(
  records: AttendanceRecord[], 
  employeeRates: { [key: string]: number }
): { [empId: string]: { hours: number; payment: number } } {
  const result: { [empId: string]: { hours: number; payment: number } } = {};
  
  const sorted = [...records].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  const byEmployee: { [key: string]: AttendanceRecord[] } = {};
  sorted.forEach(r => {
    if (!byEmployee[r.employeeId]) {
      byEmployee[r.employeeId] = [];
    }
    byEmployee[r.employeeId].push(r);
  });

  Object.entries(byEmployee).forEach(([empId, empRecords]) => {
    let totalMinutes = 0;
    const rate = employeeRates[empId] || 5;
    
    for (let i = 0; i < empRecords.length; i++) {
      const record = empRecords[i];
      if (record.type === 'arrival') {
        const departure = empRecords.find((r, idx) => idx > i && r.type === 'departure');
        if (departure) {
          const start = new Date(record.timestamp).getTime();
          const end = new Date(departure.timestamp).getTime();
          totalMinutes += (end - start) / (1000 * 60);
        }
      }
    }
    
    const hours = Math.round(totalMinutes / 60 * 100) / 100;
    const payment = Math.round(hours * rate * 100) / 100;
    result[empId] = { hours, payment };
  });

  return result;
}

// GET /api/admin/employees - Get all employees with payment stats
router.get('/employees', async (req, res) => {
  try {
    const employees = await readEmployees();
    const attendance = await readAttendance();
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayRecords = attendance.filter(r => new Date(r.timestamp) >= today);
    const weekRecords = attendance.filter(r => new Date(r.timestamp) >= weekAgo);
    const monthRecords = attendance.filter(r => new Date(r.timestamp) >= monthAgo);

    const employeeRates: { [key: string]: number } = {};
    employees.forEach(e => {
      employeeRates[e.id] = e.hourlyRate || 5;
    });

    const todayStats = calculateEmployeeStats(todayRecords, employeeRates);
    const weekStats = calculateEmployeeStats(weekRecords, employeeRates);
    const monthStats = calculateEmployeeStats(monthRecords, employeeRates);

    const safeEmployees = employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      isAdmin: emp.isAdmin || false,
      hourlyRate: emp.hourlyRate || 5,
      emailVerified: emp.emailVerified,
      createdAt: emp.createdAt,
      today: todayStats[emp.id] || { hours: 0, payment: 0 },
      week: weekStats[emp.id] || { hours: 0, payment: 0 },
      month: monthStats[emp.id] || { hours: 0, payment: 0 }
    }));
    
    res.json(safeEmployees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/employees/:id - Update employee settings
router.put('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hourlyRate, isAdmin } = req.body;

    const employee = await findEmployeeById(id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const updates: { hourlyRate?: number; isAdmin?: boolean } = {};
    
    if (typeof hourlyRate === 'number' && hourlyRate >= 0) {
      updates.hourlyRate = hourlyRate;
    }
    
    if (typeof isAdmin === 'boolean') {
      updates.isAdmin = isAdmin;
    }

    const updated = await updateEmployee(id, updates);
    if (!updated) {
      return res.status(500).json({ error: 'Failed to update employee' });
    }

    res.json({
      success: true,
      employee: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        isAdmin: updated.isAdmin || false,
        hourlyRate: updated.hourlyRate || 5
      }
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/stats - Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const employees = await readEmployees();
    const attendance = await readAttendance();
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayRecords = attendance.filter(r => new Date(r.timestamp) >= today);
    const weekRecords = attendance.filter(r => new Date(r.timestamp) >= weekAgo);
    const monthRecords = attendance.filter(r => new Date(r.timestamp) >= monthAgo);

    const employeeRates: { [key: string]: number } = {};
    employees.forEach(e => {
      employeeRates[e.id] = e.hourlyRate || 5;
    });

    const todayStats = calculateEmployeeStats(todayRecords, employeeRates);
    const weekStats = calculateEmployeeStats(weekRecords, employeeRates);
    const monthStats = calculateEmployeeStats(monthRecords, employeeRates);

    const sumStats = (stats: { [empId: string]: { hours: number; payment: number } }) => {
      let totalHours = 0;
      let totalPayment = 0;
      Object.values(stats).forEach(s => {
        totalHours += s.hours;
        totalPayment += s.payment;
      });
      return { 
        hours: Math.round(totalHours * 100) / 100, 
        payment: Math.round(totalPayment * 100) / 100 
      };
    };

    const todayTotals = sumStats(todayStats);
    const weekTotals = sumStats(weekStats);
    const monthTotals = sumStats(monthStats);

    res.json({
      employees: {
        total: employees.length,
        verified: employees.filter(e => e.emailVerified).length
      },
      today: {
        scans: todayRecords.length,
        hours: todayTotals.hours,
        payment: todayTotals.payment
      },
      week: {
        scans: weekRecords.length,
        hours: weekTotals.hours,
        payment: weekTotals.payment
      },
      month: {
        scans: monthRecords.length,
        hours: monthTotals.hours,
        payment: monthTotals.payment
      },
      recentActivity: attendance.slice(0, 10)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/export - Export attendance as CSV
router.get('/export', async (req, res) => {
  try {
    const { period, employeeId, type } = req.query;
    const employees = await readEmployees();
    let attendance = await readAttendance();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const employeeRates: { [key: string]: number } = {};
    const employeeNames: { [key: string]: string } = {};
    employees.forEach(e => {
      employeeRates[e.id] = e.hourlyRate || 5;
      employeeNames[e.id] = e.name;
    });

    if (type === 'summary') {
      const csvRows: string[] = [];
      csvRows.push('Employee,Email,Hourly Rate (EUR),Hours Today,Payment Today (EUR),Hours Week,Payment Week (EUR),Hours Month,Payment Month (EUR)');

      const todayRecords = attendance.filter(r => new Date(r.timestamp) >= today);
      const weekRecords = attendance.filter(r => new Date(r.timestamp) >= weekAgo);
      const monthRecords = attendance.filter(r => new Date(r.timestamp) >= monthAgo);

      const todayStats = calculateEmployeeStats(todayRecords, employeeRates);
      const weekStats = calculateEmployeeStats(weekRecords, employeeRates);
      const monthStats = calculateEmployeeStats(monthRecords, employeeRates);

      employees.forEach(emp => {
        if (employeeId && emp.id !== employeeId) return;
        
        const todayData = todayStats[emp.id] || { hours: 0, payment: 0 };
        const weekData = weekStats[emp.id] || { hours: 0, payment: 0 };
        const monthData = monthStats[emp.id] || { hours: 0, payment: 0 };

        csvRows.push(`"${emp.name}","${emp.email}",${emp.hourlyRate || 5},${todayData.hours},${todayData.payment},${weekData.hours},${weekData.payment},${monthData.hours},${monthData.payment}`);
      });

      const csv = csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=employee-summary.csv');
      return res.send(csv);
    }

    if (period === 'day') {
      attendance = attendance.filter(r => new Date(r.timestamp) >= today);
    } else if (period === 'week') {
      attendance = attendance.filter(r => new Date(r.timestamp) >= weekAgo);
    } else if (period === 'month') {
      attendance = attendance.filter(r => new Date(r.timestamp) >= monthAgo);
    }

    if (employeeId && typeof employeeId === 'string') {
      attendance = attendance.filter(r => r.employeeId === employeeId);
    }

    attendance.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const csvRows: string[] = [];
    csvRows.push('Employee,Date,Arrival,Departure,Duration (hours),Payment (EUR)');

    const byEmployee: { [key: string]: typeof attendance } = {};
    attendance.forEach(r => {
      if (!byEmployee[r.employeeId]) {
        byEmployee[r.employeeId] = [];
      }
      byEmployee[r.employeeId].push(r);
    });

    Object.entries(byEmployee).forEach(([empId, records]) => {
      const rate = employeeRates[empId] || 5;
      const empName = records[0]?.employeeName || 'Unknown';

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        if (record.type === 'arrival') {
          const departure = records.find((r, idx) => idx > i && r.type === 'departure');
          
          const arrivalDate = new Date(record.timestamp);
          const dateStr = arrivalDate.toLocaleDateString();
          const arrivalTime = arrivalDate.toLocaleTimeString();
          
          if (departure) {
            const departureDate = new Date(departure.timestamp);
            const departureTime = departureDate.toLocaleTimeString();
            const hours = (departureDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60);
            const payment = Math.round(hours * rate * 100) / 100;
            
            csvRows.push(`"${empName}",${dateStr},${arrivalTime},${departureTime},${hours.toFixed(2)},${payment.toFixed(2)}`);
          } else {
            csvRows.push(`"${empName}",${dateStr},${arrivalTime},-,-,-`);
          }
        }
      }
    });

    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-${period || 'all'}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
