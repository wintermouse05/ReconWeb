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
  cwe: String, // CWE reference (e.g., "CWE-89")
  owasp: String, // OWASP Top 10 reference (e.g., "A03:2021")
  description: String,
  recommendation: String,
  matchedCode: String, // The code pattern that matched
  codeContext: String, // The line of code for context
  example: { // Secure coding example
    vulnerable: String,
    secure: String
  },
  fixedCode: String
}, { _id: false });

const owaspIssueSchema = new mongoose.Schema({
  code: String, // e.g., "A03:2021"
  name: String, // e.g., "Injection"
  issueCount: Number,
  issues: [{
    type: { type: String }, // vulnerability type (e.g., "Xss", "SQLi")
    severity: { type: String },
    line: { type: Number },
    cwe: { type: String }
  }]
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
  owaspCompliance: [owaspIssueSchema], // OWASP Top 10 compliance report
  analysisMetadata: {
    patternsChecked: Number,
    languagePatternsChecked: Number,
    linesAnalyzed: Number,
    analysisVersion: String
  },
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
codeReviewSchema.index({ 'vulnerabilities.severity': 1 });
codeReviewSchema.index({ overallRisk: 1 });

module.exports = mongoose.model('CodeReview', codeReviewSchema);
