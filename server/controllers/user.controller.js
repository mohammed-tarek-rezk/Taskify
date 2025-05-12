
const User = require('../models/User');


// Get user profile
const getUser = async (req, res, next) => {
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
};

// Update user profile
const updateUser =  async (req, res, next) => {
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
};

// Change password
const changePassword = async (req, res, next) => {
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
};

// Get all users (for team/project management)
const getAllUsers=  async (req, res, next) => {
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
};

// Get user by ID (for team/project management)
const getOneUser = async (req, res, next) => {
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
};

module.exports = {
  getAllUsers,
  getOneUser,
  getUser,
  updateUser,
  changePassword
}; 