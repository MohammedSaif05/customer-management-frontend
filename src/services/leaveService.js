/**
 * Leave API – POST/GET /api/leaves, leaveType, fromDate, toDate, GET /api/leaves/balance, PATCH approve/reject
 */

import api from './api';

export const leaveService = {
  getBalance: (year) => api.get('/leaves/balance', { params: year ? { year } : {} }),
  getBalanceForUser: (userId, year) => api.get(`/leaves/balance/${userId}`, { params: year ? { year } : {} }),
  apply: (body) => api.post('/leaves', body),
  getAll: (params) => api.get('/leaves', { params }),
  getById: (id) => api.get(`/leaves/${id}`),
  approve: (id, body = { action: 'approve' }) => api.patch(`/leaves/${id}/approve`, body),
  reject: (id, rejectionReason) => api.patch(`/leaves/${id}/approve`, { action: 'reject', rejectionReason }),
};
