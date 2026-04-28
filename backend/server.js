require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const passport = require('passport');

const connectDB = require('./config/db');
require('./config/passport');

const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const { generalLimiter } = require('./middleware/rateLimit');
const { initializeSocket } = require('./socket/quizSocket');

const app = express();
const httpServer = http.createServer(app);

// ================= SOCKET =================
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'https://real-time-quiz-engine.onrender.com',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

initializeSocket(io);
app.set('io', io);

// ================= MIDDLEWARE =================
app.use(cors({
  origin: process.env.CLIENT_URL || 'https://real-time-quiz-engine.onrender.com',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(passport.initialize());
app.use('/api', generalLimiter);

// ================= PATHS =================
const FRONTEND_PATH = path.join(__dirname, '../frontend');

// ================= STATIC FILES =================
// Serve frontend (VERY IMPORTANT)
app.use(express.static(FRONTEND_PATH));

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================= API ROUTES =================
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/upload', uploadRoutes);

// ================= ROOT =================
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'pages/index.html'));
});

// ================= SAFE CATCH-ALL =================
// Fix for direct URL access like /pages/login.html
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) return next();

  res.sendFile(path.join(FRONTEND_PATH, 'pages/index.html'));
});

// ================= API 404 =================
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error('💥 Global Error:', err.message);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 5MB.',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', '),
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists.`,
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🚀 Server running at https://real-time-quiz-engine.onrender.com`);
    console.log(`📄 Frontend: https://real-time-quiz-engine.onrender.com`);
    console.log(`📡 API: https://real-time-quiz-engine.onrender.com/api`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  });
};

start();