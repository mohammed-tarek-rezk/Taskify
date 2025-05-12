const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { getUser, updateUser, changePassword, getAllUsers, getOneUser } = require('../controllers/user.controller');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile-images');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Upload profile image
router.post('/profile/image', protect, upload.single('profileImage'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No image file provided',
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // Update user's profile image
    user.profileImage = `/uploads/profile-images/${req.file.filename}`;
    await user.save();

    res.json({
      message: 'Profile image uploaded successfully',
      profileImage: user.profileImage,
    });
  } catch (err) {
    next(err);
  }
});

// Get user profile
router.get('/profile', protect, getUser);

// Update user profile
router.put('/profile', protect, updateUser);

// Change password
router.put('/password', protect, changePassword);

// Get all users (for team/project management)
router.get('/', protect, getAllUsers);

// Get user by ID (for team/project management)
router.get('/:id', protect, getOneUser);

module.exports = router; 