/**
 * Clock-in / clock-out – API: POST /api/attendance/clock-in, clock-out, GET /api/attendance
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, LogIn, LogOut, Calendar } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import { formatDateTime } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { Skeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

export default function Attendance() {
  const [todayRecord, setTodayRecord] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getAll({ limit: 30 });
      const list = res.data?.data ?? [];
      setAttendance(Array.isArray(list) ? list : []);
      const today = new Date().toISOString().slice(0, 10);
      const todayItem = list.find((a) => a.date && a.date.slice(0, 10) === today);
      setTodayRecord(todayItem ?? null);
    } catch (e) {
      setTodayRecord(null);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      await attendanceService.clockIn();
      showToast('Clocked in', 'success');
      load();
    } catch (e) {
      showToast(e.userMessage || 'Clock-in failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    try {
      await attendanceService.clockOut();
      showToast('Clocked out', 'success');
      load();
    } catch (e) {
      showToast(e.userMessage || 'Clock-out failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const canClockIn = !todayRecord?.clockIn;
  const canClockOut = todayRecord?.clockIn && !todayRecord?.clockOut;

  if (loading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Attendance</h2>
        <Link to="/payroll" className="text-sm text-primary-600 hover:underline">Back to payroll</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Today
        </h3>
        <div className="flex flex-wrap gap-4 items-center">
          {todayRecord?.clockIn && (
            <div>
              <span className="text-sm text-gray-500">Clocked in</span>
              <p className="font-medium text-gray-900">{formatDateTime(todayRecord.clockIn)}</p>
            </div>
          )}
          {todayRecord?.clockOut && (
            <div>
              <span className="text-sm text-gray-500">Clocked out</span>
              <p className="font-medium text-gray-900">{formatDateTime(todayRecord.clockOut)}</p>
            </div>
          )}
          <div className="flex gap-2">
            {canClockIn && (
              <button
                type="button"
                onClick={handleClockIn}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" /> Clock in
              </button>
            )}
            {canClockOut && (
              <button
                type="button"
                onClick={handleClockOut}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" /> Clock out
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Recent attendance
        </h3>
        {attendance.length === 0 ? (
          <EmptyState title="No attendance records" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="text-left py-2 pr-4">Date</th>
                  <th className="text-left py-2 pr-4">Clock in</th>
                  <th className="text-left py-2">Clock out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendance.map((a) => (
                  <tr key={a._id}>
                    <td className="py-2 pr-4">{a.date ? formatDateTime(a.date) : '-'}</td>
                    <td className="py-2 pr-4">{a.clockIn ? formatDateTime(a.clockIn) : '-'}</td>
                    <td className="py-2">{a.clockOut ? formatDateTime(a.clockOut) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
