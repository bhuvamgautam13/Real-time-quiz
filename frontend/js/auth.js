import { apiRequest, isLoggedIn, setUser, showToast } from "./utils.js";

document.addEventListener('DOMContentLoaded', async () => {

  const params = new URLSearchParams(window.location.search);
  const googleToken = params.get('token');

  // GOOGLE LOGIN
  if (googleToken) {
    localStorage.setItem('token', googleToken);

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${googleToken}` }
      });

      const data = await res.json();

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      }
    } catch (err) {
      console.error(err);
    }

    window.location.href = '/pages/dashboard.html';
    return;
  }

  // ALREADY LOGGED IN
  if (isLoggedIn()) {
    window.location.href = '/pages/dashboard.html';
    return;
  }

  // LOGIN
  const loginForm = document.getElementById('loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const data = await apiRequest(
        '/api/auth/login',
        'POST',
        {
          email: document.getElementById('email').value.trim(),
          password: document.getElementById('password').value
        }
      );

      if (data?.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);

        showToast('Login successful');

        window.location.href = '/pages/dashboard.html';
      } else {
        showToast('Login failed');
      }
    });
  }
});