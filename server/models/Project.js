const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a project name'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Please provide a team'],
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a project leader'],
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  }],
  status: {
    type: String,
    enum: ['planning', 'in-progress', 'review', 'completed', 'on-hold'],
    default: 'planning',
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
}, {
  timestamps: true,
});

// Add member to project
projectSchema.methods.addMember = async function(userId) {
  if (!this.members.includes(userId)) {
    this.members.push(userId);
    await this.save();
  }
};

// Remove member from project
projectSchema.methods.removeMember = async function(userId) {
  this.members = this.members.filter(member => member.toString() !== userId.toString());
  await this.save();
};

// Add task to project
projectSchema.methods.addTask = async function(taskId) {
  if (!this.tasks.includes(taskId)) {
    this.tasks.push(taskId);
    await this.save();
  }
};

// Remove task from project
projectSchema.methods.removeTask = async function(taskId) {
  this.tasks = this.tasks.filter(task => task.toString() !== taskId.toString());
  await this.save();
};

const Project = mongoose.model('Project', projectSchema);

module.exports = Project; 