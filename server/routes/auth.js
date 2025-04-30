const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Register user
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    console.log('Registration attempt:', { name, email });

    // Validate input
    if (!name || !email || !password) {
      console.log('Missing required fields');
      return res.status(400).json({
        message: 'Please provide all required fields',
      });
    }

    // Check if user already exists
    console.log('Checking if user exists with email:', email);
    const existingUser = await User.findOne({ email });
    console.log('Existing user check result:', existingUser ? 'User found' : 'No user found');
    
    if (existingUser) {
      console.log('User already exists with email:', email);
      return res.status(400).json({
        message: 'User already exists',
      });
    }

    // Create new user
    console.log('Creating new user');
    const user = await User.create({
      name,
      email,
      password,
    });
    console.log('User created successfully:', user._id);

    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      return res.status(500).json({
        message: 'Server configuration error. Please contact the administrator.',
      });
    }

    // Generate JWT token
    console.log('Generating JWT token');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
    console.log('JWT token generated successfully');

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
      console.log('Validation error:', Object.values(err.errors).map(e => e.message).join(', '));
      return res.status(400).json({
        message: 'Invalid input data',
        error: Object.values(err.errors).map(e => e.message).join(', '),
      });
    }
    
    if (err.code === 11000) {
      console.log('Duplicate key error:', err.keyValue);
      return res.status(400).json({
        message: 'Email already in use',
        details: err.keyValue,
      });
    }
    
    res.status(500).json({
      message: 'Failed to register user',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

// Login user
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Get current user
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
});

// Forgot password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // Generate reset token
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save();

    // TODO: Send email with reset token

    res.json({
      message: 'Password reset email sent',
    });
  } catch (err) {
    next(err);
  }
});

// Reset password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired token',
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      message: 'Password reset successful',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router; 