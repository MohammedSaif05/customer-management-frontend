/**
 * Top navbar – role badge, user menu, logout
 */

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';
import { ROLES } from '../../utils/constants';

function RoleBadge({ role }) {
  const styles = {
    [ROLES.ADMIN]: 'bg-slate-800 text-white',
    [ROLES.MANAGER]: 'bg-teal-600 text-white',
    [ROLES.EMPLOYEE]: 'bg-primary-600 text-white',
  };
  return (
    <span
      className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        styles[role] ?? 'bg-gray-600 text-white'
      }`}
    >
      {role}
    </span>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 h-14 px-4 lg:pl-72 flex items-center justify-between bg-white border-b border-gray-200 shadow-sm">
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <RoleBadge role={user?.role ?? ROLES.EMPLOYEE} />
      </div>
      <div className="flex items-center gap-4">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-sm">
              {user?.name ? getInitials(user.name) : '?'}
            </div>
            <span className="hidden sm:inline text-sm font-medium text-gray-700 truncate max-w-[120px]">
              {user?.name || 'User'}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 mt-1 w-48 py-1 bg-white rounded-lg shadow-lg border border-gray-200"
              role="menu"
            >
              <Link
                to="/profile"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <button
                type="button"
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
