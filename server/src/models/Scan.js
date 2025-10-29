const mongoose = require('mongoose');

const scanResultSchema = new mongoose.Schema(
  {
    tool: {
      type: String,
      required: true,
      enum: ['nikto', 'gobuster', 'nuclei', 'sqlmap', 'xsstrike'],
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
    },
    options: {
      type: Object,
      default: {},
    },
    output: {
      type: String,
      default: '',
    },
    error: {
      type: String,
      default: '',
    },
    startedAt: Date,
    finishedAt: Date,
  },
  {
    _id: false,
  }
);

const scanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetUrl: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      maxlength: 500,
    },
    results: [scanResultSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Scan', scanSchema);
