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

// SOCKET
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'https://real-time-quiz-engine.onrender.com',
    credentials: true,
  },
});
initializeSocket(io);
app.set('io', io);

// MIDDLEWARE
app.use(cors({
  origin: process.env.CLIENT_URL || 'https://real-time-quiz-engine.onrender.com',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use('/api', generalLimiter);

// PATH
const FRONTEND_PATH = path.join(__dirname, '../frontend');

// STATIC
app.use(express.static(FRONTEND_PATH));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/upload', uploadRoutes);

// ROOT
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'pages/index.html'));
});

// SMART CATCH-ALL (FIXES redirect issues)
app.use((req, res, next) => {
  if (
    req.originalUrl.startsWith('/api') ||
    req.originalUrl.startsWith('/uploads') ||
    req.originalUrl.includes('.')
  ) {
    return next();
  }

  res.sendFile(path.join(FRONTEND_PATH, 'pages/index.html'));
});

// START
const PORT =  process.env.PORT || 5000;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running`);
  });
});