let questions = [], currentIndex = 0, totalScore = 0;
let correctCount = 0, wrongCount = 0;
let socket, currentTimeRemaining = 60, answerLocked = false;
let quizStartTime;

const TOTAL_QS = 15;
const CIRCUMFERENCE = 251;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  connectSocket();
  await loadQuestions();
});

function connectSocket() {
  socket = io('/', { auth: { token: getToken() }, reconnection: true });

  socket.on('connect',       () => console.log('🔌 Socket connected'));
  socket.on('connect_error', (e) => showToast('Connection issue — timer may not sync.', 'error'));

  socket.on('timer-tick', ({ timeRemaining, questionIndex }) => {
    if (questionIndex !== currentIndex) return;
    currentTimeRemaining = timeRemaining;
    renderTimer(timeRemaining);
  });

  socket.on('time-expired', ({ questionIndex }) => {
    if (questionIndex !== currentIndex) return;
    onTimeout();
  });

  socket.on('new-score-update', ({ leaderboard }) => updateLiveRank(leaderboard));
}

async function loadQuestions() {
  const data = await apiRequest('/api/quiz/start');
  if (!data?.success) {
    showToast('Failed to load questions.', 'error');
    setTimeout(() => window.location.href = '/pages/dashboard.html', 2000);
    return;
  }
  questions     = data.questions;
  quizStartTime = Date.now();
  document.getElementById('qTotal').textContent = questions.length;
  renderQuestion(0);
}

function renderQuestion(index) {
  if (index >= questions.length) { endQuiz(); return; }
  currentIndex  = index;
  answerLocked  = false;

  const q = questions[index];
  document.getElementById('qNum').textContent        = index + 1;
  document.getElementById('questionText').textContent = q.questionText;
  document.getElementById('qCategory').textContent   = q.category;
  document.getElementById('qDifficulty').textContent = q.difficulty;
  document.getElementById('progressBar').style.width = `${((index + 1) / questions.length) * 100}%`;
  document.getElementById('currentScore').textContent = totalScore;
  document.getElementById('feedbackBar').className    = 'feedback-bar hidden';

  const labels = ['A', 'B', 'C', 'D'];
  document.getElementById('optionsGrid').innerHTML = q.options.map((opt, i) => `
    <button class="option-btn" onclick="onAnswer('${escape(opt)}', this)" data-val="${opt}">
      <span class="opt-label">${labels[i]}</span>
      <span>${opt}</span>
    </button>`).join('');

  renderTimer(60);
  socket.emit('start-question', { questionIndex: index });
}

async function onAnswer(encodedAnswer, btn) {
  if (answerLocked) return;
  answerLocked = true;
  const selectedAnswer = unescape(encodedAnswer);

  socket.emit('answer-submitted', { questionIndex: currentIndex, timeRemaining: currentTimeRemaining });

  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
  btn.classList.add('selected');

  const q = questions[currentIndex];
  const data = await apiRequest('/api/quiz/verify-answer', {
    method: 'POST',
    body: JSON.stringify({ questionId: q._id, selectedAnswer, timeRemaining: currentTimeRemaining }),
  });

  if (!data) { setTimeout(() => renderQuestion(currentIndex + 1), 2000); return; }

  const { isCorrect, correctAnswer, earnedPoints, explanation } = data;

  document.querySelectorAll('.option-btn').forEach(b => {
    if (b.dataset.val === correctAnswer) b.classList.add('correct');
    else if (b.dataset.val === selectedAnswer && !isCorrect) b.classList.add('wrong');
  });

  if (isCorrect) { totalScore += earnedPoints; correctCount++; }
  else           { wrongCount++; }

  document.getElementById('currentScore').textContent = totalScore;
  showFeedback(isCorrect, earnedPoints, explanation);
  setTimeout(() => renderQuestion(currentIndex + 1), 2300);
}

function onTimeout() {
  if (answerLocked) return;
  answerLocked = true;
  wrongCount++;
  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
  showFeedback(false, 0, 'Time expired — no answer recorded.');
  setTimeout(() => renderQuestion(currentIndex + 1), 2100);
}

function renderTimer(secs) {
  document.getElementById('timerText').textContent   = secs;
  document.getElementById('timerCircle').style.strokeDashoffset = CIRCUMFERENCE * (1 - secs / 60);
  const ring = document.getElementById('timerRing');
  secs <= 10 ? ring.classList.add('timer-danger') : ring.classList.remove('timer-danger');
}

function showFeedback(ok, pts, note) {
  const bar = document.getElementById('feedbackBar');
  bar.className = `feedback-bar ${ok ? 'correct-fb' : 'wrong-fb'}`;
  document.getElementById('feedbackText').textContent  = `${ok ? '✅' : '❌'} ${note || (ok ? 'Correct!' : 'Wrong!')}`;
  document.getElementById('feedbackPoints').textContent = ok ? `+${pts} pts` : '+0 pts';
}

async function endQuiz() {
  const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
  document.getElementById('quizUI').style.display = 'none';
  document.getElementById('resultsScreen').classList.add('show');

  document.getElementById('finalScore').textContent    = totalScore;
  document.getElementById('resCorrect').textContent    = correctCount;
  document.getElementById('resWrong').textContent      = wrongCount;
  document.getElementById('resAccuracy').textContent   = Math.round((correctCount / TOTAL_QS) * 100) + '%';
  document.getElementById('trophyIcon').textContent    = totalScore >= 150 ? '🏆' : totalScore >= 100 ? '🥇' : totalScore >= 60 ? '🥈' : '🎮';

  await apiRequest('/api/quiz/submit', {
    method: 'POST',
    body: JSON.stringify({ points: totalScore, correctAnswers: correctCount, timeTaken }),
  });

  socket.emit('quiz-completed', { finalScore: totalScore, correctAnswers: correctCount });

  const rankData = await apiRequest('/api/leaderboard/my-rank');
  if (rankData?.success && rankData.rank) {
    document.getElementById('resRank').textContent = `#${rankData.rank}`;
  }
}

function updateLiveRank(leaderboard) {
  const me = getUser();
  if (!me) return;
  const entry = leaderboard.find(e => e.username === me.username);
  if (entry) {
    const rank = leaderboard.indexOf(entry) + 1;
    document.getElementById('liveRank').textContent = `#${rank}`;
  }
}

function escape(s)   { return encodeURIComponent(s); }
function unescape(s) { return decodeURIComponent(s); }