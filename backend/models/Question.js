const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      maxlength: [500, 'Question text cannot exceed 500 characters'],
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length === 4,
        message: 'Each question must have exactly 4 answer options',
      },
    },
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer is required'],
      
    
    },
    category: {
      type: String,
      enum: ['Science', 'Technology', 'History', 'Geography', 'Sports', 'Entertainment', 'Math', 'General'],
      default: 'General',
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      index: true,
    },
    points: {
      type: Number,
      default: 10,
      min: 5,
      max: 25,
    },
    explanation: {
      type: String,
      default: '',
      maxlength: [300, 'Explanation cannot exceed 300 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    timesAsked: {
      type: Number,
      default: 0,
    },
    timesAnsweredCorrectly: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);
questionSchema.virtual('accuracyRate').get(function () {
  if (this.timesAsked === 0) return null;
  return Math.round((this.timesAnsweredCorrectly / this.timesAsked) * 100);
});

module.exports = mongoose.model('Question', questionSchema);