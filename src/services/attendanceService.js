/**
 * Attendance API – POST /api/attendance/clock-in, clock-out, GET /api/attendance
 */

import api from './api';

export const attendanceService = {
  clockIn: (location) => api.post('/attendance/clock-in', location ? { location } : {}),
  clockOut: () => api.post('/attendance/clock-out'),
  getAll: (params) => api.get('/attendance', { params }),
  getById: (id) => api.get(`/attendance/${id}`),
};
