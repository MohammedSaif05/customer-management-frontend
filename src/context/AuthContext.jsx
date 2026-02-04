/**
 * Auth context: JWT-based auth, session persistence, role-based access
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { isTokenExpired } from '../utils/helpers';
import { ROLES } from '../utils/constants';

const AuthContext = createContext(null);

const TOKEN_KEY = 'token';
const REFRESH_KEY = 'refreshToken';
const USER_KEY = 'user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    try {
      if (refreshToken) await authService.logout(refreshToken);
    } catch (_) {}
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authService.login(email, password);
    const { user: userData, accessToken, refreshToken } = data;
    setToken(accessToken);
    setUser(userData);
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    return userData;
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token || !user?._id || isTokenExpired(token)) {
      if (!token) setLoading(false);
      else logout();
      return;
    }
    try {
      const res = await authService.getProfile(user._id);
      const userData = res.data?.data ?? res.data;
      setUser(userData);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [token, user?._id, logout]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    if (isTokenExpired(token)) {
      logout();
      setLoading(false);
      return;
    }
    refreshUser();
  }, [token, logout, refreshUser]);

  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [logout]);

  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER;
  const isEmployee = user?.role === ROLES.EMPLOYEE;
  const canAccessAdmin = isAdmin;
  const canAccessManager = isAdmin || isManager;

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    refreshUser,
    isAdmin,
    isManager,
    isEmployee,
    canAccessAdmin,
    canAccessManager,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
