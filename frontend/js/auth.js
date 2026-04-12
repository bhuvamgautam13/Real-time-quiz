document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const googleToken = params.get('token');
  if (googleToken) {
    localStorage.setItem('token', googleToken);
    window.location.href = '/pages/dashboard.html';
    return;
  }

 if (isLoggedIn() && !window.location.search.includes('token')) {
  window.location.href = '/pages/dashboard.html';
}

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

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        showToast('Account created! Redirecting...', 'success');
        setTimeout(() => window.location.href = '/pages/dashboard.html', 1500);
      } else {
        showToast(data.message || 'Signup failed.', 'error');
        btn.disabled = false;
        btn.textContent = 'CREATE ACCOUNT →';
      }
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = loginForm.querySelector('[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'SIGNING IN...';

      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: document.getElementById('email').value.trim(),
          password: document.getElementById('password').value,
        }),
      });

      if (data?.success) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        showToast('Welcome back!', 'success');
        setTimeout(() => window.location.href = '/pages/dashboard.html', 1200);
      } else {
        showToast(data?.message || 'Invalid credentials.', 'error');
        btn.disabled = false;
        btn.textContent = 'SIGN IN →';
      }
    });
  }
});