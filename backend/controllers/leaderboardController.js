const Score = require('../models/Score');
const User  = require('../models/User');

const buildDailyPipeline = (limit = 10) => {
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));

  return [
    {
      $match: {
        createdAt: { $gte: startOfToday },
      },
    },
    {
      $sort: { points: -1, createdAt: 1 },
    },
    {
      $group: {
        _id:            '$userId',
        bestScore:      { $first: '$points' },
        correctAnswers: { $first: '$correctAnswers' },
        totalQuestions: { $first: '$totalQuestions' },
        timeTaken:      { $first: '$timeTaken' },
        achievedAt:     { $first: '$createdAt' },
      },
    },
    {
      $sort: { bestScore: -1, achievedAt: 1 },
    },
    {
      $limit: limit,
    },
    {
      $lookup: {
        from:         'users',
        localField:   '_id',
        foreignField: '_id',
        as:           'userInfo',
      },
    },
    {
      $unwind: {
        path:                       '$userInfo',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $project: {
        _id:            0,
        userId:         '$_id',
        username:       '$userInfo.username',
        profilePicture: '$userInfo.profilePicture',
        bestScore:      1,
        correctAnswers: 1,
        totalQuestions: 1,
        timeTaken:      1,
        achievedAt:     1,
      },
    },
  ];
};

const getDailyLeaderboard = async (req, res) => {
  try {
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));

    const leaderboard = await Score.aggregate(buildDailyPipeline(10));

    res.json({
      success:      true,
      date:         startOfToday.toISOString().split('T')[0],
      totalEntries: leaderboard.length,
      leaderboard,
    });
  } catch (error) {
    console.error('getDailyLeaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily leaderboard.',
    });
  }
};

const getAllTimeLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Score.aggregate([
      { $sort: { points: -1 } },
      {
        $group: {
          _id:            '$userId',
          bestScore:      { $first: '$points' },
          correctAnswers: { $first: '$correctAnswers' },
          totalQuestions: { $first: '$totalQuestions' },
          achievedAt:     { $first: '$createdAt' },
        },
      },
      { $sort: { bestScore: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from:         'users',
          localField:   '_id',
          foreignField: '_id',
          as:           'userInfo',
        },
      },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: false } },
      {
        $project: {
          _id:            0,
          userId:         '$_id',
          username:       '$userInfo.username',
          profilePicture: '$userInfo.profilePicture',
          bestScore:      1,
          correctAnswers: 1,
          totalQuestions: 1,
          achievedAt:     1,
        },
      },
    ]);

    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('getAllTimeLeaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all-time leaderboard.',
    });
  }
};

const getMyRank = async (req, res) => {
  try {
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));

    const myBestToday = await Score.findOne({
      userId:    req.user._id,
      createdAt: { $gte: startOfToday },
    }).sort({ points: -1 });

    if (!myBestToday) {
      return res.json({
        success: true,
        rank:    null,
        message: "You haven't played today yet!",
      });
    }

    const countResult = await Score.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfToday },
        },
      },
      {
        $sort: { points: -1 },
      },
      {
        $group: {
          _id:      '$userId',
          bestScore: { $first: '$points' },
        },
      },
      {
        $match: {
          bestScore:   { $gt: myBestToday.points },
        },
      },
      { $count: 'higherCount' },
    ]);

    const rank = (countResult[0]?.higherCount ?? 0) + 1;

    res.json({
      success:        true,
      rank,
      bestScore:      myBestToday.points,
      correctAnswers: myBestToday.correctAnswers,
      timeTaken:      myBestToday.timeTaken,
    });
  } catch (error) {
    console.error('getMyRank error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating your rank.',
    });
  }
};

const getMyScores = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const [scores, total] = await Promise.all([
      Score.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('points correctAnswers totalQuestions timeTaken createdAt')
        .lean(),

      Score.countDocuments({ userId: req.user._id }),
    ]);

    const enriched = scores.map(s => ({
      ...s,
      accuracy:    Math.round((s.correctAnswers / s.totalQuestions) * 100),
      pointsLabel: s.points >= 150 ? 'Legendary'
                 : s.points >= 100 ? 'Excellent'
                 : s.points >= 70  ? 'Good'
                 : s.points >= 40  ? 'Average'
                 : 'Needs Work',
    }));

    const allScores   = await Score.find({ userId: req.user._id }).select('points correctAnswers totalQuestions').lean();
    const totalPoints = allScores.reduce((acc, s) => acc + s.points, 0);
    const totalRight  = allScores.reduce((acc, s) => acc + s.correctAnswers, 0);
    const totalQs     = allScores.reduce((acc, s) => acc + s.totalQuestions, 0);
    const overallAcc  = totalQs > 0 ? Math.round((totalRight / totalQs) * 100) : 0;
    const bestScore   = allScores.length > 0 ? Math.max(...allScores.map(s => s.points)) : 0;

    res.json({
      success: true,
      scores:  enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext:    page < Math.ceil(total / limit),
        hasPrev:    page > 1,
      },
      stats: {
        totalGames:  total,
        totalPoints,
        bestScore,
        overallAccuracy: overallAcc,
      },
    });
  } catch (error) {
    console.error('getMyScores error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your score history.',
    });
  }
};

const getLeaderboardByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a date query param in YYYY-MM-DD format.',
      });
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD.',
      });
    }

    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay   = new Date(targetDate.setHours(23, 59, 59, 999));

    const leaderboard = await Score.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      { $sort: { points: -1 } },
      {
        $group: {
          _id:            '$userId',
          bestScore:      { $first: '$points' },
          correctAnswers: { $first: '$correctAnswers' },
          achievedAt:     { $first: '$createdAt' },
        },
      },
      { $sort: { bestScore: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from:         'users',
          localField:   '_id',
          foreignField: '_id',
          as:           'userInfo',
        },
      },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: false } },
      {
        $project: {
          _id:            0,
          userId:         '$_id',
          username:       '$userInfo.username',
          profilePicture: '$userInfo.profilePicture',
          bestScore:      1,
          correctAnswers: 1,
          achievedAt:     1,
        },
      },
    ]);

    res.json({
      success:    true,
      date:       req.query.date,
      leaderboard,
    });
  } catch (error) {
    console.error('getLeaderboardByDate error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard for given date.',
    });
  }
};

module.exports = {
  getDailyLeaderboard,
  getAllTimeLeaderboard,
  getMyRank,
  getMyScores,
  getLeaderboardByDate,
  buildDailyPipeline,
};