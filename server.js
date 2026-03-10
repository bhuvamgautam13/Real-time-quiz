const express = require('express');
const http    = require('http');
const cors    = require('cors');
const { Server } = require('socket.io');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = 3000;

app.use(cors());
app.use(express.json());

const questions = [
  {
    id: 1,
    question: 'What is the capital of India?',
    options: ['Delhi', 'Mumbai', 'Kolkata', 'Chennai'],
    answer: 'Delhi',
  },
  {
    id: 2,
    question: '2 + 2 = ?',
    options: ['3', '4', '5', '6'],
    answer: '4',
  },
  {
    id: 3,
    question: 'Which planet is closest to the Sun?',
    options: ['Venus', 'Earth', 'Mercury', 'Mars'],
    answer: 'Mercury',
  },
  {
    id: 4,
    question: 'What is the largest ocean on Earth?',
    options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
    answer: 'Pacific',
  },
  {
    id: 5,
    question: 'Who wrote "Romeo and Juliet"?',
    options: ['Dickens', 'Shakespeare', 'Tolstoy', 'Hemingway'],
    answer: 'Shakespeare',
  },
  {
    id: 6,
    question: 'What is the speed of light (approx)?',
    options: ['3×10⁸ m/s', '3×10⁶ m/s', '3×10⁵ m/s', '3×10⁴ m/s'],
    answer: '3×10⁸ m/s',
  },
  {
    id: 7,
    question: 'How many sides does a hexagon have?',
    options: ['5', '6', '7', '8'],
    answer: '6',
  },
  {
    id: 8,
    question: 'What gas do plants absorb from the atmosphere?',
    options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
    answer: 'Carbon Dioxide',
  },
];

let players = [];

app.get('/questions', (req, res) => {
  console.log('[REST] GET /questions');
  res.json({ questions });
});

app.get('/leaderboard', (req, res) => {
  console.log('[REST] GET /leaderboard');
  const sorted = [...players].sort((a, b) => b.score - a.score);
  res.json({ leaderboard: sorted });
});

app.get('/players', (req, res) => {
  res.json({ players });
});

io.on('connection', (socket) => {
  console.log(`[Socket] Player connected: ${socket.id}`);

  socket.on('joinQuiz', (data) => {
    const name = (data?.name || '').trim();

    if (!name) {
      socket.emit('error', { message: 'Player name is required.' });
      return;
    }

    const alreadyJoined = players.find(p => p.id === socket.id);
    if (alreadyJoined) {
      console.log(`[Socket] ${name} already in players list, skipping.`);
      return;
    }

    const newPlayer = { id: socket.id, name, score: 0 };
    players.push(newPlayer);

    console.log(`[Socket] ${name} joined. Total players: ${players.length}`);

    io.emit('playerJoined', {
      name,
      count:   players.length,
      players: players.map(({ id, name, score }) => ({ id, name, score })),
    });
  });

  socket.on('submitAnswer', (data) => {
    const { playerName, questionId, answer } = data || {};
    const name = playerName || data?.name;

    if (!name || questionId == null || answer == null) {
      socket.emit('error', { message: 'Invalid submitAnswer payload.' });
      return;
    }

    const question = questions.find(q => q.id === Number(questionId));
    if (!question) {
      socket.emit('error', { message: `Question ${questionId} not found.` });
      return;
    }

    const player = players.find(p => p.id === socket.id || p.name === name);
    if (!player) {
      socket.emit('error', { message: 'Player not found. Did you join?' });
      return;
    }

    const isCorrect =
      String(answer || '').trim().toLowerCase() ===
      String(question.answer).trim().toLowerCase();

    if (isCorrect) {
      player.score += 10;
      console.log(`[Socket] ✓ ${player.name} answered correctly! Score: ${player.score}`);
    } else {
      console.log(`[Socket] ✗ ${player.name} answered incorrectly.`);
    }

    const leaderboard = [...players]
      .sort((a, b) => b.score - a.score)
      .map(({ id, name, score }) => ({ id, name, score }));

    io.emit('scoreUpdated', {
      leaderboard,
      lastAnswer: {
        playerName: player.name,
        questionId,
        isCorrect,
      },
    });
  });

  socket.on('disconnect', () => {
    const index = players.findIndex(p => p.id === socket.id);

    if (index !== -1) {
      const [removed] = players.splice(index, 1);
      console.log(`[Socket] ${removed.name} disconnected. Players left: ${players.length}`);

      io.emit('playerJoined', {
        name:    null,
        count:   players.length,
        players: players.map(({ id, name, score }) => ({ id, name, score })),
      });
    } else {
      console.log(`[Socket] Unknown socket disconnected: ${socket.id}`);
    }
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ⚡ QuizBlitz server is running!');
  console.log(`  ➜  http://localhost:${PORT}`);
  console.log(`  ➜  GET  /questions   — fetch all questions`);
  console.log(`  ➜  GET  /leaderboard — fetch sorted scores`);
  console.log('');
});