const getToken = () => localStorage.getItem('token');

const getUser = () => {
  try { return JSON.parse(localStorage.getItem('user')); }
  catch { return null; }
};

const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));

const isLoggedIn = () => !!getToken();

const requireAuth = () => {
  if (!getToken()) {
    window.location.href = '/pages/login.html';
    return false;
  }
  return true;
};

const logout = async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {}

  localStorage.clear();
  window.location.href = '/pages/login.html';
};

const apiRequest = async (url, method = 'GET', body = null) => {
  const token = getToken();

  // handle object input safely
  if (typeof method === 'object') {
    body = method.body || null;
    method = method.method || 'GET';
  }

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : null
  });

  if (res.status === 401) {
    logout();
    return null;
  }

  // 🔥 FIX: handle HTML response safely
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    console.error("NOT JSON RESPONSE:", text);
    return null;
  }
};
const getAvatarUrl = (path) => {
  if (!path) return getDefaultAvatar();
  if (path.startsWith('http')) return path;
  return path;
};

const getDefaultAvatar = () =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%2313131f'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2300f5ff' opacity='0.7'/%3E%3Cellipse cx='50' cy='80' rx='28' ry='18' fill='%2300f5ff' opacity='0.4'/%3E%3C/svg%3E`;

// NAVIGATION
function goToDashboard() {
  window.location.href = '/pages/dashboard.html';
}

function goToPlay() {
  window.location.href = '/pages/quiz.html';
}

// SIMPLE TOAST
const showToast = (msg) => alert(msg);