const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { forgetPassword, me, resetPassword, login, registration } = require('../controllers/auth.controller');

// Register user
router.post('/register', registration);

// Login user
router.post('/login', login);

// Get current user
router.get('/me', protect, me);

// Forgot password
router.post('/forgot-password', forgetPassword);

// Reset password
router.post('/reset-password',resetPassword);

module.exports = router; 