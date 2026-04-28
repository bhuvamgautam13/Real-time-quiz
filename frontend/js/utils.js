// ==========================
// AUTH HELPERS
// ==========================

const getToken = () => localStorage.getItem('token');

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

const isLoggedIn = () => !!getToken();

// ==========================
// REQUIRE AUTH
// ==========================

const requireAuth = () => {
  const token = getToken();

  if (!token) {
    window.location.href = '/frontend/pages/login.html';
    return false;
  }

  return true;
};

// ==========================
// LOGOUT
// ==========================

const logout = async () => {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (_) {}

  localStorage.clear();

  window.location.href = '/frontend/pages/login.html';
};

// ==========================
// API REQUEST (FIXED)
// ==========================

const apiRequest = async (url, method = 'GET', body = null) => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  try {
    const res = await fetch(url, {
      method,
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : null
    });

    // 🔥 HANDLE AUTH FAIL
    if (res.status === 401) {
      logout();
      return null;
    }

    return await res.json();

  } catch (err) {
    console.error('API request failed:', err);
    return null;
  }
};

// ==========================
// NAVIGATION HELPERS
// ==========================

function goToDashboard() {
  if (!isLoggedIn()) {
    window.location.href = '/frontend/pages/login.html';
  } else {
    window.location.href = '/frontend/pages/dashboard.html';
  }
}

function goToPlay() {
  if (!isLoggedIn()) {
    window.location.href = '/frontend/pages/login.html';
  } else {
    window.location.href = '/frontend/pages/quiz.html';
  }
}

// ==========================
// UI HELPERS
// ==========================

const showToast = (message, type = 'info', duration = 3500) => {
  let container = document.getElementById('toastContainer');

  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText =
      'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
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

// ==========================
// AVATAR
// ==========================

const getAvatarUrl = (path) => {
  if (!path) return getDefaultAvatar();
  if (path.startsWith('http')) return path;
  return path;
};

const getDefaultAvatar = () =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%2313131f'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2300f5ff' opacity='0.7'/%3E%3Cellipse cx='50' cy='80' rx='28' ry='18' fill='%2300f5ff' opacity='0.4'/%3E%3C/svg%3E`;

// ==========================
// TIME FORMAT
// ==========================

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();

  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};