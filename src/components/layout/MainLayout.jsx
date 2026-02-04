/**
 * Main app layout – role-specific theming (Admin, Manager, Employee)
 */

import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Breadcrumb from './Breadcrumb';

function getLayoutTheme(role) {
  if (role === ROLES.ADMIN)
    return { wrapper: 'admin-portal', mainBg: 'bg-slate-50' };
  if (role === ROLES.MANAGER)
    return { wrapper: 'manager-portal', mainBg: 'bg-teal-50/50' };
  return { wrapper: 'employee-portal', mainBg: 'bg-gray-50' };
}

export default function MainLayout() {
  const { user } = useAuth();
  const role = user?.role ?? ROLES.EMPLOYEE;
  const theme = getLayoutTheme(role);

  return (
    <div
      className={`min-h-screen ${theme.mainBg} ${theme.wrapper}`}
      data-role={role?.toLowerCase()}
    >
      <Sidebar />
      <div className="lg:pl-64 min-h-screen">
        <Navbar />
        <main className="p-4 lg:p-6">
          <div className="mb-4">
            <Breadcrumb />
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
