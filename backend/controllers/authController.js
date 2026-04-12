const User = require('../models/User');
const { sendTokenCookie } = require('../utils/generateToken');

const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are all required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { username: username.trim() }],
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase().trim() ? 'Email' : 'Username';
      return res.status(409).json({
        success: false,
        message: `${field} is already registered.`,
      });
    }

    let profilePicture = '';
    if (req.file) {
      profilePicture = `/uploads/${req.file.filename}`;
    }

    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      profilePicture,
    });

    const token = sendTokenCookie(res, user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error during signup.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials, or please use Google Sign-In.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    const token = sendTokenCookie(res, user._id);

    res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

const googleCallback = (req, res) => {
  try {
    const token = sendTokenCookie(res, req.user._id);
    res.redirect(`/pages/dashboard.html?token=${token}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect('/pages/login.html?error=oauth_failed');
  }
};

const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.json({ success: true, message: 'Logged out successfully.' });
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updates = {};

    if (req.body.username) {
      const taken = await User.findOne({
        username: req.body.username,
        _id: { $ne: req.user._id },
      });
      if (taken) {
        return res.status(409).json({ success: false, message: 'Username already taken.' });
      }
      updates.username = req.body.username.trim();
    }

    if (req.file) {
      updates.profilePicture = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating profile.' });
  }
};

module.exports = { signup, login, googleCallback, logout, getMe, updateProfile };