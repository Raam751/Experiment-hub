const API_BASE = 'http://localhost:3000';

function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

export function isLoggedIn() {
  return !!getToken();
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || data?.error || 'Request failed');
  return data;
}

// Auth
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const register = (email, password, role) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, role }) });

// Experiments
export const getExperiments = () => request('/experiments');
export const getExperiment = (id) => request(`/experiments/${id}`);
export const createExperiment = (name, description) =>
  request('/experiments', { method: 'POST', body: JSON.stringify({ name, description }) });
export const updateExperimentStatus = (id, status) =>
  request(`/experiments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const deleteExperiment = (id) =>
  request(`/experiments/${id}`, { method: 'DELETE' });

// Variants
export const getVariants = (expId) => request(`/experiments/${expId}/variants`);
export const createVariant = (expId, name, weight, is_control) =>
  request(`/experiments/${expId}/variants`, { method: 'POST', body: JSON.stringify({ name, weight, is_control }) });

// Metrics
export const getMetrics = (expId, compute = false) =>
  request(`/experiments/${expId}/metrics${compute ? '?compute=true' : ''}`);

// Optimize
export const triggerOptimize = (expId) =>
  request(`/experiments/${expId}/optimize`, { method: 'POST' });
