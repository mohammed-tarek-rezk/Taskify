const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

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
router.get('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'teams',
        select: 'name description members',
        populate: {
          path: 'members',
          select: 'name email profileImage'
        }
      })
      .populate({
        path: 'projects',
        select: 'name description status priority',
        populate: {
          path: 'leader members',
          select: 'name email profileImage'
        }
      })
      .populate({
        path: 'tasks',
        select: 'title description status priority dueDate',
        populate: {
          path: 'project',
          select: 'name'
        }
      });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage || null,
      teams: user.teams,
      projects: user.projects,
      tasks: user.tasks,
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({
      message: 'Failed to fetch user profile',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

// Update user profile
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, email } = req.body;

    // Check if email is already taken
    if (email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          message: 'Email is already taken',
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true, runValidators: true }
    );

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({
      message: 'Failed to update user profile',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

// Change password
router.put('/password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Please provide both current and new password',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long',
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Current password is incorrect',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password updated successfully',
    });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

// Get all users (for team/project management)
router.get('/', protect, async (req, res, next) => {
  try {
    // Only return basic user info for team/project management
    const users = await User.find().select('name email');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

// Get user by ID (for team/project management)
router.get('/:id', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('name email');
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({
      message: 'Failed to fetch user',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

module.exports = router; 