const BACKEND_URL   = 'http://localhost:3000';
const QUESTION_TIME = 10;

const state = {
  playerName:      '',
  playerScore:     0,
  questions:       [],
  currentQ:        0,
  selectedOption:  null,
  timerInterval:   null,
  timerLeft:       QUESTION_TIME,
  answered:        false,
  leaderboard:     [],
  onlinePlayers:   0,
};

const $ = id => document.getElementById(id);

const screens = {
  join:        $('join-screen'),
  quiz:        $('quiz-screen'),
  leaderboard: $('leaderboard-screen'),
};

const playerNameInput = $('player-name');
const joinBtn         = $('join-btn');
const joinError       = $('join-error');
const liveCount       = $('live-count');
const joinTicker      = $('join-ticker');
const tickerInner     = joinTicker.querySelector('.ticker-inner');

const currentPlayerName = $('current-player-name');
const playerScoreEl     = $('player-score');
const questionCounter   = $('question-counter');
const ringFill          = $('ring-fill');
const timerLabel        = $('timer-label');
const progressBar       = $('progress-bar');
const questionText      = $('question-text');
const optionsGrid       = $('options-grid');
const submitBtn         = $('submit-btn');

const leaderboardList = $('leaderboard-list');
const playAgainBtn    = $('play-again-btn');

const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
});

socket.on('connect', () => {
  console.log('[Socket] Connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('[Socket] Disconnected');
  showToast('Disconnected from server', '');
});

socket.on('connect_error', (err) => {
  console.warn('[Socket] Connection error:', err.message);
});

socket.on('playerJoined', (data) => {
  const { name, count } = data || {};

  if (typeof count === 'number') {
    state.onlinePlayers = count;
    liveCount.textContent = `${count} player${count !== 1 ? 's' : ''} online`;
  }

  if (name) {
    tickerInner.textContent = `⚡ ${name} just joined the quiz!`;
    joinTicker.classList.remove('hidden');
    clearTimeout(joinTicker._hideTimer);
    joinTicker._hideTimer = setTimeout(() => {
      joinTicker.classList.add('hidden');
    }, 6500);
  }
});

socket.on('scoreUpdated', (data) => {
  const list = Array.isArray(data) ? data : (data?.leaderboard || []);
  updateLeaderboard(list, true);
});

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
  screens[name].style.animation = 'none';
  screens[name].offsetHeight;
  screens[name].style.animation = '';
}

joinBtn.addEventListener('click', handleJoin);
playerNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleJoin();
});

async function handleJoin() {
  const name = playerNameInput.value.trim();

  if (!name || name.length < 1) {
    joinError.classList.remove('hidden');
    playerNameInput.focus();
    return;
  }
  joinError.classList.add('hidden');

  state.playerName = name;
  currentPlayerName.textContent = name;

  socket.emit('joinQuiz', { name });
  console.log('[Socket] Emitted joinQuiz:', { name });

  try {
    joinBtn.disabled = true;
    joinBtn.querySelector('.btn-text').textContent = 'Loading…';

    const questions = await fetchQuestions();
    state.questions = questions;
    state.currentQ  = 0;
    state.playerScore = 0;

    showScreen('quiz');
    renderQuestion();
  } catch (err) {
    console.error('[API] Failed to fetch questions:', err);
    joinBtn.disabled = false;
    joinBtn.querySelector('.btn-text').textContent = 'Join Quiz';
    showToast('Could not load questions. Is the server running?', '');
  }
}

async function fetchQuestions() {
  const res = await fetch(`${BACKEND_URL}/questions`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.questions || []);
}

function renderQuestion() {
  const total = state.questions.length;
  const idx   = state.currentQ;

  if (idx >= total) {
    endQuiz();
    return;
  }

  const q = state.questions[idx];
  state.selectedOption = null;
  state.answered       = false;
  submitBtn.disabled   = true;

  progressBar.style.width = `${(idx / total) * 100}%`;

  questionCounter.textContent = `Q ${idx + 1} / ${total}`;

  questionText.style.opacity = '0';
  questionText.style.transform = 'translateY(8px)';
  questionText.textContent = q.text || q.question || 'Question text missing';
  requestAnimationFrame(() => {
    questionText.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
    questionText.style.opacity    = '1';
    questionText.style.transform  = 'translateY(0)';
  });

  renderOptions(q.options || []);
  startTimer();
}

const LABELS = ['A', 'B', 'C', 'D'];

function renderOptions(options) {
  optionsGrid.innerHTML = '';

  options.forEach((optText, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `
      <span class="option-label">${LABELS[i] || i + 1}</span>
      <span class="option-text">${optText}</span>
    `;
    btn.addEventListener('click', () => selectOption(i, btn));
    optionsGrid.appendChild(btn);
  });
}

function selectOption(index, btnEl) {
  if (state.answered) return;

  optionsGrid.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));

  btnEl.classList.add('selected');
  state.selectedOption = index;
  submitBtn.disabled   = false;
}

const CIRCUMFERENCE = 2 * Math.PI * 20;

function startTimer() {
  clearInterval(state.timerInterval);
  state.timerLeft = QUESTION_TIME;

  updateTimerUI(QUESTION_TIME);
  ringFill.classList.remove('warning');

  state.timerInterval = setInterval(() => {
    state.timerLeft--;
    updateTimerUI(state.timerLeft);

    if (state.timerLeft <= 3) ringFill.classList.add('warning');

    if (state.timerLeft <= 0) {
      clearInterval(state.timerInterval);
      if (!state.answered) {
        submitAnswer();
      }
    }
  }, 1000);
}

function updateTimerUI(seconds) {
  timerLabel.textContent = seconds;
  const progress  = seconds / QUESTION_TIME;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  ringFill.style.strokeDashoffset = dashOffset;
}

function stopTimer() {
  clearInterval(state.timerInterval);
}

submitBtn.addEventListener('click', submitAnswer);

function submitAnswer() {
  if (state.answered) return;
  state.answered = true;

  stopTimer();
  submitBtn.disabled = true;

  const q          = state.questions[state.currentQ];
  const selected   = state.selectedOption;
  const timeLeft   = state.timerLeft;

  const selectedText = selected !== null ? q.options[selected] : null;
  const isCorrect    = selectedText !== null && selectedText === q.answer;
  const points       = isCorrect ? Math.max(100, 100 + timeLeft * 10) : 0;

  if (isCorrect) {
    state.playerScore += points;
    playerScoreEl.textContent = state.playerScore;
    showToast(`✓ Correct! +${points} pts`, 'correct-toast');
  } else if (selected !== null) {
    showToast('✗ Wrong answer', 'incorrect-toast');
  } else {
    showToast('⏱ Time\'s up!', '');
  }

  revealAnswer(q);

  const payload = {
    name:       state.playerName,
    playerName: state.playerName,
    questionId: q.id ?? state.currentQ,
    answer:     selectedText,
    score:      state.playerScore,
    timeLeft,
  };
  socket.emit('submitAnswer', payload);
  console.log('[Socket] Emitted submitAnswer:', payload);

  setTimeout(() => {
    state.currentQ++;
    renderQuestion();
  }, 1800);
}

function revealAnswer(q) {
  const btns = optionsGrid.querySelectorAll('.option-btn');
  btns.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answer) btn.classList.add('correct');
    else if (i === state.selectedOption) btn.classList.add('incorrect');
  });
}

function endQuiz() {
  stopTimer();

  upsertLocalScore();

  const sorted = [...state.leaderboard].sort((a, b) => b.score - a.score);
  updateLeaderboard(sorted, false);

  progressBar.style.width = '100%';

  showScreen('leaderboard');
}

function upsertLocalScore() {
  const existing = state.leaderboard.find(p => p.name === state.playerName);
  if (existing) {
    existing.score = state.playerScore;
  } else {
    state.leaderboard.push({ name: state.playerName, score: state.playerScore });
  }
}

function updateLeaderboard(list, flash = false) {
  list.forEach(entry => {
    const existing = state.leaderboard.find(p => p.name === entry.name);
    if (existing) {
      existing.score = entry.score;
    } else {
      state.leaderboard.push({ ...entry });
    }
  });

  const sorted = [...state.leaderboard].sort((a, b) => b.score - a.score);

  if (!screens.leaderboard.classList.contains('active')) return;

  leaderboardList.innerHTML = '';

  sorted.forEach((player, i) => {
    const rank    = i + 1;
    const isMe    = player.name === state.playerName;
    const medals  = ['🥇', '🥈', '🥉'];
    const rankStr = medals[i] ?? rank;

    const li = document.createElement('li');
    li.className = `lb-item rank-${rank <= 3 ? rank : 'other'}`;
    li.style.animationDelay = `${i * 0.07}s`;
    if (flash) li.classList.add('updated');

    li.innerHTML = `
      <span class="lb-rank">${rankStr}</span>
      <span class="lb-name${isMe ? ' is-me' : ''}">${escapeHTML(player.name)}</span>
      <span class="lb-score">${player.score} pts</span>
    `;
    leaderboardList.appendChild(li);
  });
}

playAgainBtn.addEventListener('click', () => {
  state.playerName    = '';
  state.playerScore   = 0;
  state.questions     = [];
  state.currentQ      = 0;
  state.selectedOption = null;
  state.answered      = false;
  state.leaderboard   = [];

  playerNameInput.value          = '';
  playerScoreEl.textContent      = '0';
  joinBtn.disabled               = false;
  joinBtn.querySelector('.btn-text').textContent = 'Join Quiz';
  progressBar.style.width        = '0%';

  showScreen('join');
});

let toastTimeout;
function showToast(message, cls) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent    = message;
  toast.className      = `toast${cls ? ' ' + cls : ''}`;
  toast.classList.add('show');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2400);
}

(function initParticles() {
  const canvas = $('particle-canvas');
  const ctx    = canvas.getContext('2d');
  let   W, H, particles = [];
  const COUNT  = 55;
  const COLORS = ['#f0e040', '#3dffc0', '#ff4f7b'];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() { this.reset(true); }
    reset(init) {
      this.x  = Math.random() * W;
      this.y  = init ? Math.random() * H : H + 8;
      this.r  = Math.random() * 1.8 + 0.4;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = -(Math.random() * 0.5 + 0.2);
      this.a  = Math.random() * 0.55 + 0.15;
      this.c  = COLORS[Math.floor(Math.random() * COLORS.length)];
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.y < -10) this.reset(false);
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.c;
      ctx.globalAlpha = this.a;
      ctx.fill();
    }
  }

  for (let i = 0; i < COUNT; i++) particles.push(new Particle());

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    ctx.globalAlpha = 1;
    requestAnimationFrame(loop);
  }
  loop();
})();

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

console.log('[QuizBlitz] Ready. Connecting to', BACKEND_URL);
playerNameInput.focus();