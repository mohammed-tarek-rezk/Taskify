const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Team = require('../models/Team');
const User = require('../models/User');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const { getAllProjects, createProject, getOneProject, updateProject, deleteProject, addProjectMember, removeProjectMember } = require('../controllers/project.controller');

// Get all projects
router.get('/', protect, getAllProjects);

// Create project
router.post('/', protect, createProject);

// Get project by ID
router.get('/:id', protect, getOneProject);

// Update project
router.put('/:id', protect, updateProject);

// Delete project
router.delete('/:id', protect, deleteProject);

// Add project member
router.post('/:id/members', protect, addProjectMember);

// Remove project member
router.delete('/:id/members/:memberId', protect, removeProjectMember);

module.exports = router; 