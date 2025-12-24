const subscriptionService = require('./subscriptionService');

/**
 * Remediation database for common vulnerabilities
 */
const REMEDIATION_DB = {
  sql_injection: {
    title: 'SQL Injection',
    description: 'SQL Injection allows attackers to manipulate database queries.',
    steps: [
      'Use parameterized queries or prepared statements',
      'Use ORM (Object-Relational Mapping) libraries',
      'Implement input validation and sanitization',
      'Apply principle of least privilege to database accounts',
      'Use stored procedures with parameterized inputs'
    ],
    codeExample: `// Bad - Vulnerable to SQL injection
const query = "SELECT * FROM users WHERE id = " + userId;

// Good - Parameterized query
const query = "SELECT * FROM users WHERE id = ?";
db.query(query, [userId]);

// Good - Using ORM (e.g., Sequelize)
User.findOne({ where: { id: userId } });`,
    resources: [
      'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html',
      'https://owasp.org/www-community/attacks/SQL_Injection'
    ]
  },

  xss: {
    title: 'Cross-Site Scripting (XSS)',
    description: 'XSS allows attackers to inject malicious scripts into web pages.',
    steps: [
      'Encode output data (HTML, JavaScript, URL encoding)',
      'Use Content Security Policy (CSP) headers',
      'Sanitize HTML input with libraries like DOMPurify',
      'Avoid innerHTML, use textContent instead',
      'Validate and sanitize all user inputs'
    ],
    codeExample: `// Bad - XSS vulnerable
element.innerHTML = userInput;

// Good - Safe text content
element.textContent = userInput;

// Good - Sanitized HTML (using DOMPurify)
element.innerHTML = DOMPurify.sanitize(userInput);

// Good - React automatically escapes
<div>{userInput}</div>`,
    resources: [
      'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html',
      'https://owasp.org/www-community/attacks/xss/'
    ]
  },

  command_injection: {
    title: 'Command Injection',
    description: 'Command injection allows execution of arbitrary system commands.',
    steps: [
      'Avoid using shell commands with user input',
      'Use language-native alternatives instead of shell commands',
      'If shell is necessary, use allowlists for permitted commands',
      'Never concatenate user input into commands',
      'Use subprocess with shell=False (Python) or execFile (Node.js)'
    ],
    codeExample: `// Bad - Command injection vulnerable
exec('ping ' + userInput);

// Good - Use execFile with arguments array
execFile('ping', ['-c', '4', validatedHost]);

// Python - Bad
os.system('ping ' + user_input)

// Python - Good
subprocess.run(['ping', '-c', '4', validated_host], shell=False)`,
    resources: [
      'https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html'
    ]
  },

  path_traversal: {
    title: 'Path Traversal',
    description: 'Path traversal allows access to files outside the intended directory.',
    steps: [
      'Validate and sanitize file paths',
      'Use path.resolve() and verify result is within allowed directory',
      'Implement allowlist for permitted file names',
      'Never use user input directly in file operations',
      'Use chroot or containerization for additional isolation'
    ],
    codeExample: `// Bad - Path traversal vulnerable
const file = './uploads/' + filename;

// Good - Validate path
const path = require('path');
const safePath = path.join('./uploads', path.basename(filename));
const resolved = path.resolve(safePath);
if (!resolved.startsWith(path.resolve('./uploads'))) {
  throw new Error('Invalid path');
}`,
    resources: [
      'https://owasp.org/www-community/attacks/Path_Traversal'
    ]
  },

  hardcoded_secrets: {
    title: 'Hardcoded Secrets',
    description: 'Hardcoded credentials can be extracted from source code.',
    steps: [
      'Use environment variables for all secrets',
      'Use a secrets management service (AWS Secrets Manager, HashiCorp Vault)',
      'Never commit secrets to version control',
      'Add secret patterns to .gitignore',
      'Use git-secrets or similar tools to prevent accidental commits'
    ],
    codeExample: `// Bad - Hardcoded secret
const apiKey = 'sk-abc123secret';

// Good - Environment variable
const apiKey = process.env.API_KEY;

// Good - With validation
const apiKey = process.env.API_KEY;
if (!apiKey) throw new Error('API_KEY not configured');`,
    resources: [
      'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html'
    ]
  },

  insecure_crypto: {
    title: 'Insecure Cryptography',
    description: 'Weak cryptographic algorithms can be broken by attackers.',
    steps: [
      'Use bcrypt, scrypt, or Argon2 for password hashing',
      'Use AES-256-GCM for encryption',
      'Use SHA-256 or SHA-3 for hashing (not MD5/SHA-1)',
      'Use crypto.randomBytes() for secure random numbers',
      'Keep cryptographic libraries updated'
    ],
    codeExample: `// Bad - MD5 is broken
const hash = crypto.createHash('md5').update(password).digest('hex');

// Good - bcrypt for passwords
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(password, 12);

// Good - SHA-256 for general hashing
const hash = crypto.createHash('sha256').update(data).digest('hex');

// Good - Secure random
const token = crypto.randomBytes(32).toString('hex');`,
    resources: [
      'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html'
    ]
  },

  auth_issues: {
    title: 'Authentication Issues',
    description: 'Weak authentication can lead to unauthorized access.',
    steps: [
      'Always verify JWT signatures with jwt.verify()',
      'Use strong algorithms (RS256, HS256)',
      'Implement proper session management',
      'Use constant-time comparison for tokens',
      'Implement rate limiting and account lockout'
    ],
    codeExample: `// Bad - Decode without verification
const payload = jwt.decode(token);

// Good - Verify signature
const payload = jwt.verify(token, secretKey, { algorithms: ['HS256'] });

// Good - Constant-time comparison
const crypto = require('crypto');
const isValid = crypto.timingSafeEqual(
  Buffer.from(providedToken),
  Buffer.from(storedToken)
);`,
    resources: [
      'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html'
    ]
  },

  insecure_deserialization: {
    title: 'Insecure Deserialization',
    description: 'Deserializing untrusted data can lead to code execution.',
    steps: [
      'Avoid deserializing untrusted data',
      'Use safe deserialization methods (yaml.safe_load)',
      'Implement integrity checks (signatures, checksums)',
      'Restrict deserialization to expected types',
      'Keep serialization libraries updated'
    ],
    codeExample: `# Python - Bad
data = pickle.loads(user_input)  # RCE vulnerability!

# Python - Good
data = json.loads(user_input)  # Safe for JSON

# YAML - Bad
data = yaml.load(user_input)  # Arbitrary code execution

# YAML - Good  
data = yaml.safe_load(user_input)`,
    resources: [
      'https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html'
    ]
  },

  insecure_config: {
    title: 'Insecure Configuration',
    description: 'Misconfiguration can expose the application to attacks.',
    steps: [
      'Set secure cookie flags (Secure, HttpOnly, SameSite)',
      'Configure CORS with specific origins (not *)',
      'Enable security headers (CSP, HSTS, X-Frame-Options)',
      'Disable debug mode in production',
      'Use HTTPS everywhere'
    ],
    codeExample: `// Secure cookie configuration
res.cookie('session', token, {
  secure: true,      // HTTPS only
  httpOnly: true,    // No JavaScript access
  sameSite: 'strict', // CSRF protection
  maxAge: 3600000    // 1 hour
});

// Secure CORS
app.use(cors({
  origin: ['https://myapp.com'],
  credentials: true
}));`,
    resources: [
      'https://cheatsheetseries.owasp.org/cheatsheets/Secure_Headers_Cheat_Sheet.html'
    ]
  }
};

/**
 * Get quick tips by severity
 */
const getQuickTips = (severity) => {
  const tips = {
    critical: [
      'Stop and fix immediately - this is exploitable',
      'Check logs for signs of exploitation',
      'Consider taking affected service offline',
      'Notify security team'
    ],
    high: [
      'Schedule fix within 24-48 hours',
      'Apply security patches',
      'Review access controls',
      'Enable additional monitoring'
    ],
    medium: [
      'Plan fix within 1-2 weeks',
      'Review security configuration',
      'Update security headers',
      'Add to security backlog'
    ],
    low: [
      'Add to improvement backlog',
      'Review in next security audit',
      'Document for compliance'
    ]
  };
  return tips[severity] || tips.medium;
};

/**
 * Map finding type to remediation key
 */
const mapTypeToKey = (type) => {
  const mapping = {
    'sql injection': 'sql_injection',
    'xss': 'xss',
    'cross site scripting': 'xss',
    'command injection': 'command_injection',
    'command execution': 'command_injection',
    'path traversal': 'path_traversal',
    'hardcoded secrets': 'hardcoded_secrets',
    'insecure crypto': 'insecure_crypto',
    'auth issues': 'auth_issues',
    'authentication': 'auth_issues',
    'insecure deserialization': 'insecure_deserialization',
    'insecure config': 'insecure_config',
    'info disclosure': 'insecure_config',
    'lfi': 'path_traversal',
    'dynamic require': 'command_injection',
    'dynamic import': 'command_injection'
  };
  return mapping[type.toLowerCase()] || null;
};

/**
 * Get basic remediation for findings
 */
const getBasicRemediationForFindings = (findings) => {
  if (!findings || findings.length === 0) {
    return { message: 'No findings to remediate', remediations: [] };
  }

  const remediations = findings.map(finding => {
    const key = mapTypeToKey(finding.type || finding.title || '');
    const remediation = key ? REMEDIATION_DB[key] : null;
    const tips = getQuickTips(finding.severity);

    return {
      finding: finding.title || finding.type || finding.description,
      severity: finding.severity,
      guidance: remediation || {
        title: 'General Security Issue',
        description: 'Review and address this security finding.',
        steps: [
          'Research the specific vulnerability',
          'Check vendor documentation',
          'Implement defense in depth',
          'Test the fix thoroughly'
        ]
      },
      quickTips: tips
    };
  });

  return { message: 'Remediation guidance', remediations };
};

/**
 * Generate detailed remediation (VIP feature)
 */
const generateRemediation = async (userId, scanId, findings, targetUrl) => {
  const hasFeature = await subscriptionService.hasAutoRemediation(userId);
  if (!hasFeature) {
    throw new Error('Detailed remediation is only available for VIP subscribers.');
  }

  if (!findings || findings.length === 0) {
    return {
      summary: 'No findings to remediate.',
      prioritizedActions: [],
      quickWins: ['Continue regular scanning', 'Keep software updated'],
      longTermRecommendations: ['Implement security training', 'Regular penetration testing']
    };
  }

  // Group findings by type
  const grouped = {};
  findings.forEach(f => {
    const key = mapTypeToKey(f.type || f.title || '') || 'other';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(f);
  });

  // Generate prioritized actions
  const prioritizedActions = [];
  let priority = 1;

  for (const [key, items] of Object.entries(grouped)) {
    const remediation = REMEDIATION_DB[key];
    if (!remediation) continue;

    const highestSeverity = items.reduce((max, item) => {
      const order = { critical: 4, high: 3, medium: 2, low: 1 };
      return order[item.severity] > order[max] ? item.severity : max;
    }, 'low');

    prioritizedActions.push({
      priority: priority++,
      title: remediation.title,
      finding: items.map(i => i.description || i.title).join('; '),
      severity: highestSeverity,
      effort: highestSeverity === 'critical' ? 'high' : 'medium',
      description: remediation.description,
      steps: remediation.steps,
      codeExample: remediation.codeExample,
      resources: remediation.resources
    });
  }

  // Sort by severity
  prioritizedActions.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highCount = findings.filter(f => f.severity === 'high').length;

  return {
    scanId,
    targetUrl,
    generatedAt: new Date().toISOString(),
    summary: `Found ${findings.length} security issues (${criticalCount} critical, ${highCount} high). Immediate action required for critical issues.`,
    prioritizedActions,
    quickWins: [
      'Update all dependencies to latest secure versions',
      'Enable security headers (CSP, HSTS)',
      'Review and rotate any exposed credentials',
      'Enable WAF rules for common attacks'
    ],
    longTermRecommendations: [
      'Implement automated security scanning in CI/CD',
      'Conduct regular penetration testing',
      'Provide security training for developers',
      'Establish incident response procedures'
    ],
    complianceNotes: {
      owasp: 'Review OWASP Top 10 for comprehensive coverage',
      pciDss: criticalCount > 0 ? 'Critical vulnerabilities may affect PCI-DSS compliance' : 'Address high-severity issues for compliance'
    }
  };
};

module.exports = {
  generateRemediation,
  getBasicRemediationForFindings,
  getQuickTips,
  REMEDIATION_DB
};
