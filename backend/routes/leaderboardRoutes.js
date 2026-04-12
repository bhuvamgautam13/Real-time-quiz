const express = require('express');
const router = express.Router();

const {
  getDailyLeaderboard,
  getAllTimeLeaderboard,
  getMyRank,
} = require('../controllers/leaderboardController');

const { protect } = require('../middleware/auth');
const { leaderboardLimiter } = require('../middleware/rateLimit');

router.use(leaderboardLimiter);

router.get('/daily', getDailyLeaderboard);

router.get('/all-time', getAllTimeLeaderboard);

router.get('/my-rank', protect, getMyRank);

module.exports = router;