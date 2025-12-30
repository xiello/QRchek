import React from 'react';
import { AttendanceRecord } from '../types/attendance';
import './AttendanceList.css';

interface AttendanceListProps {
  records: AttendanceRecord[];
}

export default function AttendanceList({ records }: AttendanceListProps) {
  if (records.length === 0) {
    return (
      <div className="attendance-list empty">
        <p>No attendance records found</p>
      </div>
    );
  }

  return (
    <div className="attendance-list">
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Type</th>
            <th>Date</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const date = new Date(record.timestamp);
            const dateStr = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const timeStr = date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <tr key={record.id}>
                <td className="employee-name">{record.employeeName}</td>
                <td>
                  <span
                    className={`type-badge ${
                      record.type === 'arrival' ? 'arrival' : 'departure'
                    }`}
                  >
                    {record.type === 'arrival' ? 'Arrival' : 'Departure'}
                  </span>
                </td>
                <td>{dateStr}</td>
                <td className="time">{timeStr}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

