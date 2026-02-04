/**
 * Reimbursements API – POST/GET /api/reimbursements, PATCH /api/reimbursements/:id/action
 */

import api from './api';

export const reimbursementService = {
  getAll: (params) => api.get('/reimbursements', { params }),
  getById: (id) => api.get(`/reimbursements/${id}`),
  create: (body) => api.post('/reimbursements', body),
  createWithReceipts: (formData) =>
    api.post('/reimbursements', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  action: (id, action, rejectionReason) =>
    api.patch(`/reimbursements/${id}/action`, { action, ...(rejectionReason ? { rejectionReason } : {}) }),
};
