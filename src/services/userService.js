/**
 * Users (employees) API – GET/POST/PATCH /api/users, GET/PATCH /api/users/:userId/profile
 */

import api from './api';

export const userService = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (body) => api.post('/users', body),
  update: (id, body) => api.patch(`/users/${id}`, body),
  deactivate: (id) => api.post(`/users/${id}/deactivate`),
  getProfile: (userId) => api.get(`/users/${userId}/profile`),
  updateProfile: (userId, body) => api.patch(`/users/${userId}/profile`, body),
};
