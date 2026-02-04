/**
 * HR/Admin Dashboard – organization overview, quick actions, reports
 * Admin & Manager only – employee management, payroll, assign task
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CalendarDays,
  CheckSquare,
  Wallet,
  ChevronRight,
  Shield,
  UsersRound,
  UserPlus,
  DollarSign,
  ClipboardList,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import { reportService } from '../../services/reportService';
import { leaveService } from '../../services/leaveService';
import { userService } from '../../services/userService';
import BarChartCard from '../../components/charts/BarChartCard';
import LineChartCard from '../../components/charts/LineChartCard';
import PieChartCard from '../../components/charts/PieChartCard';
import { formatDate } from '../../utils/helpers';
import { SkeletonCard, Skeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import AnnouncementsCard from '../../components/dashboard/AnnouncementsCard';

export default function AdminDashboard() {
  const { user } = useAuth();
  const isManager = user?.role === ROLES.MANAGER;
  const [leaveApprovals, setLeaveApprovals] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [payrollReport, setPayrollReport] = useState(null);
  const [leaveReport, setLeaveReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [leaveRes, usersRes, attRes, payRes, leaveReportRes] =
          await Promise.allSettled([
            leaveService.getAll({ status: 'Pending', limit: 10 }),
            userService.getAll({ limit: 1 }),
            reportService.attendance({}),
            reportService.payroll({}),
            reportService.leave({}),
          ]);

        setLeaveApprovals(
          leaveRes.status === 'fulfilled' ? leaveRes.value?.data?.data ?? [] : []
        );
        const pagination =
          usersRes.status === 'fulfilled' ? usersRes.value?.data?.pagination : null;
        setUserCount(pagination?.total ?? 0);

        setAttendanceReport(
          attRes.status === 'fulfilled'
            ? attRes.value?.data?.data ?? attRes.value?.data
            : null
        );
        setPayrollReport(
          payRes.status === 'fulfilled'
            ? payRes.value?.data?.data ?? payRes.value?.data
            : null
        );
        setLeaveReport(
          leaveReportRes.status === 'fulfilled'
            ? leaveReportRes.value?.data?.data ?? leaveReportRes.value?.data
            : null
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const payrollRecords = payrollReport?.records ?? [];
  const payrollSummaryData = payrollRecords.length
    ? payrollRecords.map((r, i) => ({
        name: `Month ${r.month ?? i + 1}`,
        value: r.netSalary ?? r.net ?? 0,
      }))
    : [];
  const leaveSummary = leaveReport?.summary ?? {};
  const leavePieData = Object.entries(leaveSummary).map(([name, count]) => ({
    name,
    value: count,
  }));

  const dashboardTitle = isManager ? 'Manager Dashboard' : 'Admin Dashboard';
  const dashboardSubtitle = isManager
    ? 'Team overview, leave approvals & reports'
    : 'Organization overview, HR & reports';

  const quickActions = [
    {
      to: '/employees',
      label: 'Employee Management',
      icon: UserPlus,
      description: 'Manage employees, profiles, directory',
      color: 'bg-blue-100 text-blue-700',
      borderColor: 'hover:border-blue-300',
    },
    {
      to: '/payroll',
      label: 'Payroll Management',
      icon: DollarSign,
      description: 'Salary slips, attendance, reimbursements',
      color: 'bg-green-100 text-green-700',
      borderColor: 'hover:border-green-300',
    },
    {
      to: '/tasks/new',
      label: 'Assign Task',
      icon: ClipboardList,
      description: 'Create and assign tasks to employees',
      color: 'bg-amber-100 text-amber-700',
      borderColor: 'hover:border-amber-300',
    },
    {
      to: '/reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
      description: 'Attendance, payroll, leave reports',
      color: 'bg-purple-100 text-purple-700',
      borderColor: 'hover:border-purple-300',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className={`rounded-xl p-5 border shadow-lg ${
          isManager
            ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white border-teal-600'
            : 'bg-gradient-to-r from-slate-700 to-slate-800 text-white border-slate-700'
        }`}
      >
        <div className="flex items-center gap-3">
          {isManager ? (
            <UsersRound className="w-10 h-10 shrink-0" />
          ) : (
            <Shield className="w-10 h-10 shrink-0" />
          )}
          <div>
            <h2 className="text-xl font-bold">{dashboardTitle}</h2>
            <p className="text-sm opacity-90">{dashboardSubtitle}</p>
          </div>
        </div>
      </div>

      {/* Quick action cards */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Quick actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(({ to, label, icon: Icon, description, color, borderColor }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 bg-white shadow-sm transition-all ${borderColor} hover:shadow-md`}
            >
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${color}`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 ml-auto" />
            </Link>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{userCount}</p>
              <p className="text-sm text-gray-500">Total employees</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {leaveApprovals.length}
              </p>
              <p className="text-sm text-gray-500">Leave approvals pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {attendanceReport?.summary?.totalRecords ?? '-'}
              </p>
              <p className="text-sm text-gray-500">Attendance records</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {payrollReport?.summary?.totalNet != null
                  ? '₹' + payrollReport.summary.totalNet
                  : '-'}
              </p>
              <p className="text-sm text-gray-500">Payroll summary</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leave approvals */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Pending leave approvals
          </h3>
          <Link
            to="/leave/approvals"
            className="text-sm text-primary-600 hover:underline flex items-center gap-1"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {leaveApprovals.length === 0 ? (
          <EmptyState title="No pending leave requests" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 pr-4">Employee</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Dates</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaveApprovals.map((l) => (
                  <tr key={l._id} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium text-gray-900">
                      {l.employee?.name ?? '-'}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      {l.leaveType ?? 'Leave'}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      {formatDate(l.fromDate)} – {formatDate(l.toDate)}
                    </td>
                    <td className="py-2">
                      <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-xs">
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnnouncementsCard limit={6} showPinnedFirst expired={false} />

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {payrollSummaryData.length > 0 && (
          <LineChartCard
            title="Payroll (net)"
            data={payrollSummaryData}
            dataKey="value"
            xKey="name"
          />
        )}
        {leavePieData.length > 0 && (
          <PieChartCard
            title="Leave by status"
            data={leavePieData}
            dataKey="value"
            nameKey="name"
          />
        )}
      </div>
    </div>
  );
}
