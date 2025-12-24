const CodeReview = require('../models/CodeReview');
const subscriptionService = require('./subscriptionService');

/**
 * Security patterns for different vulnerability types
 */
const SECURITY_PATTERNS = {
  sql_injection: [
    { 
      pattern: /(\$\{.*\}|"\s*\+\s*\w+|\'\s*\+\s*\w+).*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|DROP|UNION)/gi,
      severity: 'critical',
      description: 'Potential SQL Injection vulnerability. User input concatenated into SQL query.',
      recommendation: 'Use parameterized queries or prepared statements.'
    },
    {
      pattern: /execute\s*\(\s*["'`].*\$|query\s*\(\s*["'`].*\+|raw\s*\(\s*["'`].*\$/gi,
      severity: 'critical',
      description: 'Raw SQL query with potential user input injection.',
      recommendation: 'Use ORM methods or parameterized queries.'
    },
    {
      pattern: /cursor\.execute\s*\(\s*f["']|cursor\.execute\s*\(\s*["'].*%/gi,
      severity: 'high',
      description: 'Python SQL query with format string - potential injection.',
      recommendation: 'Use parameterized queries: cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))'
    }
  ],

  xss: [
    {
      pattern: /innerHTML\s*=|outerHTML\s*=|document\.write\s*\(/gi,
      severity: 'high',
      description: 'Direct DOM manipulation detected which can lead to XSS.',
      recommendation: 'Use textContent instead of innerHTML, or sanitize with DOMPurify.'
    },
    {
      pattern: /dangerouslySetInnerHTML/gi,
      severity: 'high',
      description: 'React dangerouslySetInnerHTML usage detected.',
      recommendation: 'Avoid dangerouslySetInnerHTML or sanitize content first.'
    },
    {
      pattern: /\$\(.*\)\.html\s*\(/gi,
      severity: 'high',
      description: 'jQuery HTML manipulation that may lead to XSS.',
      recommendation: 'Use .text() instead of .html() or sanitize input.'
    },
    {
      pattern: /eval\s*\(|new\s+Function\s*\(/gi,
      severity: 'critical',
      description: 'Code execution function detected - potential code injection.',
      recommendation: 'Avoid eval() and new Function(). Use safer alternatives.'
    }
  ],

  command_injection: [
    {
      pattern: /exec\s*\(|system\s*\(|popen\s*\(|subprocess\.|child_process|shell\s*=\s*True/gi,
      severity: 'critical',
      description: 'System command execution detected.',
      recommendation: 'Validate and sanitize all input. Avoid shell=True.'
    },
    {
      pattern: /os\.system\s*\(/gi,
      severity: 'critical',
      description: 'Python command execution with potential injection.',
      recommendation: 'Use subprocess with shell=False.'
    }
  ],

  path_traversal: [
    {
      pattern: /\.\.\/|\.\.\\|%2e%2e/gi,
      severity: 'high',
      description: 'Path traversal pattern detected.',
      recommendation: 'Validate file paths and verify within allowed directory.'
    },
    {
      pattern: /readFile.*\+|readFileSync.*\+|open\s*\(.*\+/gi,
      severity: 'high',
      description: 'File read with concatenated path - potential path traversal.',
      recommendation: 'Sanitize file paths and use path.join() with validation.'
    }
  ],

  hardcoded_secrets: [
    {
      pattern: /(?:password|passwd|pwd|secret|api_key|apikey|token)[\s]*[=:]\s*["'][^"']{8,}/gi,
      severity: 'high',
      description: 'Potential hardcoded secret or credential detected.',
      recommendation: 'Use environment variables or a secrets manager.'
    },
    {
      pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/gi,
      severity: 'critical',
      description: 'Private key detected in source code.',
      recommendation: 'Never store private keys in code.'
    },
    {
      pattern: /(?:ghp_|gho_|github_pat_)[a-zA-Z0-9]{36,}/gi,
      severity: 'critical',
      description: 'GitHub token detected.',
      recommendation: 'Remove and use environment variables.'
    },
    {
      pattern: /(?:sk-|pk_live_|sk_live_)[a-zA-Z0-9]{20,}/gi,
      severity: 'critical',
      description: 'API key detected (Stripe/OpenAI).',
      recommendation: 'Remove and use environment variables.'
    }
  ],

  insecure_crypto: [
    {
      pattern: /md5\s*\(|MD5\.|hashlib\.md5|createHash\s*\(\s*["']md5/gi,
      severity: 'medium',
      description: 'MD5 hash usage - cryptographically broken.',
      recommendation: 'Use SHA-256 or bcrypt for passwords.'
    },
    {
      pattern: /sha1\s*\(|SHA1\.|hashlib\.sha1|createHash\s*\(\s*["']sha1/gi,
      severity: 'medium',
      description: 'SHA-1 hash usage - considered weak.',
      recommendation: 'Use SHA-256 or stronger.'
    },
    {
      pattern: /DES|RC4|Blowfish|ECB/gi,
      severity: 'high',
      description: 'Weak encryption algorithm detected.',
      recommendation: 'Use AES-256-GCM or ChaCha20-Poly1305.'
    },
    {
      pattern: /Math\.random\s*\(\)/gi,
      severity: 'medium',
      description: 'Weak random for security context.',
      recommendation: 'Use crypto.randomBytes() for security.'
    }
  ],

  auth_issues: [
    {
      pattern: /jwt\.decode\s*\(/gi,
      severity: 'medium',
      description: 'JWT decode without verification.',
      recommendation: 'Use jwt.verify() to validate signatures.'
    },
    {
      pattern: /algorithm\s*[=:]\s*["']none["']/gi,
      severity: 'critical',
      description: 'JWT with "none" algorithm - insecure.',
      recommendation: 'Use RS256 or HS256.'
    }
  ],

  insecure_deserialization: [
    {
      pattern: /pickle\.loads|yaml\.load\s*\([^,)]+\)|unserialize\s*\(/gi,
      severity: 'critical',
      description: 'Insecure deserialization detected.',
      recommendation: 'Use yaml.safe_load() or safe alternatives.'
    }
  ],

  info_disclosure: [
    {
      pattern: /console\.log\s*\(.*(?:password|secret|token|key)/gi,
      severity: 'medium',
      description: 'Sensitive data may be logged.',
      recommendation: 'Remove or mask sensitive data from logs.'
    }
  ],

  insecure_config: [
    {
      pattern: /Access-Control-Allow-Origin.*\*/gi,
      severity: 'medium',
      description: 'Permissive CORS configuration.',
      recommendation: 'Specify allowed origins explicitly.'
    },
    {
      pattern: /secure\s*:\s*false|httpOnly\s*:\s*false/gi,
      severity: 'high',
      description: 'Insecure cookie configuration.',
      recommendation: 'Set secure: true and httpOnly: true.'
    }
  ]
};

const LANGUAGE_PATTERNS = {
  javascript: [
    {
      pattern: /require\s*\(\s*\w+\s*\)/gi,
      type: 'dynamic_require',
      severity: 'high',
      description: 'Dynamic require - potential code injection.',
      recommendation: 'Avoid dynamic require with variables.'
    }
  ],
  php: [
    {
      pattern: /include\s*\(\s*\$|require\s*\(\s*\$/gi,
      type: 'lfi',
      severity: 'critical',
      description: 'Local File Inclusion vulnerability.',
      recommendation: 'Never use user input in include/require.'
    }
  ],
  java: [
    {
      pattern: /Runtime\.getRuntime\s*\(\s*\)\.exec/gi,
      type: 'command_injection',
      severity: 'critical',
      description: 'Command execution detected.',
      recommendation: 'Use ProcessBuilder with argument list.'
    }
  ],
  go: [
    {
      pattern: /exec\.Command/gi,
      type: 'command_execution',
      severity: 'high',
      description: 'Go command execution detected.',
      recommendation: 'Validate all command arguments.'
    }
  ],
  python: [
    {
      pattern: /__import__\s*\(/gi,
      type: 'dynamic_import',
      severity: 'high',
      description: 'Dynamic import detected.',
      recommendation: 'Avoid with user-controlled values.'
    }
  ]
};

/**
 * Analyze code for vulnerabilities
 */
const analyzeCode = (code, language) => {
  const vulnerabilities = [];

  for (const [type, patterns] of Object.entries(SECURITY_PATTERNS)) {
    for (const rule of patterns) {
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      let match;
      
      while ((match = regex.exec(code)) !== null) {
        const beforeMatch = code.substring(0, match.index);
        const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;
        
        vulnerabilities.push({
          type: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          severity: rule.severity,
          line: lineNumber,
          description: rule.description,
          recommendation: rule.recommendation,
          matchedCode: match[0].substring(0, 60)
        });
      }
    }
  }

  const langPatterns = LANGUAGE_PATTERNS[language] || [];
  for (const rule of langPatterns) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match;
    
    while ((match = regex.exec(code)) !== null) {
      const beforeMatch = code.substring(0, match.index);
      const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;
      
      vulnerabilities.push({
        type: rule.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        severity: rule.severity,
        line: lineNumber,
        description: rule.description,
        recommendation: rule.recommendation,
        matchedCode: match[0].substring(0, 60)
      });
    }
  }

  // Deduplicate
  const seen = new Set();
  return vulnerabilities.filter(v => {
    const key = v.type + '-' + v.line;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return order[a.severity] - order[b.severity];
  });
};

const calculateOverallRisk = (vulns) => {
  if (vulns.length === 0) return 'secure';
  if (vulns.some(v => v.severity === 'critical')) return 'critical';
  if (vulns.some(v => v.severity === 'high')) return 'high';
  if (vulns.some(v => v.severity === 'medium')) return 'medium';
  return 'low';
};

const generateSummary = (vulns) => {
  if (vulns.length === 0) {
    return 'No security vulnerabilities detected. Code appears secure.';
  }
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  vulns.forEach(v => counts[v.severity]++);
  const parts = [];
  if (counts.critical) parts.push(counts.critical + ' critical');
  if (counts.high) parts.push(counts.high + ' high');
  if (counts.medium) parts.push(counts.medium + ' medium');
  if (counts.low) parts.push(counts.low + ' low');
  return 'Found ' + vulns.length + ' issue(s): ' + parts.join(', ') + '. Address critical/high issues first.';
};

const reviewCode = async (userId, codeSnippet, language, title) => {
  const canReview = await subscriptionService.canPerformCodeReview(userId);
  if (!canReview.allowed) throw new Error(canReview.reason);

  const review = new CodeReview({
    user: userId,
    language,
    codeSnippet,
    title: title || 'Untitled Review',
    status: 'processing'
  });
  await review.save();

  const startTime = Date.now();
  try {
    const vulnerabilities = analyzeCode(codeSnippet, language);
    review.status = 'completed';
    review.vulnerabilities = vulnerabilities;
    review.overallRisk = calculateOverallRisk(vulnerabilities);
    review.summary = generateSummary(vulnerabilities);
    review.processingTime = Date.now() - startTime;
    await review.save();
    await subscriptionService.incrementCodeReviewCount(userId);
    return review;
  } catch (error) {
    review.status = 'failed';
    review.error = error.message;
    await review.save();
    throw error;
  }
};

const getReviewHistory = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    CodeReview.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-codeSnippet'),
    CodeReview.countDocuments({ user: userId })
  ]);
  return { reviews, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

const getReviewById = async (userId, reviewId) => {
  const review = await CodeReview.findOne({ _id: reviewId, user: userId });
  if (!review) throw new Error('Review not found');
  return review;
};

const deleteReview = async (userId, reviewId) => {
  const result = await CodeReview.deleteOne({ _id: reviewId, user: userId });
  if (result.deletedCount === 0) throw new Error('Review not found');
  return { success: true };
};

const getReviewStats = async (userId) => {
  const stats = await CodeReview.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        completedReviews: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        criticalVulns: {
          $sum: { $size: { $filter: { input: { $ifNull: ['$vulnerabilities', []] }, cond: { $eq: ['$$this.severity', 'critical'] } } } }
        },
        highVulns: {
          $sum: { $size: { $filter: { input: { $ifNull: ['$vulnerabilities', []] }, cond: { $eq: ['$$this.severity', 'high'] } } } }
        },
        avgProcessingTime: { $avg: '$processingTime' }
      }
    }
  ]);
  return stats[0] || { totalReviews: 0, completedReviews: 0, criticalVulns: 0, highVulns: 0, avgProcessingTime: 0 };
};

module.exports = { reviewCode, getReviewHistory, getReviewById, deleteReview, getReviewStats, analyzeCode };
