/**
 * Tasks API – GET/POST /api/tasks, status ToDo|InProgress|Done, priority High|Medium|Low, deadline, progressPercent
 */

import api from './api';

export const taskService = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (body) => api.post('/tasks', body),
  update: (id, body) => api.patch(`/tasks/${id}`, body),
  delete: (id) => api.delete(`/tasks/${id}`),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  bulkStatus: (taskIds, status) => api.post('/tasks/bulk/status', { taskIds, status }),
  getComments: (id) => api.get(`/tasks/${id}`).then((r) => ({ data: { data: r.data?.data?.comments ?? [] } })),
  addComment: (id, text) => api.post(`/tasks/${id}/comments`, { text }),
  addAttachments: (id, formData) =>
    api.post(`/tasks/${id}/attachments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};
