/**
 * Role-based protected route wrapper
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.allowedRoles] - e.g. ['admin', 'manager']
 */
export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && user?.role) {
    const userRole = String(user.role).toUpperCase();
    const allowed = allowedRoles.map((r) => String(r).toUpperCase());
    if (!allowed.includes(userRole)) {
      // User is logged in but trying to access a page for another role.
      // Send them to their correct dashboard instead of showing Access Denied.
      if (userRole === ROLES.ADMIN || userRole === ROLES.MANAGER) {
        return <Navigate to="/dashboard/admin" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
