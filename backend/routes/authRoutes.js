const express = require('express');
const router = express.Router();
const passport = require('passport');

const {
  signup,
  login,
  googleCallback,
  logout,
  getMe,
  updateProfile,
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const { authLimiter, uploadLimiter } = require('../middleware/rateLimit');
const upload = require('../config/multer');



router.get('/me', protect, getMe);

router.post(
  '/signup',
  authLimiter,
  upload.single('profilePicture'),
  signup
);

router.post('/login', authLimiter, login);

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/pages/login.html?error=google_failed',
  }),
  googleCallback
);

router.post('/logout', protect, logout);



router.put(
  '/profile',
  protect,
  uploadLimiter,
  upload.single('profilePicture'),
  updateProfile
);

module.exports = router;