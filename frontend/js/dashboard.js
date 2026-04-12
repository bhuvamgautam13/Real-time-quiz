document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  const params = new URLSearchParams(window.location.search);
  const googleToken = params.get('token');

if (googleToken) {
  console.log("Saving Google token...");

  
  localStorage.setItem('token', googleToken);

  
  window.history.replaceState({}, document.title, '/pages/dashboard.html');

  
}
  await Promise.all([loadProfile(), loadMyScores()]);
  connectLiveFeed();
});
async function loadProfile() {
  const data = await apiRequest('/api/auth/me');
  if (!data?.success) return;

  const u = data.user;
  setUser(u);

  document.getElementById('profileUsername').textContent = u.username;
  document.getElementById('profileEmail').textContent = u.email;

  const avatar = document.getElementById('profileAvatar');
  avatar.src = getAvatarUrl(u.profilePicture);
  avatar.onerror = () => { avatar.src = getDefaultAvatar(); };

  document.getElementById('statTotalScore').textContent = u.totalScore.toLocaleString();
  document.getElementById('statHighScore').textContent  = u.highScore.toLocaleString();
  document.getElementById('statGames').textContent      = u.gamesPlayed;

  const avg = u.gamesPlayed > 0
    ? Math.min(100, Math.round((u.totalCorrectAnswers / (u.gamesPlayed * 15)) * 100))
    : 0;
  document.getElementById('statAccuracy').textContent = avg + '%';
  document.getElementById('gamesBadge').textContent   = `${u.gamesPlayed} Games`;

  const rankData = await apiRequest('/api/leaderboard/my-rank');
  if (rankData?.success && rankData.rank) {
    document.getElementById('rankBadge').textContent = `Rank #${rankData.rank}`;
  }
}

async function loadMyScores() {
  const data = await apiRequest('/api/quiz/my-scores?limit=8');
  const container = document.getElementById('scoresList');
  if (!container) return;

  if (!data?.success || !data.scores.length) {
    container.innerHTML = `
      <div style="text-align:center;color:var(--text-muted);padding:40px;">
        <div style="font-size:2.5rem;margin-bottom:12px">🎮</div>
        <p>No games played yet. Start your first quiz!</p>
      </div>`;
    return;
  }

  const medals = ['🏆', '🥇', '🥈', '🥉', '🎮', '🎮', '🎮', '🎮'];
  container.innerHTML = data.scores.map((s, i) => `
    <div class="score-row">
      <div class="game-info">
        <span class="game-icon">${s.points >= 150 ? '🏆' : s.points >= 100 ? '🥇' : s.points >= 70 ? '🥈' : '🎮'}</span>
        <div class="game-meta">
          <h4>${s.correctAnswers}/${s.totalQuestions} correct</h4>
          <span>${timeAgo(s.createdAt)}</span>
        </div>
      </div>
      <div class="score-points">${s.points}</div>
    </div>
  `).join('');
}

function connectLiveFeed() {
  const token = getToken();
  if (!token) return;

  const socket = io('/', { auth: { token }, reconnection: true });

  socket.on('connect', () => socket.emit('request-leaderboard'));

  socket.on('new-score-update', ({ triggerUser, leaderboard }) => {
    pushFeedItem(`🏆 <strong>${triggerUser}</strong> just finished a quiz!`);
    const me = getUser();
    if (me) {
      const myEntry = leaderboard.find(e => e.username === me.username);
      if (myEntry) {
        const rank = leaderboard.indexOf(myEntry) + 1;
        document.getElementById('rankBadge').textContent = `Rank #${rank}`;
      }
    }
  });
}

function pushFeedItem(html) {
  const feed = document.getElementById('liveFeed');
  if (!feed) return;
  const item = document.createElement('div');
  item.className = 'feed-item';
  item.innerHTML = `<span class="feed-time">${new Date().toLocaleTimeString()}</span> ${html}`;
  feed.insertBefore(item, feed.firstChild);
  while (feed.children.length > 20) feed.removeChild(feed.lastChild);
}