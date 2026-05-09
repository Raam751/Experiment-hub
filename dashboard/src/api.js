const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function decodeTokenPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeTokenPayload(token);
  if (!payload || !payload.exp) return true;
  return payload.exp * 1000 < Date.now();
}

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
  const token = getToken();
  if (!token) return false;
  if (isTokenExpired(token)) {
    clearToken();
    return false;
  }
  return true;
}

export function getStoredUser() {
  const token = getToken();
  if (!token || isTokenExpired(token)) {
    clearToken();
    return null;
  }
  const payload = decodeTokenPayload(token);
  if (!payload) return null;
  return { id: payload.id, email: payload.email, role: payload.role };
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('Server returned an unexpected response');
  }

  if (!res.ok) throw new Error(data?.error?.message || data?.error || 'Request failed');
  return data;
}

// Auth
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const register = (email, password) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });

// Experiments
export const getExperiments = () => request('/experiments');
export const getExperimentStats = () => request('/experiments/stats');
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

// Simulate
export const simulateTraffic = (expId, userCount, conversionRates) =>
  request(`/experiments/${expId}/simulate`, {
    method: 'POST',
    body: JSON.stringify({ userCount, conversionRates })
  });

// Assignment Preview
export const previewAssignment = (expId, userId) =>
  request(`/experiments/${expId}/assignment-preview?user_id=${encodeURIComponent(userId)}`);
