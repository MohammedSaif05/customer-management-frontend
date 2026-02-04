/**
 * Role-specific sidebar – distinct navigation per Admin, Manager, Employee
 */

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Wallet,
  CalendarDays,
  Users,
  User,
  BarChart3,
  FileText,
  Menu,
  X,
  Shield,
  UsersRound,
  Briefcase,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

// Employee-only: personal workspace
const employeeNav = [
  { to: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/payroll', label: 'Payroll', icon: Wallet },
  { to: '/leave', label: 'Leave', icon: CalendarDays },
  { to: '/profile', label: 'Profile', icon: User },
];

// Manager: team hub + approvals
const managerNav = [
  { to: '/dashboard/admin', label: 'Manager Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/payroll', label: 'Payroll', icon: Wallet },
  { to: '/leave', label: 'Leave', icon: CalendarDays },
  { to: '/leave/approvals', label: 'Leave Approvals', icon: FileText },
  { to: '/leave/team', label: 'Team Calendar', icon: CalendarDays },
  { to: '/employees', label: 'Team', icon: UsersRound },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/profile', label: 'Profile', icon: User },
];

// Admin/HR: full control
const adminNav = [
  { to: '/dashboard/admin', label: 'Admin Dashboard', icon: Shield },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/payroll', label: 'Payroll', icon: Wallet },
  { to: '/leave/approvals', label: 'Leave Approvals', icon: FileText },
  { to: '/leave/team', label: 'Team Calendar', icon: CalendarDays },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/profile', label: 'Profile', icon: User },
];

function getNavForRole(role) {
  const r = String(role || '').toUpperCase();
  if (r === ROLES.ADMIN) return adminNav;
  if (r === ROLES.MANAGER) return managerNav;
  return employeeNav;
}

function getPortalLabel(role) {
  const r = String(role || '').toUpperCase();
  if (r === ROLES.ADMIN) return 'Admin Portal';
  if (r === ROLES.MANAGER) return 'Manager Portal';
  return 'Employee Portal';
}

function getPortalIcon(role) {
  const r = String(role || '').toUpperCase();
  if (r === ROLES.ADMIN) return Shield;
  if (r === ROLES.MANAGER) return UsersRound;
  return Briefcase;
}

export default function Sidebar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const role = user?.role ?? ROLES.EMPLOYEE;
  const navItems = getNavForRole(role);
  const PortalIcon = getPortalIcon(role);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow border border-gray-200"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div
            className={`flex flex-col p-4 border-b border-gray-200 ${
              String(role || '').toUpperCase() === ROLES.ADMIN
                ? 'bg-slate-800 text-white'
                : String(role || '').toUpperCase() === ROLES.MANAGER
                  ? 'bg-teal-700 text-white'
                  : 'bg-primary-600 text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PortalIcon className="w-6 h-6 shrink-0" />
                <span className="text-lg font-bold">{getPortalLabel(role)}</span>
              </div>
              <button
                type="button"
                className="lg:hidden p-2 rounded-lg hover:bg-white/10"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs opacity-90 mt-1">
              {user?.name ?? 'User'} · {role}
            </p>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
