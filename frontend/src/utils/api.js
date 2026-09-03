import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (username, password, name) => api.post('/auth/register', { username, password, name }),
  getMe: () => api.get('/auth/me')
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getCostByModel: (days = 30) => api.get(`/dashboard/cost-by-model?days=${days}`),
  getCostByProvider: (days = 30) => api.get(`/dashboard/cost-by-provider?days=${days}`),
  getDailyTrend: (days = 30) => api.get(`/dashboard/daily-trend?days=${days}`),
  getHourlyPattern: () => api.get('/dashboard/hourly-pattern')
};

export const logsAPI = {
  getLogs: (params) => api.get('/logs', { params }),
  getRecent: (limit = 10) => api.get(`/logs/recent?limit=${limit}`),
  createLog: (data) => api.post('/logs', data),
  deleteLog: (id) => api.delete(`/logs/${id}`)
};

export const teamsAPI = {
  getTeams: () => api.get('/teams'),
  createTeam: (data) => api.post('/teams', data),
  updateTeam: (id, data) => api.put(`/teams/${id}`, data),
  getMembers: (id) => api.get(`/teams/${id}/members`),
  addMember: (id, data) => api.post(`/teams/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/teams/${id}/members/${userId}`),
  getTeamCosts: (id, days = 30) => api.get(`/teams/${id}/costs?days=${days}`)
};

export const projectsAPI = {
  getProjects: () => api.get('/projects'),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  getProjectCosts: (id, days = 30) => api.get(`/projects/${id}/costs?days=${days}`)
};

export const apiKeysAPI = {
  getKeys: () => api.get('/api-keys'),
  createKey: (data) => api.post('/api-keys', data),
  toggleKey: (id) => api.put(`/api-keys/${id}/toggle`),
  deleteKey: (id) => api.delete(`/api-keys/${id}`)
};

export const alertsAPI = {
  getAlerts: () => api.get('/alerts'),
  createAlert: (data) => api.post('/alerts', data),
  updateAlert: (id, data) => api.put(`/alerts/${id}`, data),
  deleteAlert: (id) => api.delete(`/alerts/${id}`),
  getNotifications: (limit = 20) => api.get(`/alerts/notifications?limit=${limit}`),
  markRead: (id) => api.put(`/alerts/notifications/${id}/read`),
  checkAlerts: () => api.post('/alerts/check')
};

export const auditAPI = {
  getLogs: (params) => api.get('/audit', { params })
};

export const exportAPI = {
  downloadCSV: (params) => api.get('/export/csv', { params, responseType: 'blob' }),
  getSummary: (days = 30) => api.get(`/export/summary?days=${days}`)
};

export const preferencesAPI = {
  get: () => api.get('/preferences'),
  update: (data) => api.put('/preferences', data)
};

export const analyticsAPI = {
  getPromptEfficiency: (days = 30) => api.get(`/analytics/prompt-efficiency?days=${days}`),
  getForecast: () => api.get('/analytics/forecast'),
  getModelComparison: (days = 30) => api.get(`/analytics/model-comparison?days=${days}`)
};

export default api;
