let currentTab = 'daily';

document.addEventListener('DOMContentLoaded', () => {
  loadLeaderboard('daily');
  connectSocket();
});

async function loadLeaderboard(type) {
  currentTab = type;
  const endpoint = type === 'daily' ? '/api/leaderboard/daily' : '/api/leaderboard/all-time';
  const data = await apiRequest(endpoint);
  if (!data?.success) { showToast('Failed to load leaderboard.', 'error'); return; }
  renderAll(data.leaderboard);
}

function renderAll(entries) {
  renderPodium(entries.slice(0, 3));
  renderTable(entries);
}

function renderPodium(top) {
  const el = document.getElementById('podium');
  if (!top.length) { el.innerHTML = `<p style="color:var(--text-muted);text-align:center;width:100%">No scores yet today — be first!</p>`; return; }

  const order   = [top[1], top[0], top[2]].filter(Boolean);
  const classes = ['podium-2', 'podium-1', 'podium-3'];
  const medals  = ['🥈', '🥇', '🥉'];

  el.innerHTML = order.map((e, i) => `
    <div class="podium-place ${classes[i]}">
      <img src="${getAvatarUrl(e.profilePicture)}" class="podium-avatar" onerror="this.src='${getDefaultAvatar()}'" alt="${e.username}"/>
      <div class="podium-name">${e.username}</div>
      <div class="podium-score">${e.bestScore} pts</div>
      <div class="podium-block">${medals[i]}</div>
    </div>`).join('');
}

function renderTable(entries) {
  const tbody = document.getElementById('leaderboardBody');
  const me    = getUser();
  if (!entries.length) {
    tbody.innerHTML = `<tr><td colspan="3"><div style="text-align:center;padding:40px;color:var(--text-muted)">No scores for this period.</div></td></tr>`;
    return;
  }
  const medals = ['🥇', '🥈', '🥉'];
  tbody.innerHTML = entries.map((e, i) => {
    const isMe = me && e.username === me.username;
    return `
      <tr class="lb-row" ${isMe ? 'style="border-color:rgba(0,245,255,0.4)"' : ''}>
        <td><div class="lb-rank ${i < 3 ? `rank-${i+1}` : ''}">${i < 3 ? medals[i] : '#' + (i + 1)}</div></td>
        <td>
          <div class="lb-user">
            <img src="${getAvatarUrl(e.profilePicture)}" class="lb-avatar" onerror="this.src='${getDefaultAvatar()}'" alt="${e.username}"/>
            <div>
              <div class="lb-username">${e.username}${isMe ? ' <span class="badge-you">YOU</span>' : ''}</div>
              <div class="lb-sub">${e.correctAnswers ?? '--'} correct answers</div>
            </div>
          </div>
        </td>
        <td><div class="lb-score">${e.bestScore}</div></td>
      </tr>`;
  }).join('');
}

function switchTab(type, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadLeaderboard(type);
}

function connectSocket() {
  const token = getToken();
  const socket = io('/', { auth: token ? { token } : {}, reconnection: true });
  socket.on('connect', () => socket.emit('request-leaderboard'));
  socket.on('leaderboard-data', ({ leaderboard }) => { if (currentTab === 'daily') renderAll(leaderboard); });
  socket.on('new-score-update', ({ triggerUser, leaderboard }) => {
    if (currentTab === 'daily') renderAll(leaderboard);
    showToast(`🔥 ${triggerUser} just submitted a score!`, 'info');
  });
}