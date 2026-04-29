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

  // 🔥 FIX: handle object input safely
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

  return res.json();
};

// NAVIGATION
function goToDashboard() {
  window.location.href = '/pages/dashboard.html';
}

function goToPlay() {
  window.location.href = '/pages/quiz.html';
}

// SIMPLE TOAST
const showToast = (msg) => alert(msg);