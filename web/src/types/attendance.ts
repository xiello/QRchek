export interface AttendanceRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  timestamp: string;
  type: 'arrival' | 'departure';
  qrCode: string;
}

