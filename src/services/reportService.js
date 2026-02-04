/**
 * Reports API – GET /api/reports/attendance, payroll, leave
 */

import api from './api';

export const reportService = {
  attendance: (params) => api.get('/reports/attendance', { params }),
  payroll: (params) => api.get('/reports/payroll', { params }),
  leave: (params) => api.get('/reports/leave', { params }),
};
