const getToken = () => localStorage.getItem('token');
const getUser  = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };
const setUser  = (user) => localStorage.setItem('user', JSON.stringify(user));
const isLoggedIn = () => !!getToken();

const requireAuth = () => {
  const token = localStorage.getItem('token');

  if (!token && !window.location.search.includes('token')) {
    window.location.href = '/pages/login.html';
    return false;
  }

  return true;
};

const logout = async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch (_) {}
  localStorage.clear();
  window.location.href = '/pages/login.html';
};

const apiRequest = async (url, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (res.status === 401) {
      logout();
      return null;
    }

    return res.json();
  } catch (err) {
    console.error('API request failed:', err);
    return null;
  }
};

const showToast = (message, type = 'info', duration = 3500) => {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 400);
  }, duration);
};

const getAvatarUrl = (path) => {
  if (!path) return getDefaultAvatar();
  if (path.startsWith('http')) return path;
  return path;
};

const getDefaultAvatar = () =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%2313131f'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2300f5ff' opacity='0.7'/%3E%3Cellipse cx='50' cy='80' rx='28' ry='18' fill='%2300f5ff' opacity='0.4'/%3E%3C/svg%3E`;

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};