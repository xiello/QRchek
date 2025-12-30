import React from 'react';
import { AttendanceRecord } from '../types/attendance';
import './EmployeeFilter.css';

interface EmployeeFilterProps {
  records: AttendanceRecord[];
  selectedEmployee: string | null;
  onEmployeeChange: (employeeId: string | null) => void;
}

export default function EmployeeFilter({
  records,
  selectedEmployee,
  onEmployeeChange,
}: EmployeeFilterProps) {
  // Get unique employees
  const employees = Array.from(
    new Map(records.map((r) => [r.employeeId, r.employeeName])).entries()
  ).map(([id, name]) => ({ id, name }));

  return (
    <div className="employee-filter">
      <label htmlFor="employee-select">Filter by Employee:</label>
      <select
        id="employee-select"
        value={selectedEmployee || ''}
        onChange={(e) => onEmployeeChange(e.target.value || null)}
      >
        <option value="">All Employees</option>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.name}
          </option>
        ))}
      </select>
    </div>
  );
}

