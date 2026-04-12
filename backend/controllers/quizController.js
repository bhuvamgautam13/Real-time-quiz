const Question = require('../models/Question');
const Score = require('../models/Score');
const User = require('../models/User');

const startQuiz = async (req, res) => {
  try {
    const questions = await Question.aggregate([
      { $match: { isActive: true } },
      { $sample: { size: 15 } },
      {
        $project: {
          questionText: 1,
          options: 1,
          category: 1,
          difficulty: 1,
          points: 1,
        },
      },
    ]);

    if (questions.length < 15) {
      return res.status(503).json({
        success: false,
        message: `Database has only ${questions.length} questions. Need at least 15. Run npm run seed.`,
      });
    }

    const shuffledQuestions = questions.map((q) => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5),
    }));

    res.json({
      success: true,
      questions: shuffledQuestions,
      totalQuestions: shuffledQuestions.length,
      message: 'Quiz started! Good luck.',
    });
  } catch (error) {
    console.error('startQuiz error:', error);
    res.status(500).json({ success: false, message: 'Error starting quiz. Please try again.' });
  }
};

const verifyAnswer = async (req, res) => {
  try {
    const { questionId, selectedAnswer, timeRemaining } = req.body;

    if (!questionId || selectedAnswer === undefined) {
      return res.status(400).json({
        success: false,
        message: 'questionId and selectedAnswer are required.',
      });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    const isCorrect = question.correctAnswer === selectedAnswer;

    let earnedPoints = 0;
    if (isCorrect) {
      const remaining = Math.max(0, Math.min(60, timeRemaining || 0));
      const timeBonus = Math.floor((remaining / 60) * 5);
      earnedPoints = question.points + timeBonus;
    }

    Question.findByIdAndUpdate(questionId, {
      $inc: {
        timesAsked: 1,
        timesAnsweredCorrectly: isCorrect ? 1 : 0,
      },
    }).exec();

    res.json({
      success: true,
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      earnedPoints,
    });
  } catch (error) {
    console.error('verifyAnswer error:', error);
    res.status(500).json({ success: false, message: 'Error verifying answer.' });
  }
};

const submitScore = async (req, res) => {
  try {
    const { points, correctAnswers, timeTaken } = req.body;

    if (points === undefined || correctAnswers === undefined) {
      return res.status(400).json({
        success: false,
        message: 'points and correctAnswers are required.',
      });
    }

    const score = await Score.create({
      userId: req.user._id,
      points: Math.max(0, points),
      correctAnswers: Math.max(0, correctAnswers),
      totalQuestions: 15,
      timeTaken: timeTaken || 0,
    });

    const user = await User.findById(req.user._id);
    user.totalScore += points;
    user.gamesPlayed += 1;
    user.totalCorrectAnswers += correctAnswers;
    if (points > user.highScore) user.highScore = points;
    await user.save();

    res.json({
      success: true,
      message: 'Score submitted successfully!',
      score,
      updatedStats: {
        totalScore: user.totalScore,
        gamesPlayed: user.gamesPlayed,
        highScore: user.highScore,
      },
    });
  } catch (error) {
    console.error('submitScore error:', error);
    res.status(500).json({ success: false, message: 'Error submitting score.' });
  }
};

const getMyScores = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [scores, total] = await Promise.all([
      Score.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Score.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      success: true,
      scores,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('getMyScores error:', error);
    res.status(500).json({ success: false, message: 'Error fetching scores.' });
  }
};

module.exports = { startQuiz, verifyAnswer, submitScore, getMyScores };