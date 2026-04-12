const express = require('express');
const router = express.Router();

const {
  startQuiz,
  verifyAnswer,
  submitScore,
  getMyScores,
} = require('../controllers/quizController');

const { protect } = require('../middleware/auth');
const { quizLimiter } = require('../middleware/rateLimit');

router.use(protect);
router.use(quizLimiter);

router.get('/start', startQuiz);

router.post('/verify-answer', verifyAnswer);

router.post('/submit', submitScore);

router.get('/my-scores', getMyScores);

module.exports = router;