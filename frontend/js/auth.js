console.log("AUTH JS LOADED");

document.addEventListener('DOMContentLoaded', async () => {

  const params = new URLSearchParams(window.location.search);
  const googleToken = params.get('token');

  console.log("TOKEN:", googleToken);

  // =========================
  // GOOGLE LOGIN
  // =========================
  if (googleToken) {
    console.log("Processing Google login...");

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
        window.location.href = '/pages/dashboard.html';
        return;
      } else {
        throw new Error("No user returned");
      }

    } catch (err) {
      console.error(err);
      localStorage.clear();
    }
  }

  // =========================
  // ALREADY LOGGED IN
  // =========================
  if (isLoggedIn()) {
    window.location.href = '/pages/dashboard.html';
    return;
  }

  // =========================
  // LOGIN
  // =========================
  const loginForm = document.getElementById('loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      console.log("LOGIN CLICKED");

      const data = await apiRequest(
        '/api/auth/login',
        'POST',
        {
          email: document.getElementById('email').value.trim(),
          password: document.getElementById('password').value
        }
      );

      console.log("LOGIN RESPONSE:", data);

      if (data?.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);

        showToast('Login successful');

        window.location.href = '/pages/dashboard.html';
      } else {
        showToast(data?.message || 'Login failed');
      }
    });
  }

  // =========================
  // SIGNUP (🔥 THIS WAS MISSING)
  // =========================
  const signupForm = document.getElementById('signupForm');

  if (signupForm) {
    console.log("Signup form detected");

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      console.log("SIGNUP CLICKED");

      const formData = new FormData();
      formData.append('username', document.getElementById('username').value.trim());
      formData.append('email', document.getElementById('email').value.trim());
      formData.append('password', document.getElementById('password').value);

      const file = document.getElementById('avatarInput')?.files[0];
      if (file) formData.append('profilePicture', file);

      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();

        console.log("SIGNUP RESPONSE:", data);

        if (data.success) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));

          showToast('Account created successfully');

          window.location.href = '/pages/dashboard.html';
        } else {
          showToast(data.message || 'Signup failed');
        }

      } catch (err) {
        console.error(err);
        showToast('Signup error');
      }
    });
  }

});