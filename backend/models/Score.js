const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  points: {
    type: Number,
    required: true,
    min: 0,
  },
  correctAnswers: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 15,
  },
  totalQuestions: {
    type: Number,
    default: 15,
  },
  timeTaken: {
    type: Number, 
    default: 0,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});


scoreSchema.index({ createdAt: -1, points: -1 });
scoreSchema.index({ userId: 1, createdAt: -1 });

scoreSchema.virtual('accuracy').get(function () {
  return Math.round((this.correctAnswers / this.totalQuestions) * 100);
});

module.exports = mongoose.model('Score', scoreSchema);