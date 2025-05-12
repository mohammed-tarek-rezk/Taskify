
const Project = require('../models/Project');
const Team = require('../models/Team');
const User = require('../models/User');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

// Get all projects
const getAllProjects = async (req, res, next) => {
  try {
    const { 
      search, 
      status, 
      priority, 
      team,
      leader,
      startDate,
      endDate,
      sortBy = 'startDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {
      $or: [
        { leader: req.user.id },
        { members: req.user.id }
      ]
    };

    // Add search filter
    if (search) {
      filter.$or.push(
        { name: { $regex: search, $options: 'i' } },
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

    // Add team filter
    if (team) {
      filter.team = team;
    }

    // Add leader filter
    if (leader) {
      filter.leader = leader;
    }

    // Add date range filter
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) {
        filter.startDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.startDate.$lte = new Date(endDate);
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get all projects with filters
    const projects = await Project.find(filter)
      .populate('team', 'name')
      .populate('leader', 'name email')
      .populate('members', 'name email')
      .sort(sort);

    res.json(projects);
  } catch (err) {
    next(err);
  }
};

// Create project
const createProject =  async (req, res, next) => {
  try {
    const { name, description, team, members, endDate, priority } = req.body;

    // Validate end date
    if (endDate) {
      const currentDate = new Date();
      const endDateObj = new Date(endDate);
      
      if (endDateObj <= currentDate) {
        return res.status(400).json({
          message: 'End date must be after the current date',
        });
      }
    }

    // Check if team exists
    const teamExists = await Team.findById(team);
    if (!teamExists) {
      return res.status(404).json({
        message: 'Team not found',
      });
    }

    // Check if user is team member
    if (!teamExists.members.includes(req.user.id)) {
      return res.status(403).json({
        message: 'Not authorized to create projects for this team',
      });
    }

    const project = await Project.create({
      name,
      description,
      team,
      leader: req.user.id,
      members: [req.user.id],
      endDate,
      priority,
    });

    // Add project to team
    await teamExists.addProject(project._id);

    // Add project to user's projects
    await User.findByIdAndUpdate(req.user.id, {
      $push: { projects: project._id },
    });

    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

// Get project by ID
const getOneProject =  async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('team', 'name')
      .populate('leader', 'name email')
      .populate('members', 'name email')
      .populate('tasks');

    if (!project) {
      return res.status(404).json({
        message: 'Project not found',
      });
    }

    // Check if user has access to the project
    if (
      project.leader.toString() !== req.user.id &&
      !project.members.some(member => member._id.toString() === req.user.id)
    ) {
      return res.status(403).json({
        message: 'Not authorized to access this project',
      });
    }

    res.json(project);
  } catch (err) {
    next(err);
  }
};

// Update project
const updateProject =  async (req, res, next) => {
  try {
    const { name, description, status, priority, endDate } = req.body;

    // Validate end date
    if (endDate) {
      const currentDate = new Date();
      const endDateObj = new Date(endDate);
      
      if (endDateObj <= currentDate) {
        return res.status(400).json({
          message: 'End date must be after the current date',
        });
      }

      // If project exists, check if end date is after start date
      const project = await Project.findById(req.params.id);
      if (project && project.startDate && endDateObj <= new Date(project.startDate)) {
        return res.status(400).json({
          message: 'End date must be after the project start date',
        });
      }
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: 'Project not found',
      });
    }

    // Check if user is project leader
    if (project.leader.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized to update this project',
      });
    }

    project.name = name || project.name;
    project.description = description || project.description;
    project.endDate = endDate || project.endDate;
    project.priority = priority || project.priority;
    project.status = status || project.status;
    await project.save();

    res.json(project);
  } catch (err) {
    next(err);
  }
};

// Delete project
const deleteProject =  async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: 'Project not found',
      });
    }

    // Check if user is project leader
    if (project.leader.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized to delete this project',
      });
    }

    // Remove project from team
    const team = await Team.findById(project.team);
    if (team) {
      await team.removeProject(project._id);
    }

    // Remove project from all members
    await User.updateMany(
      { projects: project._id },
      { $pull: { projects: project._id } }
    );

    // Remove project from all tasks
    await Task.updateMany(
      { project: project._id },
      { $unset: { project: 1 } }
    );

    // Delete the project using findByIdAndDelete
    await Project.findByIdAndDelete(project._id);

    res.json({
      message: 'Project deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

// Add project member
const addProjectMember =  async (req, res, next) => {
  try {
    const { email } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: 'Project not found',
      });
    }

    // Check if user is project leader
    if (project.leader.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized to add members to this project',
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
    if (project.members.includes(user._id)) {
      return res.status(400).json({
        message: 'User is already a member of this project',
      });
    }

    // Add user to project
    await project.addMember(user._id);

    // Add project to user's projects
    await User.findByIdAndUpdate(user._id, {
      $push: { projects: project._id },
    });

    res.json(project);
  } catch (err) {
    next(err);
  }
};

// Remove project member
const removeProjectMember =  async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: 'Project not found',
      });
    }

    // Check if user is project leader
    if (project.leader.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized to remove members from this project',
      });
    }

    // Check if member exists
    if (!project.members.includes(req.params.memberId)) {
      return res.status(404).json({
        message: 'Member not found in project',
      });
    }

    // Remove member from project
    await project.removeMember(req.params.memberId);

    // Remove project from user's projects
    await User.findByIdAndUpdate(req.params.memberId, {
      $pull: { projects: project._id },
    });

    res.json(project);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProject,
  getOneProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  getAllProjects
}; 