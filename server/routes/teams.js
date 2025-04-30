const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const Project = require('../models/Project');

// Get all teams
router.get('/', protect, async (req, res, next) => {
  try {
    const teams = await Team.find({
      $or: [
        { leader: req.user.id },
        { members: req.user.id }
      ]
    })
      .populate('leader', 'name email')
      .populate('members', 'name email');

    res.json(teams);
  } catch (err) {
    next(err);
  }
});

// Create team
router.post('/', protect, async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const team = await Team.create({
      name,
      description,
      leader: req.user.id,
      members: [req.user.id],
    });

    // Add team to user's teams
    await User.findByIdAndUpdate(req.user.id, {
      $push: { teams: team._id },
    });

    // Populate the team data before sending response
    const populatedTeam = await Team.findById(team._id)
      .populate('leader', 'name email')
      .populate('members', 'name email');

    res.status(201).json(populatedTeam);
  } catch (err) {
    next(err);
  }
});

// Get team by ID
router.get('/:id', protect, async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('leader', 'name email')
      .populate('members', 'name email')
      .populate('projects');

    if (!team) {
      return res.status(404).json({
        message: 'Team not found',
      });
    }

    // Check if user has access to the team
    if (
      team.leader.toString() !== req.user.id &&
      !team.members.some(member => member._id.toString() === req.user.id)
    ) {
      return res.status(403).json({
        message: 'Not authorized to access this team',
      });
    }

    res.json(team);
  } catch (err) {
    next(err);
  }
});

// Update team
router.put('/:id', protect, async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        message: 'Team not found',
      });
    }

    // Check if user is team leader
    if (team.leader.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized to update this team',
      });
    }

    team.name = name || team.name;
    team.description = description || team.description;
    await team.save();

    res.json(team);
  } catch (err) {
    next(err);
  }
});

// Delete team
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        message: 'Team not found',
      });
    }

    // Check if user is team leader
    if (team.leader.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized to delete this team',
      });
    }

    // Remove team from all members
    await User.updateMany(
      { teams: team._id },
      { $pull: { teams: team._id } }
    );

    // Remove team from all projects
    await Project.updateMany(
      { team: team._id },
      { $unset: { team: 1 } }
    );

    // Delete the team using findByIdAndDelete
    await Team.findByIdAndDelete(team._id);

    res.json({
      message: 'Team deleted successfully',
    });
  } catch (err) {
    next(err);
  }
});

// Add team member
router.post('/:id/members', protect, async (req, res, next) => {
  try {
    const { email } = req.body;

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        message: 'Team not found',
      });
    }

    // Check if user is team leader
    if (team.leader.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized to add members to this team',
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // Check if user is already a member
    if (team.members.includes(user._id)) {
      return res.status(400).json({
        message: 'User is already a member of this team',
      });
    }

    // Add user to team
    await team.addMember(user._id);

    // Add team to user's teams
    await User.findByIdAndUpdate(user._id, {
      $push: { teams: team._id },
    });

    res.json(team);
  } catch (err) {
    next(err);
  }
});

// Remove team member
router.delete('/:id/members/:memberId', protect, async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        message: 'Team not found',
      });
    }

    // Check if user is team leader
    if (team.leader.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized to remove members from this team',
      });
    }

    // Check if member exists
    if (!team.members.includes(req.params.memberId)) {
      return res.status(404).json({
        message: 'Member not found in team',
      });
    }

    // Remove member from team
    await team.removeMember(req.params.memberId);

    // Remove team from user's teams
    await User.findByIdAndUpdate(req.params.memberId, {
      $pull: { teams: team._id },
    });

    res.json(team);
  } catch (err) {
    next(err);
  }
});

module.exports = router; 