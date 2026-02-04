/**
 * Reports – API: GET /api/reports/attendance, payroll, leave
 */

import { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { userService } from '../../services/userService';
import BarChartCard from '../../components/charts/BarChartCard';
import LineChartCard from '../../components/charts/LineChartCard';
import PieChartCard from '../../components/charts/PieChartCard';
import { Skeleton } from '../../components/common/Skeleton';

export default function Reports() {
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [payrollReport, setPayrollReport] = useState(null);
  const [leaveReport, setLeaveReport] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [attRes, payRes, leaveRes, usersRes] = await Promise.allSettled([
          reportService.attendance({}),
          reportService.payroll({}),
          reportService.leave({}),
          userService.getAll({ limit: 1 }),
        ]);
        setAttendanceReport(attRes.status === 'fulfilled' ? (attRes.value?.data?.data ?? attRes.value?.data) : null);
        setPayrollReport(payRes.status === 'fulfilled' ? (payRes.value?.data?.data ?? payRes.value?.data) : null);
        setLeaveReport(leaveRes.status === 'fulfilled' ? (leaveRes.value?.data?.data ?? leaveRes.value?.data) : null);
        setUserCount(usersRes.status === 'fulfilled' ? (usersRes.value?.data?.pagination?.total ?? 0) : 0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Skeleton className="h-96 rounded-xl" />;

  const payrollRecords = payrollReport?.records ?? [];
  const payrollData = payrollRecords.map((r, i) => ({ name: `Month ${r.month ?? i + 1}`, value: r.netSalary ?? r.net ?? 0 }));
  const leaveSummary = leaveReport?.summary ?? {};
  const leavePieData = Object.entries(leaveSummary).map(([name, value]) => ({ name, value: Number(value) || 0 }));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Reports & analytics</h2>

      <div className="grid lg:grid-cols-2 gap-6">
        {payrollData.length > 0 && (
          <LineChartCard title="Payroll (net)" data={payrollData} dataKey="value" xKey="name" />
        )}
        {leavePieData.length > 0 && (
          <PieChartCard title="Leave by status" data={leavePieData} dataKey="value" nameKey="name" />
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Attendance summary</h3>
        {attendanceReport?.summary ? (
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            <div>
              <dt className="text-gray-500">Total records</dt>
              <dd className="font-medium text-gray-900">{attendanceReport.summary.totalRecords ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Present</dt>
              <dd className="font-medium text-gray-900">{attendanceReport.summary.present ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">With overtime</dt>
              <dd className="font-medium text-gray-900">{attendanceReport.summary.withOvertime ?? '-'}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-gray-500">No attendance data for selected period.</p>
        )}
      </div>

      {payrollData.length === 0 && leavePieData.length === 0 && !attendanceReport?.summary && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p>No report data available. Use query params (from, to, year, employeeId) as needed.</p>
        </div>
      )}
    </div>
  );
}
