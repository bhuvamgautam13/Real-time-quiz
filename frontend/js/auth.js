
console.log("AUTH JS LOADED");
document.addEventListener('DOMContentLoaded', async () => {

 const params = new URLSearchParams(window.location.search);
const googleToken = params.get('token');

console.log("TOKEN:", googleToken);

if (googleToken) {
  console.log("Processing Google login...");

  localStorage.setItem('token', googleToken);

  fetch('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${googleToken}`
    }
  })
    .then(res => res.json())
    .then(data => {
      console.log("USER:", data);

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));

        window.location.href = '/pages/dashboard.html';
      } else {
        throw new Error("No user returned");
      }
    })
    .catch(err => {
      console.error(err);
      localStorage.clear();
    });
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