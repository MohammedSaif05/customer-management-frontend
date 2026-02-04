/**
 * Payroll API – salary slips & YTD
 * Base: /api/payroll
 */

import api from './api';

export const payrollService = {
  getAll: (params) => api.get('/payroll', { params }),
  getById: (id) => api.get(`/payroll/${id}`),
  download: (id) => api.get(`/payroll/${id}/download`, { responseType: 'blob' }),
  // Year‑to‑date for logged‑in user
  getYtd: (year) => api.get('/payroll/ytd', { params: year ? { year } : {} }),
  // Year‑to‑date for specific employee (admin/manager only)
  getYtdForEmployee: (employeeId, year) =>
    api.get(`/payroll/ytd/${employeeId}`, { params: year ? { year } : {} }),
  // Generate salary slip (create payroll + PDF)
  generate: (payload) => api.post('/payroll/generate', payload),
};
