const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Get all tasks
router.get('/', protect, async (req, res, next) => {
  try {
    const { 
      search, 
      status, 
      priority, 
      project, 
      assignedTo, 
      createdBy,
      startDate,
      endDate,
      sortBy = 'dueDate',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = {
      $or: [
        { createdBy: req.user.id },
        { assignedTo: req.user.id }
      ]
    };

    // Add search filter
    if (search) {
      filter.$or.push(
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      );
    }

    // Add status filter
    if (status) {
      filter.status = status;
    }

    // Add priority filter
    if (priority) {
      filter.priority = priority;
    }

    // Add project filter
    if (project) {
      filter.project = project;
    }

    // Add assignedTo filter
    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    // Add createdBy filter
    if (createdBy) {
      filter.createdBy = createdBy;
    }

    // Add date range filter
    if (startDate || endDate) {
      filter.dueDate = {};
      if (startDate) {
        filter.dueDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.dueDate.$lte = new Date(endDate);
      }
    }

    // Find all projects where the user is a member
    const userProjects = await Project.find({
      $or: [
        { leader: req.user.id },
        { members: req.user.id }
      ]
    });

    // Add project tasks to filter
    filter.$or.push({ project: { $in: userProjects.map(p => p._id) } });

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get all tasks with filters
    const tasks = await Task.find(filter)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort(sort);

    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// Create task
router.post('/', protect, async (req, res, next) => {
  try {
    const { title, description, project, assignedTo, dueDate, priority, tags } = req.body;

    // Validate due date
    if (dueDate) {
      const currentDate = new Date();
      const dueDateObj = new Date(dueDate);
      
      if (dueDateObj <= currentDate) {
        return res.status(400).json({
          message: 'Due date must be after the current date',
        });
      }

      // If task belongs to a project, check if due date is after project start date
      if (project) {
        const projectExists = await Project.findById(project);
        if (projectExists && projectExists.startDate && dueDateObj <= new Date(projectExists.startDate)) {
          return res.status(400).json({
            message: 'Due date must be after the project start date',
          });
        }
      }
    }

    // If project is provided, check if it exists and if user is a member
    if (project) {
      const projectExists = await Project.findById(project);
      if (!projectExists) {
        return res.status(404).json({
          message: 'Project not found',
        });
      }

      // Check if user is project member
      if (
        projectExists.leader.toString() !== req.user.id &&
        !projectExists.members.some(member => member.toString() === req.user.id)
      ) {
        return res.status(403).json({
          message: 'Not authorized to create tasks for this project',
        });
      }
    }

    // Create the task
    const task = await Task.create({
      title,
      description,
      project: project || null,
      assignedTo,
      createdBy: req.user.id,
      dueDate,
      priority,
      tags,
      status: 'todo',
    });

    // Add task to project if provided
    if (project) {
      const projectExists = await Project.findById(project);
      await projectExists.addTask(task._id);
    }

    // Add task to assigned user's tasks
    if (assignedTo) {
      await User.findByIdAndUpdate(assignedTo, {
        $push: { tasks: task._id },
      });
    }

    // Add task to creator's tasks
    await User.findByIdAndUpdate(req.user.id, {
      $push: { tasks: task._id },
    });

    // Populate the task data before sending response
    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedTask);
  } catch (err) {
    next(err);
  }
});

// Get task by ID
router.get('/:id', protect, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // For personal tasks, only check if user is creator or assignee
    if (!task.project) {
      if (
        task.createdBy._id.toString() === req.user.id ||
        (task.assignedTo && task.assignedTo._id.toString() === req.user.id)
      ) {
        return res.json(task);
      }
      return res.status(403).json({
        message: 'Not authorized to access this task',
      });
    }

    // For project tasks, check project membership
    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({
        message: 'Project not found',
      });
    }

    // Check if user has access to the project task
    if (
      task.createdBy._id.toString() === req.user.id ||
      (task.assignedTo && task.assignedTo._id.toString() === req.user.id) ||
      project.leader.toString() === req.user.id ||
      project.members.some(member => member.toString() === req.user.id)
    ) {
      return res.json(task);
    }

    return res.status(403).json({
      message: 'Not authorized to access this task',
    });
  } catch (err) {
    next(err);
  }
});

// Update task
router.put('/:id', protect, async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, assignedTo, tags } = req.body;

    // Validate due date
    if (dueDate) {
      const currentDate = new Date();
      const dueDateObj = new Date(dueDate);
      
      if (dueDateObj <= currentDate) {
        return res.status(400).json({
          message: 'Due date must be after the current date',
        });
      }

      // If task belongs to a project, check if due date is after project start date
      const task = await Task.findById(req.params.id);
      if (task && task.project) {
        const project = await Project.findById(task.project);
        if (project && project.startDate && dueDateObj <= new Date(project.startDate)) {
          return res.status(400).json({
            message: 'Due date must be after the project start date',
          });
        }
      }
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // For personal tasks, only creator can update
    if (!task.project) {
      if (task.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          message: 'Not authorized to update this task',
        });
      }
    } else {
      // For project tasks, check project membership
      const project = await Project.findById(task.project);
      if (!project) {
        return res.status(404).json({
          message: 'Project not found',
        });
      }

      if (
        task.createdBy.toString() !== req.user.id &&
        task.assignedTo?.toString() !== req.user.id &&
        project.leader.toString() !== req.user.id &&
        !project.members.some(member => member.toString() === req.user.id)
      ) {
        return res.status(403).json({
          message: 'Not authorized to update this task',
        });
      }
    }

    // If assignedTo is changing, update user's tasks
    if (assignedTo && assignedTo !== task.assignedTo?.toString()) {
      // Remove task from old assignee
      if (task.assignedTo) {
        await User.findByIdAndUpdate(task.assignedTo, {
          $pull: { tasks: task._id },
        });
      }

      // Add task to new assignee
      await User.findByIdAndUpdate(assignedTo, {
        $push: { tasks: task._id },
      });
    }

    task.title = title || task.title;
    task.description = description || task.description;
    task.status = status || task.status;
    task.priority = priority || task.priority;
    task.dueDate = dueDate || task.dueDate;
    task.assignedTo = assignedTo || task.assignedTo;
    task.tags = tags || task.tags;
    await task.save();

    res.json(task);
  } catch (err) {
    next(err);
  }
});

// Delete task
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // For personal tasks, only creator can delete
    if (!task.project) {
      if (task.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          message: 'Not authorized to delete this task',
        });
      }
    } else {
      // For project tasks, check project membership
      const project = await Project.findById(task.project);
      if (!project) {
        return res.status(404).json({
          message: 'Project not found',
        });
      }

      if (
        task.createdBy.toString() !== req.user.id &&
        project.leader.toString() !== req.user.id
      ) {
        return res.status(403).json({
          message: 'Not authorized to delete this task',
        });
      }
    }

    // Remove task from project if it exists
    if (task.project) {
      const project = await Project.findById(task.project);
      if (project) {
        await project.removeTask(task._id);
      }
    }

    // Remove task from assigned user
    if (task.assignedTo) {
      await User.findByIdAndUpdate(task.assignedTo, {
        $pull: { tasks: task._id },
      });
    }

    // Remove task from creator
    await User.findByIdAndUpdate(task.createdBy, {
      $pull: { tasks: task._id },
    });

    // Delete the task using findByIdAndDelete instead of remove()
    await Task.findByIdAndDelete(task._id);

    res.json({
      message: 'Task deleted successfully',
    });
  } catch (err) {
    next(err);
  }
});

// Add comment to task
router.post('/:id/comments', protect, async (req, res, next) => {
  try {
    const { text, attachments } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        message: 'Comment text is required',
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    if (!task.project) {
      if (
        task.createdBy.toString() !== req.user.id &&
        task.assignedTo?.toString() !== req.user.id
      ) {
        return res.status(403).json({
          message: 'Not authorized to comment on this task',
        });
      }
    } else {
      // For project tasks, check project membership
      const project = await Project.findById(task.project);
      if (!project) {
        return res.status(404).json({
          message: 'Project not found',
        });
      }

      if (
        task.createdBy.toString() !== req.user.id &&
        task.assignedTo?.toString() !== req.user.id &&
        project.leader.toString() !== req.user.id &&
        !project.members.some(member => member.toString() === req.user.id)
      ) {
        return res.status(403).json({
          message: 'Not authorized to comment on this task',
        });
      }
    }

    // Validate attachments if provided
    if (attachments && !Array.isArray(attachments)) {
      return res.status(400).json({
        message: 'Attachments must be an array',
      });
    }

    if (attachments) {
      for (const attachment of attachments) {
        if (!attachment.name || !attachment.url || !attachment.type || !attachment.size) {
          return res.status(400).json({
            message: 'Each attachment must have name, url, type, and size',
          });
        }
      }
    }

    const comment = {
      text: text.trim(),
      user: req.user.id,
      attachments: attachments || [],
    };

    task.comments.push(comment);
    await task.save();

    // Populate the user field in the new comment
    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

    res.json(populatedTask);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({
      message: 'Failed to add comment',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
});

// Remove comment from task
router.delete('/:id/comments/:commentId', protect, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // Check if user is comment author
    const comment = task.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({
        message: 'Comment not found',
      });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized to delete this comment',
      });
    }

    // Remove the comment
    task.comments = task.comments.filter(
      comment => comment._id.toString() !== req.params.commentId
    );
    await task.save();

    // Populate the task data before sending response
    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

    res.json(populatedTask);
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({
      message: 'Failed to delete comment',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
});

// Remove attachment from comment
router.delete('/:id/comments/:commentId/attachments/:attachmentIndex', protect, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // Check if user is comment author
    const comment = task.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({
        message: 'Comment not found',
      });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized to modify this comment',
      });
    }

    // Remove the attachment
    const attachmentIndex = parseInt(req.params.attachmentIndex);
    if (isNaN(attachmentIndex) || attachmentIndex < 0 || attachmentIndex >= comment.attachments.length) {
      return res.status(400).json({
        message: 'Invalid attachment index',
      });
    }

    comment.attachments.splice(attachmentIndex, 1);
    await task.save();

    // Populate the user field in the comments
    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

    res.json(populatedTask);
  } catch (err) {
    console.error('Error removing attachment:', err);
    res.status(500).json({
      message: 'Failed to remove attachment',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
});

// Add attachment to task
router.post('/:id/attachments', protect, async (req, res, next) => {
  try {
    const { attachments } = req.body;

    if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
      return res.status(400).json({
        message: 'No attachments provided',
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // Check if user is task creator or assigned to
    if (
      task.createdBy.toString() !== req.user.id &&
      task.assignedTo?.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: 'Not authorized to modify this task',
      });
    }

    // Validate each attachment
    for (const attachment of attachments) {
      if (!attachment.name || !attachment.url || !attachment.type || !attachment.size) {
        return res.status(400).json({
          message: 'Invalid attachment data. Each attachment must have name, url, type, and size.',
        });
      }
    }

    // Add the attachments to the task
    task.attachments = [...task.attachments, ...attachments];
    await task.save();

    // Populate the task data before sending response
    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

    res.json(populatedTask);
  } catch (err) {
    console.error('Error adding attachment to task:', err);
    res.status(500).json({
      message: 'Failed to add attachment to task',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
});

// Remove attachment from task
router.delete('/:id/attachments/:attachmentIndex', protect, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // Check if user is task creator or assigned to
    if (
      task.createdBy.toString() !== req.user.id &&
      task.assignedTo?.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: 'Not authorized to modify this task',
      });
    }

    // Remove the attachment
    const attachmentIndex = parseInt(req.params.attachmentIndex);
    if (isNaN(attachmentIndex) || attachmentIndex < 0 || attachmentIndex >= task.attachments.length) {
      return res.status(400).json({
        message: 'Invalid attachment index',
      });
    }

    task.attachments.splice(attachmentIndex, 1);
    await task.save();

    // Populate the task data before sending response
    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

    res.json(populatedTask);
  } catch (err) {
    console.error('Error removing attachment from task:', err);
    res.status(500).json({
      message: 'Failed to remove attachment from task',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
});

// Update comment
router.put('/:id/comments/:commentId', protect, async (req, res, next) => {
  try {
    const { text, attachments } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        message: 'Comment text is required',
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // Check if user is comment author
    const comment = task.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({
        message: 'Comment not found',
      });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized to update this comment',
      });
    }

    // Validate attachments if provided
    if (attachments && !Array.isArray(attachments)) {
      return res.status(400).json({
        message: 'Attachments must be an array',
      });
    }

    if (attachments) {
      for (const attachment of attachments) {
        if (!attachment.name || !attachment.url || !attachment.type || !attachment.size) {
          return res.status(400).json({
            message: 'Each attachment must have name, url, type, and size',
          });
        }
      }
    }

    // Update the comment
    comment.text = text.trim();
    comment.attachments = attachments || comment.attachments;
    await task.save();

    // Populate the task data before sending response
    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

    res.json(populatedTask);
  } catch (err) {
    console.error('Error updating comment:', err);
    res.status(500).json({
      message: 'Failed to update comment',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
});

module.exports = router; 