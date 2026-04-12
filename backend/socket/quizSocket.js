const User = require('../models/User');
const Score = require('../models/Score');
const { verifyToken } = require('../utils/generateToken');

const activeSessions = new Map();

const authenticateSocket = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('AUTH_ERROR: No token provided'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('AUTH_ERROR: Invalid or expired token'));
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return next(new Error('AUTH_ERROR: User not found or inactive'));
    }

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('AUTH_ERROR: ' + err.message));
  }
};

const buildDailyLeaderboard = async () => {
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));

  return Score.aggregate([
    { $match: { createdAt: { $gte: startOfToday } } },
    { $sort: { points: -1, createdAt: 1 } },
    {
      $group: {
        _id: '$userId',
        bestScore: { $first: '$points' },
        correctAnswers: { $first: '$correctAnswers' },
      },
    },
    { $sort: { bestScore: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo',
      },
    },
    { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: false } },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        username: '$userInfo.username',
        profilePicture: '$userInfo.profilePicture',
        bestScore: 1,
        correctAnswers: 1,
      },
    },
  ]);
};

const clearSessionTimer = (socketId) => {
  const session = activeSessions.get(socketId);
  if (session?.timer) {
    clearInterval(session.timer);
    activeSessions.delete(socketId);
  }
};

const initializeSocket = (io) => {
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`🔌 [Socket] Connected: ${socket.user.username} (${socket.id})`);

    socket.join(`user:${socket.user._id}`);
    socket.join('leaderboard');

    socket.on('start-question', ({ questionIndex }) => {
      clearSessionTimer(socket.id);

      let timeRemaining = 60;

      socket.emit('timer-tick', { timeRemaining, questionIndex });

      const timer = setInterval(() => {
        timeRemaining -= 1;

        socket.emit('timer-tick', { timeRemaining, questionIndex });

        if (timeRemaining <= 0) {
          clearInterval(timer);
          activeSessions.delete(socket.id);

          socket.emit('time-expired', {
            questionIndex,
            message: 'Time is up! No answer recorded.',
          });

          console.log(`⌛ Time expired: ${socket.user.username} Q${questionIndex + 1}`);
        }
      }, 1000);

      activeSessions.set(socket.id, {
        userId: socket.user._id,
        timer,
        questionIndex,
      });

      console.log(`▶  Timer started: ${socket.user.username} Q${questionIndex + 1}`);
    });

    socket.on('answer-submitted', ({ questionIndex, timeRemaining }) => {
      clearSessionTimer(socket.id);

      socket.emit('answer-acknowledged', {
        questionIndex,
        timeRemaining,
      });

      console.log(`✅ Answer: ${socket.user.username} Q${questionIndex + 1} | ${timeRemaining}s left`);
    });

    socket.on('quiz-completed', async ({ finalScore, correctAnswers }) => {
      clearSessionTimer(socket.id);

      console.log(`🏆 Quiz done: ${socket.user.username} scored ${finalScore}`);

      try {
        const leaderboard = await buildDailyLeaderboard();

        io.to('leaderboard').emit('new-score-update', {
          triggerUser: socket.user.username,
          finalScore,
          leaderboard,
          timestamp: new Date().toISOString(),
        });

        console.log(`📡 Leaderboard broadcast sent after ${socket.user.username}'s quiz`);
      } catch (err) {
        console.error('Leaderboard broadcast error:', err);
      }
    });

    socket.on('request-leaderboard', async () => {
      try {
        const leaderboard = await buildDailyLeaderboard();
        socket.emit('leaderboard-data', { leaderboard });
      } catch (err) {
        socket.emit('leaderboard-data', { leaderboard: [], error: 'Failed to load' });
      }
    });

    socket.on('disconnect', (reason) => {
      clearSessionTimer(socket.id);
      console.log(`❌ [Socket] Disconnected: ${socket.user.username} (${reason})`);
    });
  });

  console.log('✅ Socket.io initialized with JWT auth + timer logic');
};

module.exports = { initializeSocket };