/**
 * Auth API – matches API doc: login returns user, accessToken, refreshToken
 */

import api from './api';

export const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token, password) =>
    api.post('/auth/reset-password', { token, password }),

  refreshToken: (refreshToken) =>
    api.post('/auth/refresh', { refreshToken }),

  logout: (refreshToken) =>
    api.post('/auth/logout', refreshToken ? { refreshToken } : {}),

  /** Get current user – API has GET /api/users/:id (no /auth/me); call with userId from stored user */
  getProfile: (userId) =>
    api.get(`/users/${userId}`),
};
