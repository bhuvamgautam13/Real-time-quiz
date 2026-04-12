const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { uploadLimiter } = require('../middleware/rateLimit');
const upload = require('../config/multer');
const User = require('../models/User');

router.post(
  '/profile-picture',
  protect,
  uploadLimiter,
  upload.single('profilePicture'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded. Please select an image.',
        });
      }

      const newPicturePath = `/uploads/${req.file.filename}`;

      const user = await User.findById(req.user._id);
      if (user.profilePicture && user.profilePicture.startsWith('/uploads/')) {
        const oldFilePath = path.join(__dirname, '..', user.profilePicture);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      user.profilePicture = newPicturePath;
      await user.save();

      res.json({
        success: true,
        message: 'Profile picture updated successfully!',
        profilePicture: newPicturePath,
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ success: false, message: 'Error uploading file.' });
    }
  }
);

router.delete('/profile-picture', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.profilePicture && user.profilePicture.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    user.profilePicture = '';
    await user.save();

    res.json({ success: true, message: 'Profile picture removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error removing profile picture.' });
  }
});

router.get('/list', protect, requireRole('admin'), (req, res) => {
  const uploadDir = path.join(__dirname, '../uploads');
  try {
    const files = fs.readdirSync(uploadDir).filter((f) => f !== '.gitkeep');
    res.json({ success: true, count: files.length, files });
  } catch {
    res.status(500).json({ success: false, message: 'Error reading uploads directory.' });
  }
});

module.exports = router;