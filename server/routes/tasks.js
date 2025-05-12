const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { getAllTasks, createTask, getOneTask, updateTask, deleteTask, addComment, removeComment, removeCommentAttachment, addTaskAttachment, removeTaskAttachment, updateComment } = require('../controllers/task.controller');

// Get all tasks
router.get('/', protect, getAllTasks);

// Create task
router.post('/', protect, createTask);

// Get task by ID
router.get('/:id', protect, getOneTask);

// Update task
router.put('/:id', protect,  updateTask);

// Delete task
router.delete('/:id', protect, deleteTask);

// Add comment to task
router.post('/:id/comments', protect, addComment);

// Remove comment from task
router.delete('/:id/comments/:commentId', protect, removeComment);

// Remove attachment from comment
router.delete('/:id/comments/:commentId/attachments/:attachmentIndex',protect, removeCommentAttachment);

// Add attachment to task
router.post('/:id/attachments', protect, addTaskAttachment);

// Remove attachment from task
router.delete('/:id/attachments/:attachmentIndex', protect, removeTaskAttachment);

// Update comment
router.put('/:id/comments/:commentId', protect, updateComment);

module.exports = router; 