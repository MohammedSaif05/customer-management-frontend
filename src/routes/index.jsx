/**
 * Application routes with role-based protection
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

// Layout
import MainLayout from '../components/layout/MainLayout';

// Auth
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';

// Dashboards
import EmployeeDashboard from '../pages/dashboard/EmployeeDashboard';
import AdminDashboard from '../pages/dashboard/AdminDashboard';

// Tasks
import TaskList from '../pages/tasks/TaskList';
import TaskKanban from '../pages/tasks/TaskKanban';
import TaskCalendar from '../pages/tasks/TaskCalendar';
import TaskDetail from '../pages/tasks/TaskDetail';

// Payroll
import PayrollList from '../pages/payroll/PayrollList';
import PayrollSlipDetail from '../pages/payroll/PayrollSlipDetail';
import Attendance from '../pages/payroll/Attendance';
import Reimbursements from '../pages/payroll/Reimbursements';

// Leave
import LeaveApply from '../pages/leave/LeaveApply';
import LeaveHistory from '../pages/leave/LeaveHistory';
import LeaveTeamCalendar from '../pages/leave/LeaveTeamCalendar';
import LeaveApprovals from '../pages/leave/LeaveApprovals';

// Employees
import EmployeeDirectory from '../pages/employees/EmployeeDirectory';
import EmployeeDetail from '../pages/employees/EmployeeDetail';

// Profile
import Profile from '../pages/profile/Profile';

// Reports
import Reports from '../pages/reports/Reports';

// Misc
import Unauthorized from '../pages/Unauthorized';

import { ROLES } from '../utils/constants';

function DashboardRedirect() {
  const { user } = useAuth();
  const role = String(user?.role || '').toUpperCase();
  if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
    return <Navigate to="/dashboard/admin" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardRedirect />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="tasks" element={<TaskList />} />
        <Route path="tasks/kanban" element={<TaskKanban />} />
        <Route path="tasks/calendar" element={<TaskCalendar />} />
        <Route path="tasks/:id" element={<TaskDetail />} />

        <Route path="payroll" element={<PayrollList />} />
        <Route path="payroll/slip/:id" element={<PayrollSlipDetail />} />
        <Route path="payroll/attendance" element={<Attendance />} />
        <Route path="payroll/reimbursements" element={<Reimbursements />} />

        <Route path="leave" element={<LeaveApply />} />
        <Route path="leave/history" element={<LeaveHistory />} />
        <Route
          path="leave/team"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <LeaveTeamCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="leave/approvals"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <LeaveApprovals />
            </ProtectedRoute>
          }
        />

        <Route
          path="employees"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <EmployeeDirectory />
            </ProtectedRoute>
          }
        />
        <Route
          path="employees/:id"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <EmployeeDetail />
            </ProtectedRoute>
          }
        />

        <Route path="profile" element={<Profile />} />

        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <Reports />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
