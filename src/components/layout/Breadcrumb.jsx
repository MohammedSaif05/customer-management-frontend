/**
 * Breadcrumb navigation for page hierarchy
 */

import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const labelMap = {
  dashboard: 'Dashboard',
  admin: 'Admin',
  tasks: 'Tasks',
  kanban: 'Kanban',
  calendar: 'Calendar',
  payroll: 'Payroll',
  slip: 'Salary Slip',
  attendance: 'Attendance',
  reimbursements: 'Reimbursements',
  leave: 'Leave',
  history: 'History',
  team: 'Team Calendar',
  approvals: 'Approvals',
  employees: 'Employees',
  profile: 'Profile',
  reports: 'Reports',
};

export default function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  const crumbs = segments.map((segment, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    const label = labelMap[segment] || segment.replace(/-/g, ' ');
    const isLast = i === segments.length - 1;
    return { path, label: label.charAt(0).toUpperCase() + label.slice(1), isLast };
  });

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-gray-600">
      <Link to="/" className="hover:text-primary-600">
        Home
      </Link>
      {crumbs.map(({ path, label, isLast }) => (
        <span key={path} className="flex items-center gap-1">
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {isLast ? (
            <span className="font-medium text-gray-900">{label}</span>
          ) : (
            <Link to={path} className="hover:text-primary-600">
              {label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
