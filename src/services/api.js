/**
 * Centralized Axios instance – matches API doc: Base URL /api, Bearer token, unwrap success/data
 */

import axios from 'axios';

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api');

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request: attach access token (API doc: Authorization: Bearer <accessToken>)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      config.headers['x-refresh-token'] = refreshToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response: unwrap { success, data, pagination } so callers get data + pagination; normalize errors
api.interceptors.response.use(
  (response) => {
    if (response.config.responseType === 'blob') return response;
    const body = response.data;
    if (body && body.success === true && 'data' in body) {
      // Preserve pagination across inconsistent backend shapes.
      // Some endpoints return { pagination }, others return { total, page, limit, pages }.
      const pagination =
        body.pagination ??
        (body.total != null || body.page != null || body.limit != null || body.pages != null
          ? {
              total: body.total,
              page: body.page,
              limit: body.limit,
              pages: body.pages,
            }
          : undefined);
      response.data = { data: body.data, pagination };
    }
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'Request failed';
    error.userMessage = message;
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    return Promise.reject(error);
  }
);

export default api;
