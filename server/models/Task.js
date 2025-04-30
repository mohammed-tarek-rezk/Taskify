const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Please provide a comment'],
    trim: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a user'],
  },
  attachments: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    }
  }],
}, {
  timestamps: true,
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a task title'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a creator'],
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'completed'],
    default: 'todo',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  dueDate: {
    type: Date,
  },
  comments: [commentSchema],
  attachments: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    }
  }],
  tags: [{
    type: String,
    trim: true,
  }],
}, {
  timestamps: true,
});

// Add comment to task
taskSchema.methods.addComment = async function(userId, text) {
  this.comments.push({
    text,
    user: userId,
  });
  await this.save();
};

// Remove comment from task
taskSchema.methods.removeComment = async function(commentId) {
  this.comments = this.comments.filter(comment => comment._id.toString() !== commentId.toString());
  await this.save();
};

// Add attachment to task
taskSchema.methods.addAttachment = async function(name, url, type) {
  this.attachments.push({
    name,
    url,
    type,
  });
  await this.save();
};

// Remove attachment from task
taskSchema.methods.removeAttachment = async function(attachmentId) {
  this.attachments = this.attachments.filter(
    attachment => attachment._id.toString() !== attachmentId.toString()
  );
  await this.save();
};

const Task = mongoose.model('Task', taskSchema);

module.exports = Task; 