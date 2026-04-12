const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, 
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, 
    },
    profilePicture: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    
    totalScore: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },
    highScore: { type: Number, default: 0 },
    totalCorrectAnswers: { type: Number, default: 0 },
    
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true, 
  }
);



userSchema.index({ highScore: -1 }); 

userSchema.pre('save', async function () {
  
  if (!this.isModified('password') || !this.password) return ;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  
});


userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};


userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    profilePicture: this.profilePicture,
    role: this.role,
    totalScore: this.totalScore,
    gamesPlayed: this.gamesPlayed,
    highScore: this.highScore,
    totalCorrectAnswers: this.totalCorrectAnswers,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);