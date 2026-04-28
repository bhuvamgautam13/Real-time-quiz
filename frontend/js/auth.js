import { apiRequest, isLoggedIn, setUser, showToast } from "./utils.js";

document.addEventListener('DOMContentLoaded', async () => {

  const params = new URLSearchParams(window.location.search);
  const googleToken = params.get('token');

  // ✅ GOOGLE LOGIN FLOW
  if (googleToken) {
    localStorage.setItem('token', googleToken);

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${googleToken}`
        }
      });

      const data = await res.json();

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      }

    } catch (err) {
      console.error('User fetch failed', err);
    }

    window.location.href = '/frontend/pages/dashboard.html';
    return;
  }

  // ✅ Already logged in → redirect
  if (isLoggedIn()) {
    window.location.href = '/frontend/pages/dashboard.html';
    return;
  }

  // =========================
  // ✅ SIGNUP
  // =========================
  const signupForm = document.getElementById('signupForm');

  if (signupForm) {
    const avatarInput = document.getElementById('avatarInput');

    if (avatarInput) {
      avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
          document.getElementById('avatarPreview').src = ev.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = signupForm.querySelector('[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'CREATING...';

      const formData = new FormData();
      formData.append('username', document.getElementById('username').value.trim());
      formData.append('email', document.getElementById('email').value.trim());
      formData.append('password', document.getElementById('password').value);

      const file = document.getElementById('avatarInput')?.files[0];
      if (file) formData.append('profilePicture', file);

      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        const data = await res.json();

        if (data.success) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));

          setUser(data.user);

          showToast('Account created!', 'success');

          setTimeout(() => {
            window.location.href = '/frontend/pages/dashboard.html';
          }, 1200);

        } else {
          throw new Error(data.message);
        }

      } catch (err) {
        showToast(err.message || 'Signup failed', 'error');
        btn.disabled = false;
        btn.textContent = 'CREATE ACCOUNT →';
      }
    });
  }

  // =========================
  // ✅ LOGIN
  // =========================
  const loginForm = document.getElementById('loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = loginForm.querySelector('[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'SIGNING IN...';

      try {
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

          showToast('Welcome back!', 'success');

          setTimeout(() => {
            window.location.href = '/frontend/pages/dashboard.html';
          }, 1000);

        } else {
          throw new Error(data?.message);
        }

      } catch (err) {
        showToast(err.message || 'Login failed', 'error');
        btn.disabled = false;
        btn.textContent = 'SIGN IN →';
      }
    });
  }

});