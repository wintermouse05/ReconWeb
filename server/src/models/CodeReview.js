const mongoose = require('mongoose');

const vulnerabilitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low', 'info'],
    required: true
  },
  line: Number,
  description: String,
  recommendation: String,
  fixedCode: String
}, { _id: false });

const codeReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  language: {
    type: String,
    required: true,
    enum: ['javascript', 'typescript', 'python', 'java', 'php', 'csharp', 'go', 'ruby', 'sql', 'html', 'other']
  },
  codeSnippet: {
    type: String,
    required: true,
    maxlength: 50000
  },
  title: {
    type: String,
    default: 'Untitled Review'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  vulnerabilities: [vulnerabilitySchema],
  overallRisk: {
    type: String,
    enum: ['secure', 'low', 'medium', 'high', 'critical'],
    default: 'secure'
  },
  summary: String,
  aiResponse: {
    type: Object,
    default: null
  },
  processingTime: Number,
  error: String
}, {
  timestamps: true
});

// Index for user queries
codeReviewSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('CodeReview', codeReviewSchema);
