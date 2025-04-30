const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a team name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a team leader']
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Add member to team
teamSchema.methods.addMember = async function(userId) {
  if (!this.members.includes(userId)) {
    this.members.push(userId);
    await this.save();
  }
};

// Remove member from team
teamSchema.methods.removeMember = async function(userId) {
  this.members = this.members.filter(member => member.toString() !== userId.toString());
  await this.save();
};

// Add project to team
teamSchema.methods.addProject = async function(projectId) {
  if (!this.projects.includes(projectId)) {
    this.projects.push(projectId);
    await this.save();
  }
};

// Remove project from team
teamSchema.methods.removeProject = async function(projectId) {
  this.projects = this.projects.filter(project => project.toString() !== projectId.toString());
  await this.save();
};

const Team = mongoose.model('Team', teamSchema);

module.exports = Team; 