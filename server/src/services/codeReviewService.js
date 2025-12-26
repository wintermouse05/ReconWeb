const CodeReview = require('../models/CodeReview');
const subscriptionService = require('./subscriptionService');

/**
 * OWASP-based Security Patterns for Code Review
 * Reference: OWASP Code Review Guide, OWASP Top 10, OWASP Cheat Sheet Series
 * Each pattern includes CWE (Common Weakness Enumeration) references
 */
const SECURITY_PATTERNS = {
  // ===========================================
  // A03:2021 - INJECTION
  // ===========================================
  sql_injection: [
    { 
      pattern: /(\$\{.*\}|"\s*\+\s*\w+|\'\s*\+\s*\w+).*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|DROP|UNION|TRUNCATE|ALTER|CREATE|EXEC)/gi,
      severity: 'critical',
      cwe: 'CWE-89',
      owasp: 'A03:2021',
      description: 'SQL Injection: User input concatenated into SQL query without parameterization.',
      recommendation: 'Use parameterized queries or prepared statements. Never concatenate user input into SQL.',
      example: {
        vulnerable: 'query("SELECT * FROM users WHERE id = " + userId)',
        secure: 'query("SELECT * FROM users WHERE id = ?", [userId])'
      }
    },
    {
      pattern: /execute\s*\(\s*["'`].*\$|query\s*\(\s*["'`].*\+|raw\s*\(\s*["'`].*\$/gi,
      severity: 'critical',
      cwe: 'CWE-89',
      owasp: 'A03:2021',
      description: 'Raw SQL query with string interpolation detected.',
      recommendation: 'Use ORM methods with parameter binding or prepared statements.'
    },
    {
      pattern: /cursor\.execute\s*\(\s*f["']|cursor\.execute\s*\(\s*["'].*%|\.format\s*\(.*\).*(?:SELECT|INSERT|UPDATE|DELETE)/gi,
      severity: 'critical',
      cwe: 'CWE-89',
      owasp: 'A03:2021',
      description: 'Python SQL query with f-string or format string - SQL injection risk.',
      recommendation: 'Use parameterized queries: cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))'
    },
    {
      pattern: /StringBuffer|StringBuilder.*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)/gi,
      severity: 'high',
      cwe: 'CWE-89',
      owasp: 'A03:2021',
      description: 'Java SQL query built with StringBuffer/StringBuilder.',
      recommendation: 'Use PreparedStatement with parameter binding.'
    },
    {
      pattern: /\$wpdb->query\s*\(\s*["'].*\$/gi,
      severity: 'critical',
      cwe: 'CWE-89',
      owasp: 'A03:2021',
      description: 'WordPress direct query with variable injection.',
      recommendation: 'Use $wpdb->prepare() for parameterized queries.'
    }
  ],

  nosql_injection: [
    {
      pattern: /\$where|\.find\s*\(\s*\{.*\$|\.aggregate\s*\(\s*\[.*\$/gi,
      severity: 'high',
      cwe: 'CWE-943',
      owasp: 'A03:2021',
      description: 'NoSQL injection risk: Query operators from user input.',
      recommendation: 'Sanitize input and avoid $where. Use schema validation.'
    },
    {
      pattern: /JSON\.parse\s*\(.*req\.(body|query|params)/gi,
      severity: 'high',
      cwe: 'CWE-943',
      owasp: 'A03:2021',
      description: 'Parsing user input as JSON for database queries.',
      recommendation: 'Validate and sanitize parsed JSON before database operations.'
    }
  ],

  ldap_injection: [
    {
      pattern: /ldap_search.*\+|ldap_bind.*\+|\(\&\(|\(\|\(/gi,
      severity: 'high',
      cwe: 'CWE-90',
      owasp: 'A03:2021',
      description: 'LDAP injection: User input in LDAP filter.',
      recommendation: 'Escape LDAP special characters: *, (, ), \\, NUL'
    }
  ],

  xpath_injection: [
    {
      pattern: /xpath\s*\(.*\+|selectNodes\s*\(.*\+|evaluate\s*\(.*\+/gi,
      severity: 'high',
      cwe: 'CWE-643',
      owasp: 'A03:2021',
      description: 'XPath injection: User input in XPath query.',
      recommendation: 'Use parameterized XPath queries or validate input strictly.'
    }
  ],

  // ===========================================
  // A03:2021 - XSS (Cross-Site Scripting)
  // ===========================================
  xss: [
    {
      pattern: /innerHTML\s*=|outerHTML\s*=|document\.write\s*\(/gi,
      severity: 'high',
      cwe: 'CWE-79',
      owasp: 'A03:2021',
      description: 'DOM-based XSS: Direct HTML injection via innerHTML/document.write.',
      recommendation: 'Use textContent for text, or sanitize with DOMPurify before innerHTML.',
      example: {
        vulnerable: 'element.innerHTML = userInput',
        secure: 'element.textContent = userInput'
      }
    },
    {
      pattern: /dangerouslySetInnerHTML/gi,
      severity: 'high',
      cwe: 'CWE-79',
      owasp: 'A03:2021',
      description: 'React dangerouslySetInnerHTML bypasses XSS protection.',
      recommendation: 'Sanitize with DOMPurify: dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(html)}}'
    },
    {
      pattern: /\$\(.*\)\.html\s*\(|\.append\s*\(.*\<|\.prepend\s*\(.*\</gi,
      severity: 'high',
      cwe: 'CWE-79',
      owasp: 'A03:2021',
      description: 'jQuery XSS: HTML injection via .html(), .append(), .prepend().',
      recommendation: 'Use .text() for text content or sanitize HTML input.'
    },
    {
      pattern: /eval\s*\(|new\s+Function\s*\(|setTimeout\s*\(\s*["'`]|setInterval\s*\(\s*["'`]/gi,
      severity: 'critical',
      cwe: 'CWE-95',
      owasp: 'A03:2021',
      description: 'Code injection: eval/Function execution with potential user input.',
      recommendation: 'Never use eval() with user data. Use JSON.parse() for data parsing.'
    },
    {
      pattern: /location\s*=|location\.href\s*=|location\.replace\s*\(/gi,
      severity: 'medium',
      cwe: 'CWE-79',
      owasp: 'A03:2021',
      description: 'DOM XSS sink: Location manipulation.',
      recommendation: 'Validate URLs against allowlist before redirect.'
    },
    {
      pattern: /v-html\s*=|ng-bind-html|{{{.*}}}/gi,
      severity: 'high',
      cwe: 'CWE-79',
      owasp: 'A03:2021',
      description: 'Vue/Angular raw HTML binding - XSS risk.',
      recommendation: 'Sanitize content before binding or use text interpolation.'
    },
    {
      pattern: /res\.send\s*\(.*req\.|res\.write\s*\(.*req\./gi,
      severity: 'high',
      cwe: 'CWE-79',
      owasp: 'A03:2021',
      description: 'Reflected XSS: User input directly in response.',
      recommendation: 'Encode output using context-appropriate encoding.'
    }
  ],

  // ===========================================
  // A03:2021 - COMMAND INJECTION
  // ===========================================
  command_injection: [
    {
      pattern: /child_process\.exec\s*\(|execSync\s*\(|spawn\s*\(.*shell\s*:\s*true/gi,
      severity: 'critical',
      cwe: 'CWE-78',
      owasp: 'A03:2021',
      description: 'OS Command Injection: Shell command with potential user input.',
      recommendation: 'Use spawn() with arguments array, never shell: true with user input.',
      example: {
        vulnerable: 'exec("ls " + userInput)',
        secure: 'spawn("ls", ["-la", sanitizedPath], {shell: false})'
      }
    },
    {
      pattern: /os\.system\s*\(|os\.popen\s*\(|subprocess\.call\s*\(.*shell\s*=\s*True/gi,
      severity: 'critical',
      cwe: 'CWE-78',
      owasp: 'A03:2021',
      description: 'Python command injection with shell execution.',
      recommendation: 'Use subprocess.run() with shell=False and argument list.'
    },
    {
      pattern: /Runtime\.getRuntime\s*\(\s*\)\.exec|ProcessBuilder/gi,
      severity: 'high',
      cwe: 'CWE-78',
      owasp: 'A03:2021',
      description: 'Java command execution detected.',
      recommendation: 'Use ProcessBuilder with argument list, validate all inputs.'
    },
    {
      pattern: /system\s*\(|passthru\s*\(|shell_exec\s*\(|popen\s*\(|proc_open\s*\(/gi,
      severity: 'critical',
      cwe: 'CWE-78',
      owasp: 'A03:2021',
      description: 'PHP command execution function.',
      recommendation: 'Use escapeshellarg() and escapeshellcmd(), or avoid shell commands.'
    },
    {
      pattern: /`.*\$|`.*\+/gi,
      severity: 'high',
      cwe: 'CWE-78',
      owasp: 'A03:2021',
      description: 'Backtick command execution with variable interpolation.',
      recommendation: 'Avoid backticks, use explicit subprocess with argument arrays.'
    }
  ],

  // ===========================================
  // A01:2021 - BROKEN ACCESS CONTROL
  // ===========================================
  path_traversal: [
    {
      pattern: /\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\.\.%2f/gi,
      severity: 'high',
      cwe: 'CWE-22',
      owasp: 'A01:2021',
      description: 'Path traversal pattern detected in code.',
      recommendation: 'Use path.resolve() and verify path is within allowed directory.'
    },
    {
      pattern: /readFile\s*\(.*\+|readFileSync\s*\(.*\+|fs\..*\(.*req\./gi,
      severity: 'high',
      cwe: 'CWE-22',
      owasp: 'A01:2021',
      description: 'File operation with user-controlled path.',
      recommendation: 'Validate path: path.resolve(base, input).startsWith(base)',
      example: {
        vulnerable: 'fs.readFile(userPath)',
        secure: 'const safePath = path.resolve(baseDir, userInput);\nif (!safePath.startsWith(baseDir)) throw new Error("Invalid path");'
      }
    },
    {
      pattern: /include\s*\(\s*\$|require\s*\(\s*\$|include_once\s*\(\s*\$/gi,
      severity: 'critical',
      cwe: 'CWE-98',
      owasp: 'A01:2021',
      description: 'PHP Local/Remote File Inclusion vulnerability.',
      recommendation: 'Never use user input in include/require. Use allowlist approach.'
    },
    {
      pattern: /open\s*\(.*\+.*['"]\s*[rwa]/gi,
      severity: 'high',
      cwe: 'CWE-22',
      owasp: 'A01:2021',
      description: 'Python file open with concatenated path.',
      recommendation: 'Validate path using os.path.realpath() and check prefix.'
    }
  ],

  insecure_direct_object_reference: [
    {
      pattern: /findById\s*\(.*req\.params|findOne\s*\(\s*\{\s*_id\s*:\s*req\.params/gi,
      severity: 'medium',
      cwe: 'CWE-639',
      owasp: 'A01:2021',
      description: 'IDOR: Direct database lookup with user-supplied ID.',
      recommendation: 'Verify user has permission to access the resource.'
    },
    {
      pattern: /\.find\s*\(\s*\{\s*id\s*:\s*req\.(params|query|body)/gi,
      severity: 'medium',
      cwe: 'CWE-639',
      owasp: 'A01:2021',
      description: 'Potential IDOR vulnerability.',
      recommendation: 'Add authorization check: verify resource belongs to user.'
    }
  ],

  // ===========================================
  // A02:2021 - CRYPTOGRAPHIC FAILURES
  // ===========================================
  hardcoded_secrets: [
    {
      pattern: /(?:password|passwd|pwd|secret|api_?key|apikey|auth_?token|access_?token|private_?key)[\s]*[=:]\s*["'][^"'\s]{8,}/gi,
      severity: 'critical',
      cwe: 'CWE-798',
      owasp: 'A02:2021',
      description: 'Hardcoded credential or secret detected.',
      recommendation: 'Use environment variables or a secrets manager (AWS Secrets Manager, HashiCorp Vault).',
      example: {
        vulnerable: 'const API_KEY = "sk-1234567890abcdef"',
        secure: 'const API_KEY = process.env.API_KEY'
      }
    },
    {
      pattern: /-----BEGIN\s+(RSA\s+|EC\s+|DSA\s+|OPENSSH\s+)?PRIVATE\s+KEY-----/gi,
      severity: 'critical',
      cwe: 'CWE-321',
      owasp: 'A02:2021',
      description: 'Private key embedded in source code.',
      recommendation: 'Store private keys in secure key management system, never in code.'
    },
    {
      pattern: /(?:ghp_|gho_|github_pat_|glpat-)[a-zA-Z0-9]{20,}/gi,
      severity: 'critical',
      cwe: 'CWE-798',
      owasp: 'A02:2021',
      description: 'GitHub/GitLab access token detected.',
      recommendation: 'Revoke immediately and use environment variables.'
    },
    {
      pattern: /(?:sk-|pk_live_|sk_live_|rk_live_|sk_test_)[a-zA-Z0-9]{20,}/gi,
      severity: 'critical',
      cwe: 'CWE-798',
      owasp: 'A02:2021',
      description: 'API key detected (Stripe/OpenAI/etc).',
      recommendation: 'Rotate key immediately, use environment variables.'
    },
    {
      pattern: /AKIA[0-9A-Z]{16}/gi,
      severity: 'critical',
      cwe: 'CWE-798',
      owasp: 'A02:2021',
      description: 'AWS Access Key ID detected.',
      recommendation: 'Use IAM roles or AWS Secrets Manager.'
    },
    {
      pattern: /(?:mongodb|mysql|postgres|redis):\/\/[^:]+:[^@]+@/gi,
      severity: 'critical',
      cwe: 'CWE-798',
      owasp: 'A02:2021',
      description: 'Database connection string with credentials.',
      recommendation: 'Use environment variables for database credentials.'
    }
  ],

  insecure_crypto: [
    {
      pattern: /md5\s*\(|MD5\.|hashlib\.md5|createHash\s*\(\s*["']md5|DigestUtils\.md5/gi,
      severity: 'high',
      cwe: 'CWE-328',
      owasp: 'A02:2021',
      description: 'MD5 hash usage - cryptographically broken for security purposes.',
      recommendation: 'Use SHA-256 for integrity, bcrypt/Argon2 for passwords.'
    },
    {
      pattern: /sha1\s*\(|SHA1\.|hashlib\.sha1|createHash\s*\(\s*["']sha1|DigestUtils\.sha1/gi,
      severity: 'medium',
      cwe: 'CWE-328',
      owasp: 'A02:2021',
      description: 'SHA-1 hash usage - considered weak, collision attacks possible.',
      recommendation: 'Use SHA-256 or SHA-3 for cryptographic operations.'
    },
    {
      pattern: /DES|3DES|RC4|RC2|Blowfish|IDEA/gi,
      severity: 'high',
      cwe: 'CWE-327',
      owasp: 'A02:2021',
      description: 'Weak/deprecated encryption algorithm.',
      recommendation: 'Use AES-256-GCM or ChaCha20-Poly1305.'
    },
    {
      pattern: /ECB|AES\/ECB|Cipher\.getInstance\s*\(\s*["']AES["']\s*\)/gi,
      severity: 'high',
      cwe: 'CWE-327',
      owasp: 'A02:2021',
      description: 'ECB mode encryption - patterns can be detected.',
      recommendation: 'Use GCM or CBC mode with random IV.'
    },
    {
      pattern: /Math\.random\s*\(\)|rand\s*\(\)|random\s*\(\)/gi,
      severity: 'medium',
      cwe: 'CWE-330',
      owasp: 'A02:2021',
      description: 'Weak PRNG for security-sensitive context.',
      recommendation: 'Use crypto.randomBytes() (Node), secrets module (Python), SecureRandom (Java).'
    },
    {
      pattern: /new\s+Random\s*\(\)|Random\s*\(\s*\)/gi,
      severity: 'medium',
      cwe: 'CWE-330',
      owasp: 'A02:2021',
      description: 'Java Random class is not cryptographically secure.',
      recommendation: 'Use java.security.SecureRandom for security contexts.'
    },
    {
      pattern: /padding\s*:\s*["']PKCS5["']|PKCS5Padding/gi,
      severity: 'low',
      cwe: 'CWE-649',
      owasp: 'A02:2021',
      description: 'PKCS5 padding may be vulnerable to padding oracle attacks.',
      recommendation: 'Use authenticated encryption (GCM) which handles padding securely.'
    }
  ],

  // ===========================================
  // A07:2021 - IDENTIFICATION AND AUTH FAILURES
  // ===========================================
  auth_issues: [
    {
      pattern: /jwt\.decode\s*\((?![^)]*verify)/gi,
      severity: 'high',
      cwe: 'CWE-347',
      owasp: 'A07:2021',
      description: 'JWT decode without signature verification.',
      recommendation: 'Always use jwt.verify() to validate token signature.'
    },
    {
      pattern: /algorithm\s*[=:]\s*["']none["']|"alg"\s*:\s*"none"/gi,
      severity: 'critical',
      cwe: 'CWE-327',
      owasp: 'A07:2021',
      description: 'JWT with "none" algorithm - completely insecure.',
      recommendation: 'Always specify allowed algorithms: ["RS256", "HS256"]'
    },
    {
      pattern: /algorithms\s*:\s*\[.*["']none["']/gi,
      severity: 'critical',
      cwe: 'CWE-327',
      owasp: 'A07:2021',
      description: 'JWT verification allows "none" algorithm.',
      recommendation: 'Remove "none" from allowed algorithms list.'
    },
    {
      pattern: /password.*==|password.*===|strcmp\s*\(.*password/gi,
      severity: 'high',
      cwe: 'CWE-208',
      owasp: 'A07:2021',
      description: 'Password comparison vulnerable to timing attacks.',
      recommendation: 'Use constant-time comparison: crypto.timingSafeEqual()'
    },
    {
      pattern: /session\s*\[\s*["']user|req\.session\.user\s*=\s*req\.(body|query)/gi,
      severity: 'high',
      cwe: 'CWE-384',
      owasp: 'A07:2021',
      description: 'Session fixation: User data directly assigned to session.',
      recommendation: 'Regenerate session ID after authentication.'
    },
    {
      pattern: /sameSite\s*:\s*["']none["'](?!.*secure\s*:\s*true)/gi,
      severity: 'high',
      cwe: 'CWE-1275',
      owasp: 'A07:2021',
      description: 'SameSite=None without Secure flag.',
      recommendation: 'SameSite=None requires Secure flag for HTTPS.'
    }
  ],

  // ===========================================
  // A08:2021 - SOFTWARE AND DATA INTEGRITY FAILURES
  // ===========================================
  insecure_deserialization: [
    {
      pattern: /pickle\.loads?|cPickle\.loads?/gi,
      severity: 'critical',
      cwe: 'CWE-502',
      owasp: 'A08:2021',
      description: 'Python pickle deserialization - arbitrary code execution risk.',
      recommendation: 'Use JSON or implement secure deserialization with hmac verification.'
    },
    {
      pattern: /yaml\.load\s*\([^)]*(?!Loader\s*=\s*yaml\.SafeLoader)/gi,
      severity: 'critical',
      cwe: 'CWE-502',
      owasp: 'A08:2021',
      description: 'YAML load without SafeLoader - code execution risk.',
      recommendation: 'Use yaml.safe_load() or specify Loader=yaml.SafeLoader'
    },
    {
      pattern: /unserialize\s*\(|ObjectInputStream|readObject\s*\(/gi,
      severity: 'critical',
      cwe: 'CWE-502',
      owasp: 'A08:2021',
      description: 'Insecure deserialization detected.',
      recommendation: 'Avoid deserializing untrusted data. Use JSON with schema validation.'
    },
    {
      pattern: /Marshal\.load|JSON\.parse\s*\(.*\)\s*\.constructor/gi,
      severity: 'high',
      cwe: 'CWE-502',
      owasp: 'A08:2021',
      description: 'Potential prototype pollution or unsafe deserialization.',
      recommendation: 'Validate parsed data structure before use.'
    },
    {
      pattern: /eval\s*\(\s*JSON\.stringify|Function\s*\(\s*["']return\s*["']\s*\+/gi,
      severity: 'critical',
      cwe: 'CWE-502',
      owasp: 'A08:2021',
      description: 'Code execution via JSON manipulation.',
      recommendation: 'Never use eval() on serialized data.'
    }
  ],

  // ===========================================
  // A04:2021 - INSECURE DESIGN
  // ===========================================
  mass_assignment: [
    {
      pattern: /Object\.assign\s*\(\s*\w+\s*,\s*req\.body|\.create\s*\(\s*req\.body\s*\)|\.update\s*\(\s*req\.body\s*\)|\{\s*\.\.\.req\.body\s*\}/gi,
      severity: 'high',
      cwe: 'CWE-915',
      owasp: 'A04:2021',
      description: 'Mass assignment vulnerability - all request body fields accepted.',
      recommendation: 'Explicitly whitelist allowed fields.',
      example: {
        vulnerable: 'User.create(req.body)',
        secure: 'User.create({ name: req.body.name, email: req.body.email })'
      }
    },
    {
      pattern: /\.fillable\s*=\s*\[\]|protected\s+\$guarded\s*=\s*\[\]/gi,
      severity: 'high',
      cwe: 'CWE-915',
      owasp: 'A04:2021',
      description: 'Laravel mass assignment protection disabled.',
      recommendation: 'Define $fillable array with allowed fields.'
    }
  ],

  race_condition: [
    {
      pattern: /if\s*\(.*balance.*\)\s*\{[^}]*balance\s*[-+]=|check.*then.*update/gi,
      severity: 'medium',
      cwe: 'CWE-362',
      owasp: 'A04:2021',
      description: 'Potential race condition: check-then-act pattern.',
      recommendation: 'Use atomic operations or database transactions with proper locking.'
    }
  ],

  // ===========================================
  // A09:2021 - SECURITY LOGGING AND MONITORING FAILURES
  // ===========================================
  info_disclosure: [
    {
      pattern: /console\.log\s*\(.*(?:password|secret|token|key|credential|ssn|credit.?card)/gi,
      severity: 'high',
      cwe: 'CWE-532',
      owasp: 'A09:2021',
      description: 'Sensitive data logged to console.',
      recommendation: 'Remove sensitive data from logs or mask/redact values.'
    },
    {
      pattern: /logger\.\w+\s*\(.*(?:password|token|secret|api.?key)/gi,
      severity: 'high',
      cwe: 'CWE-532',
      owasp: 'A09:2021',
      description: 'Sensitive data in application logs.',
      recommendation: 'Implement log sanitization for sensitive fields.'
    },
    {
      pattern: /stackTrace|printStackTrace|console\.trace/gi,
      severity: 'medium',
      cwe: 'CWE-209',
      owasp: 'A09:2021',
      description: 'Stack trace exposure can reveal system information.',
      recommendation: 'Log stack traces server-side only, send generic errors to client.'
    },
    {
      pattern: /res\.send\s*\(\s*err|res\.json\s*\(\s*\{\s*error\s*:\s*err|catch.*res\.\w+\s*\(\s*e/gi,
      severity: 'medium',
      cwe: 'CWE-209',
      owasp: 'A09:2021',
      description: 'Error details sent to client.',
      recommendation: 'Send generic error messages, log details server-side.'
    }
  ],

  // ===========================================
  // A05:2021 - SECURITY MISCONFIGURATION
  // ===========================================
  insecure_config: [
    {
      pattern: /Access-Control-Allow-Origin\s*[=:]\s*["']\*["']|cors\s*\(\s*\)/gi,
      severity: 'medium',
      cwe: 'CWE-942',
      owasp: 'A05:2021',
      description: 'Overly permissive CORS configuration.',
      recommendation: 'Specify exact allowed origins instead of wildcard.'
    },
    {
      pattern: /secure\s*:\s*false|httpOnly\s*:\s*false|sameSite\s*:\s*false/gi,
      severity: 'high',
      cwe: 'CWE-614',
      owasp: 'A05:2021',
      description: 'Insecure cookie configuration.',
      recommendation: 'Set secure: true, httpOnly: true, sameSite: "strict" for session cookies.'
    },
    {
      pattern: /DEBUG\s*=\s*True|app\.debug\s*=\s*true|NODE_ENV.*development/gi,
      severity: 'medium',
      cwe: 'CWE-489',
      owasp: 'A05:2021',
      description: 'Debug mode may be enabled in production.',
      recommendation: 'Ensure debug mode is disabled in production environment.'
    },
    {
      pattern: /X-Frame-Options|frame-ancestors|Content-Security-Policy/gi,
      severity: 'info',
      cwe: 'CWE-1021',
      owasp: 'A05:2021',
      description: 'Security header configuration detected - verify proper values.',
      recommendation: 'Ensure X-Frame-Options: DENY and proper CSP is configured.'
    },
    {
      pattern: /ssl\s*:\s*\{\s*rejectUnauthorized\s*:\s*false|verify\s*=\s*False|VERIFY_PEER\s*=>\s*false/gi,
      severity: 'critical',
      cwe: 'CWE-295',
      owasp: 'A05:2021',
      description: 'SSL/TLS certificate verification disabled.',
      recommendation: 'Never disable certificate verification in production.'
    },
    {
      pattern: /AllowAllHostnameVerifier|ALLOW_ALL_HOSTNAME_VERIFIER|InsecureTrustManagerFactory/gi,
      severity: 'critical',
      cwe: 'CWE-295',
      owasp: 'A05:2021',
      description: 'Java hostname verification disabled.',
      recommendation: 'Use proper certificate and hostname verification.'
    }
  ],

  // ===========================================
  // A06:2021 - VULNERABLE AND OUTDATED COMPONENTS
  // ===========================================
  vulnerable_dependencies: [
    {
      pattern: /require\s*\(\s*["']jquery["']\)|jquery.*1\.[0-9]|jquery.*2\.[0-2]/gi,
      severity: 'medium',
      cwe: 'CWE-1104',
      owasp: 'A06:2021',
      description: 'Potentially outdated jQuery version.',
      recommendation: 'Update to latest jQuery version, check for known CVEs.'
    },
    {
      pattern: /lodash.*[34]\.[0-9]|"lodash"\s*:\s*"[^"]*[34]\./gi,
      severity: 'medium',
      cwe: 'CWE-1104',
      owasp: 'A06:2021',
      description: 'Potentially vulnerable lodash version.',
      recommendation: 'Update lodash to 4.17.21+ to fix prototype pollution.'
    }
  ],

  // ===========================================
  // A10:2021 - SERVER-SIDE REQUEST FORGERY (SSRF)
  // ===========================================
  ssrf: [
    {
      pattern: /axios\s*\.\s*get\s*\(\s*req\.|fetch\s*\(\s*req\.|request\s*\(\s*\{\s*url\s*:\s*req\./gi,
      severity: 'high',
      cwe: 'CWE-918',
      owasp: 'A10:2021',
      description: 'SSRF: HTTP request with user-controlled URL.',
      recommendation: 'Validate URLs against allowlist, block internal IP ranges.',
      example: {
        vulnerable: 'axios.get(req.body.url)',
        secure: 'const validatedUrl = validateUrl(req.body.url, allowedHosts);\naxios.get(validatedUrl)'
      }
    },
    {
      pattern: /urllib\.request\.urlopen\s*\(|requests\.\w+\s*\(\s*\w+/gi,
      severity: 'medium',
      cwe: 'CWE-918',
      owasp: 'A10:2021',
      description: 'Python HTTP request - verify URL source.',
      recommendation: 'Validate and sanitize URLs before requests.'
    },
    {
      pattern: /ImageIO\.read\s*\(\s*new\s+URL|URL\s*\(\s*\w+\s*\)\.openStream/gi,
      severity: 'high',
      cwe: 'CWE-918',
      owasp: 'A10:2021',
      description: 'Java URL fetch - potential SSRF.',
      recommendation: 'Validate URLs and block internal resources.'
    }
  ],

  // ===========================================
  // ADDITIONAL SECURITY PATTERNS
  // ===========================================
  xxe: [
    {
      pattern: /DocumentBuilderFactory|SAXParserFactory|XMLReader|TransformerFactory/gi,
      severity: 'high',
      cwe: 'CWE-611',
      owasp: 'A05:2021',
      description: 'XML parser detected - verify XXE protection.',
      recommendation: 'Disable DTDs and external entities in XML parser configuration.'
    },
    {
      pattern: /libxml_disable_entity_loader\s*\(\s*false|LIBXML_NOENT/gi,
      severity: 'critical',
      cwe: 'CWE-611',
      owasp: 'A05:2021',
      description: 'PHP XML external entity processing enabled.',
      recommendation: 'Set libxml_disable_entity_loader(true) before parsing.'
    },
    {
      pattern: /etree\.parse|lxml\.etree|xml\.etree/gi,
      severity: 'medium',
      cwe: 'CWE-611',
      owasp: 'A05:2021',
      description: 'Python XML parsing - verify XXE protection.',
      recommendation: 'Use defusedxml library for safe XML parsing.'
    }
  ],

  open_redirect: [
    {
      pattern: /res\.redirect\s*\(\s*req\.(query|params|body)|location\.href\s*=\s*(?:decodeURI|unescape)/gi,
      severity: 'medium',
      cwe: 'CWE-601',
      owasp: 'A01:2021',
      description: 'Open redirect: User-controlled redirect destination.',
      recommendation: 'Validate redirect URLs against allowlist of trusted domains.',
      example: {
        vulnerable: 'res.redirect(req.query.next)',
        secure: 'const safeUrl = validateRedirectUrl(req.query.next, allowedHosts);\nres.redirect(safeUrl)'
      }
    },
    {
      pattern: /header\s*\(\s*["']Location\s*:\s*["']\s*\.\s*\$/gi,
      severity: 'medium',
      cwe: 'CWE-601',
      owasp: 'A01:2021',
      description: 'PHP open redirect vulnerability.',
      recommendation: 'Validate redirect target against allowlist.'
    }
  ],

  prototype_pollution: [
    {
      pattern: /\[["']__proto__["']\]|\["constructor"\]\["prototype"\]|Object\.assign\s*\(\s*\{\}/gi,
      severity: 'high',
      cwe: 'CWE-1321',
      owasp: 'A08:2021',
      description: 'Prototype pollution vulnerability.',
      recommendation: 'Use Object.create(null) for maps, validate object keys.'
    },
    {
      pattern: /merge\s*\(.*req\.body|deepMerge|extend\s*\(\s*true/gi,
      severity: 'medium',
      cwe: 'CWE-1321',
      owasp: 'A08:2021',
      description: 'Deep merge operation with user input - prototype pollution risk.',
      recommendation: 'Sanitize keys, block __proto__ and constructor.prototype.'
    }
  ],

  template_injection: [
    {
      pattern: /\{\{.*\$|render.*\+.*req|template\.render\s*\(.*req/gi,
      severity: 'high',
      cwe: 'CWE-94',
      owasp: 'A03:2021',
      description: 'Server-Side Template Injection (SSTI) risk.',
      recommendation: 'Never pass user input directly to template engine.'
    },
    {
      pattern: /Jinja2|render_template_string|Template\s*\(\s*req/gi,
      severity: 'high',
      cwe: 'CWE-94',
      owasp: 'A03:2021',
      description: 'Python template injection risk.',
      recommendation: 'Use render_template() with separate template files.'
    }
  ],

  regex_dos: [
    {
      pattern: /\(\.\*\)\+|\(\.\+\)\*|\([^)]+\)\{[0-9]+,\}/gi,
      severity: 'medium',
      cwe: 'CWE-1333',
      owasp: 'A05:2021',
      description: 'ReDoS: Potentially vulnerable regex pattern.',
      recommendation: 'Review regex for catastrophic backtracking, use atomic groups.'
    },
    {
      pattern: /new\s+RegExp\s*\(\s*req\.|RegExp\s*\(\s*\$|\.match\s*\(\s*req\./gi,
      severity: 'high',
      cwe: 'CWE-1333',
      owasp: 'A05:2021',
      description: 'User-controlled regex - ReDoS risk.',
      recommendation: 'Never use user input in regex patterns, or sanitize thoroughly.'
    }
  ],

  file_upload: [
    {
      pattern: /multer|formidable|busboy|express-fileupload/gi,
      severity: 'info',
      cwe: 'CWE-434',
      owasp: 'A04:2021',
      description: 'File upload functionality detected.',
      recommendation: 'Validate file type (magic bytes, not just extension), limit size, store outside webroot.'
    },
    {
      pattern: /\.(exe|php|jsp|asp|sh|bat|cmd|ps1|dll)/gi,
      severity: 'high',
      cwe: 'CWE-434',
      owasp: 'A04:2021',
      description: 'Dangerous file extension in code.',
      recommendation: 'Block executable extensions in file upload validation.'
    }
  ]
};

/**
 * Language-specific security patterns
 * Based on OWASP Cheat Sheet Series for specific frameworks
 */
const LANGUAGE_PATTERNS = {
  javascript: [
    {
      pattern: /require\s*\(\s*[^"'`][^)]*\)|require\s*\(\s*\w+\s*\)/gi,
      type: 'dynamic_require',
      severity: 'high',
      cwe: 'CWE-94',
      description: 'Dynamic require() with variable - potential code injection.',
      recommendation: 'Use static require paths or validate against allowlist.'
    },
    {
      pattern: /\$\(.*\)\.on\s*\(\s*["']click["']/gi,
      type: 'dom_event',
      severity: 'info',
      cwe: 'CWE-79',
      description: 'jQuery event handler - ensure no XSS in dynamic handlers.',
      recommendation: 'Validate any dynamic content in event handlers.'
    },
    {
      pattern: /\.call\s*\(\s*this|\.apply\s*\(\s*this|Reflect\.apply/gi,
      type: 'function_manipulation',
      severity: 'medium',
      cwe: 'CWE-94',
      description: 'Dynamic function invocation detected.',
      recommendation: 'Validate function references before dynamic invocation.'
    },
    {
      pattern: /vm\.runInContext|vm\.runInNewContext|vm\.createContext/gi,
      type: 'sandbox_escape',
      severity: 'critical',
      cwe: 'CWE-94',
      description: 'Node.js VM module - potential sandbox escape.',
      recommendation: 'VM module is not a security mechanism. Use isolated processes.'
    },
    {
      pattern: /Buffer\.allocUnsafe|new\s+Buffer\s*\(/gi,
      type: 'buffer_issue',
      severity: 'medium',
      cwe: 'CWE-665',
      description: 'Uninitialized buffer may contain sensitive data.',
      recommendation: 'Use Buffer.alloc() for secure initialization.'
    }
  ],
  
  typescript: [
    {
      pattern: /as\s+any|<any>|:\s*any\b/gi,
      type: 'type_safety',
      severity: 'low',
      cwe: 'CWE-704',
      description: 'Use of "any" type bypasses TypeScript safety.',
      recommendation: 'Use proper types or unknown with type guards.'
    },
    {
      pattern: /@ts-ignore|@ts-nocheck/gi,
      type: 'type_safety',
      severity: 'medium',
      cwe: 'CWE-704',
      description: 'TypeScript type checking disabled.',
      recommendation: 'Fix type errors instead of suppressing them.'
    }
  ],

  php: [
    {
      pattern: /include\s*\(\s*\$|require\s*\(\s*\$|include_once\s*\(\s*\$|require_once\s*\(\s*\$/gi,
      type: 'lfi',
      severity: 'critical',
      cwe: 'CWE-98',
      description: 'Local File Inclusion (LFI) vulnerability.',
      recommendation: 'Never use user input in include/require. Use allowlist with basename().'
    },
    {
      pattern: /\$_(?:GET|POST|REQUEST|COOKIE)\s*\[[^\]]+\]/gi,
      type: 'superglobal_access',
      severity: 'medium',
      cwe: 'CWE-20',
      description: 'Direct superglobal access without validation.',
      recommendation: 'Use filter_input() or validated request objects.'
    },
    {
      pattern: /extract\s*\(\s*\$_(GET|POST|REQUEST)/gi,
      type: 'variable_injection',
      severity: 'critical',
      cwe: 'CWE-621',
      description: 'PHP extract() on user input - variable injection.',
      recommendation: 'Never use extract() on untrusted data.'
    },
    {
      pattern: /assert\s*\(\s*\$|create_function\s*\(/gi,
      type: 'code_injection',
      severity: 'critical',
      cwe: 'CWE-94',
      description: 'PHP code execution function.',
      recommendation: 'Avoid assert() with strings and create_function().'
    },
    {
      pattern: /preg_replace\s*\(\s*["']\/[^\/]*\/e["']/gi,
      type: 'preg_code_execution',
      severity: 'critical',
      cwe: 'CWE-94',
      description: 'preg_replace with /e modifier - code execution.',
      recommendation: 'Use preg_replace_callback() instead.'
    },
    {
      pattern: /mysql_query|mysql_connect|mysql_real_escape_string/gi,
      type: 'deprecated_mysql',
      severity: 'high',
      cwe: 'CWE-477',
      description: 'Deprecated mysql_* functions.',
      recommendation: 'Use PDO or MySQLi with prepared statements.'
    }
  ],

  java: [
    {
      pattern: /Runtime\.getRuntime\s*\(\s*\)\.exec/gi,
      type: 'command_injection',
      severity: 'critical',
      cwe: 'CWE-78',
      description: 'Java Runtime.exec() command execution.',
      recommendation: 'Use ProcessBuilder with argument list, validate all inputs.'
    },
    {
      pattern: /new\s+FileInputStream\s*\(\s*\w+|new\s+FileReader\s*\(\s*\w+/gi,
      type: 'path_traversal',
      severity: 'high',
      cwe: 'CWE-22',
      description: 'File access with potential path traversal.',
      recommendation: 'Canonicalize path and verify within allowed directory.'
    },
    {
      pattern: /Statement\s+\w+\s*=.*createStatement|executeQuery\s*\(\s*["'].*\+/gi,
      type: 'sql_injection',
      severity: 'critical',
      cwe: 'CWE-89',
      description: 'Java Statement instead of PreparedStatement.',
      recommendation: 'Use PreparedStatement with parameter binding.'
    },
    {
      pattern: /ObjectInputStream|readObject\s*\(/gi,
      type: 'deserialization',
      severity: 'critical',
      cwe: 'CWE-502',
      description: 'Java deserialization vulnerability.',
      recommendation: 'Implement ObjectInputFilter, avoid deserializing untrusted data.'
    },
    {
      pattern: /Cipher\.getInstance\s*\(\s*["']AES["']\s*\)|Cipher\.getInstance\s*\(\s*["']DES/gi,
      type: 'weak_crypto',
      severity: 'high',
      cwe: 'CWE-327',
      description: 'Cipher with default (ECB) mode.',
      recommendation: 'Use AES/GCM/NoPadding or AES/CBC/PKCS5Padding with random IV.'
    },
    {
      pattern: /TrustManager|X509TrustManager.*return|checkClientTrusted.*\{\s*\}/gi,
      type: 'ssl_bypass',
      severity: 'critical',
      cwe: 'CWE-295',
      description: 'Custom TrustManager may bypass SSL validation.',
      recommendation: 'Use default TrustManager, never ignore certificate errors.'
    },
    {
      pattern: /\.setEntity\s*\(\s*new\s+StringEntity\s*\(\s*\w+|HttpPost.*setHeader.*Content-Type/gi,
      type: 'http_request',
      severity: 'medium',
      cwe: 'CWE-918',
      description: 'HTTP client request - verify URL source.',
      recommendation: 'Validate URLs against allowlist for SSRF prevention.'
    }
  ],

  python: [
    {
      pattern: /__import__\s*\(\s*\w+|importlib\.import_module\s*\(\s*\w+/gi,
      type: 'dynamic_import',
      severity: 'high',
      cwe: 'CWE-94',
      description: 'Dynamic import with variable - code injection risk.',
      recommendation: 'Use static imports or validate against allowlist.'
    },
    {
      pattern: /getattr\s*\(\s*\w+\s*,\s*\w+|setattr\s*\(\s*\w+\s*,\s*\w+/gi,
      type: 'attribute_injection',
      severity: 'medium',
      cwe: 'CWE-915',
      description: 'Dynamic attribute access with variable.',
      recommendation: 'Validate attribute names against allowlist.'
    },
    {
      pattern: /compile\s*\(\s*\w+|exec\s*\(\s*\w+/gi,
      type: 'code_execution',
      severity: 'critical',
      cwe: 'CWE-94',
      description: 'Python code execution with variable.',
      recommendation: 'Avoid exec/compile with user input.'
    },
    {
      pattern: /input\s*\(\s*\)|raw_input\s*\(\s*\)/gi,
      type: 'input_validation',
      severity: 'low',
      cwe: 'CWE-20',
      description: 'User input without validation.',
      recommendation: 'Validate and sanitize all user input.'
    },
    {
      pattern: /flask\.request\.(args|form|data|json)\s*\.get|request\.(GET|POST)\s*\[/gi,
      type: 'request_data',
      severity: 'medium',
      cwe: 'CWE-20',
      description: 'Web framework request data access.',
      recommendation: 'Validate all request parameters before use.'
    },
    {
      pattern: /render_template_string\s*\(|Template\s*\(\s*\w+\s*\)\.render/gi,
      type: 'ssti',
      severity: 'critical',
      cwe: 'CWE-94',
      description: 'Server-Side Template Injection (SSTI).',
      recommendation: 'Use render_template() with file-based templates.'
    },
    {
      pattern: /shell\s*=\s*True|subprocess\.call\s*\(\s*["']|os\.popen/gi,
      type: 'command_injection',
      severity: 'critical',
      cwe: 'CWE-78',
      description: 'Python shell command execution.',
      recommendation: 'Use subprocess.run() with shell=False and argument list.'
    },
    {
      pattern: /hashlib\.md5\s*\(|hashlib\.sha1\s*\(/gi,
      type: 'weak_hash',
      severity: 'medium',
      cwe: 'CWE-328',
      description: 'Weak hash algorithm (MD5/SHA1).',
      recommendation: 'Use hashlib.sha256() or bcrypt for passwords.'
    }
  ],

  go: [
    {
      pattern: /exec\.Command\s*\(|exec\.CommandContext\s*\(/gi,
      type: 'command_execution',
      severity: 'high',
      cwe: 'CWE-78',
      description: 'Go command execution.',
      recommendation: 'Validate all command arguments, avoid shell expansion.'
    },
    {
      pattern: /fmt\.Sprintf\s*\(\s*\w+|fmt\.Fprintf\s*\(\s*\w+\s*,\s*\w+/gi,
      type: 'format_string',
      severity: 'medium',
      cwe: 'CWE-134',
      description: 'Go format string with variable.',
      recommendation: 'Use static format strings, validate user input.'
    },
    {
      pattern: /ioutil\.ReadAll|io\.ReadAll/gi,
      type: 'dos_risk',
      severity: 'medium',
      cwe: 'CWE-400',
      description: 'Unbounded read may cause DoS.',
      recommendation: 'Use io.LimitReader to bound reads.'
    },
    {
      pattern: /InsecureSkipVerify\s*:\s*true/gi,
      type: 'ssl_bypass',
      severity: 'critical',
      cwe: 'CWE-295',
      description: 'TLS certificate verification disabled.',
      recommendation: 'Never disable TLS verification in production.'
    },
    {
      pattern: /html\/template|text\/template.*Execute/gi,
      type: 'template',
      severity: 'medium',
      cwe: 'CWE-79',
      description: 'Go template execution.',
      recommendation: 'Use html/template (not text/template) for HTML output.'
    },
    {
      pattern: /sql\.Query\s*\(\s*["'].*\+|fmt\.Sprintf.*SELECT|fmt\.Sprintf.*INSERT/gi,
      type: 'sql_injection',
      severity: 'critical',
      cwe: 'CWE-89',
      description: 'Go SQL query with string formatting.',
      recommendation: 'Use parameterized queries: db.Query("SELECT * FROM users WHERE id = ?", id)'
    }
  ],

  ruby: [
    {
      pattern: /eval\s*\(\s*\w+|instance_eval|class_eval|module_eval/gi,
      type: 'code_execution',
      severity: 'critical',
      cwe: 'CWE-94',
      description: 'Ruby eval with potential user input.',
      recommendation: 'Avoid eval, use safe alternatives.'
    },
    {
      pattern: /send\s*\(\s*params|public_send\s*\(\s*params/gi,
      type: 'method_injection',
      severity: 'high',
      cwe: 'CWE-94',
      description: 'Ruby send with user-controlled method name.',
      recommendation: 'Validate method name against allowlist.'
    },
    {
      pattern: /\.where\s*\(\s*["'].*#\{|\.find_by_sql\s*\(\s*["'].*#\{/gi,
      type: 'sql_injection',
      severity: 'critical',
      cwe: 'CWE-89',
      description: 'Rails SQL injection via string interpolation.',
      recommendation: 'Use parameterized queries: User.where("name = ?", name)'
    },
    {
      pattern: /render\s+inline\s*:|render\s*\(\s*inline\s*:/gi,
      type: 'ssti',
      severity: 'high',
      cwe: 'CWE-94',
      description: 'Rails render inline - potential SSTI.',
      recommendation: 'Use render with file-based templates.'
    },
    {
      pattern: /\.html_safe|raw\s*\(/gi,
      type: 'xss',
      severity: 'high',
      cwe: 'CWE-79',
      description: 'Rails XSS bypass with html_safe/raw.',
      recommendation: 'Only use html_safe on trusted, sanitized content.'
    },
    {
      pattern: /attr_accessible\s*$|protect_from_forgery.*except/gi,
      type: 'security_bypass',
      severity: 'high',
      cwe: 'CWE-352',
      description: 'Rails security mechanism disabled.',
      recommendation: 'Use strong_parameters, dont disable CSRF protection.'
    },
    {
      pattern: /system\s*\(\s*["'].*#\{|`.*#\{|\%x\{.*#\{/gi,
      type: 'command_injection',
      severity: 'critical',
      cwe: 'CWE-78',
      description: 'Ruby command execution with interpolation.',
      recommendation: 'Use array form: system("command", arg1, arg2)'
    }
  ],

  csharp: [
    {
      pattern: /Process\.Start|ProcessStartInfo/gi,
      type: 'command_execution',
      severity: 'high',
      cwe: 'CWE-78',
      description: 'C# process execution.',
      recommendation: 'Validate all arguments, avoid UseShellExecute=true with user input.'
    },
    {
      pattern: /SqlCommand\s*\(\s*["'].*\+|\.CommandText\s*=.*\+/gi,
      type: 'sql_injection',
      severity: 'critical',
      cwe: 'CWE-89',
      description: 'C# SQL command with concatenation.',
      recommendation: 'Use SqlParameter for parameterized queries.'
    },
    {
      pattern: /BinaryFormatter|SoapFormatter|NetDataContractSerializer|ObjectStateFormatter/gi,
      type: 'deserialization',
      severity: 'critical',
      cwe: 'CWE-502',
      description: 'Insecure .NET deserialization.',
      recommendation: 'Use JSON serialization with known types.'
    },
    {
      pattern: /Assembly\.Load|Activator\.CreateInstance/gi,
      type: 'dynamic_loading',
      severity: 'high',
      cwe: 'CWE-94',
      description: 'Dynamic assembly/type loading.',
      recommendation: 'Validate assembly/type names against allowlist.'
    },
    {
      pattern: /\[ValidateInput\s*\(\s*false\s*\)\]|Request\.Unvalidated/gi,
      type: 'xss_bypass',
      severity: 'high',
      cwe: 'CWE-79',
      description: 'ASP.NET request validation disabled.',
      recommendation: 'Keep validation enabled, encode output properly.'
    }
  ],

  sql: [
    {
      pattern: /EXECUTE\s*\(\s*@|EXEC\s*\(\s*@|sp_executesql\s*.*\+/gi,
      type: 'dynamic_sql',
      severity: 'high',
      cwe: 'CWE-89',
      description: 'Dynamic SQL execution.',
      recommendation: 'Use parameterized sp_executesql with parameter binding.'
    },
    {
      pattern: /GRANT\s+ALL|WITH\s+GRANT\s+OPTION/gi,
      type: 'excessive_privileges',
      severity: 'high',
      cwe: 'CWE-250',
      description: 'Excessive database privileges.',
      recommendation: 'Grant minimum required privileges.'
    },
    {
      pattern: /--\s*password|--\s*secret|--\s*key/gi,
      type: 'comment_secrets',
      severity: 'medium',
      cwe: 'CWE-615',
      description: 'Sensitive data in SQL comments.',
      recommendation: 'Remove secrets from comments.'
    }
  ]
};

/**
 * Analyze code for vulnerabilities using OWASP-based patterns
 */
const analyzeCode = (code, language) => {
  const vulnerabilities = [];

  // Apply general security patterns
  for (const [category, patterns] of Object.entries(SECURITY_PATTERNS)) {
    for (const rule of patterns) {
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      let match;
      
      while ((match = regex.exec(code)) !== null) {
        const beforeMatch = code.substring(0, match.index);
        const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;
        
        // Get code context (line where vulnerability found)
        const lines = code.split('\n');
        const contextLine = lines[lineNumber - 1] || '';
        
        vulnerabilities.push({
          type: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          severity: rule.severity,
          line: lineNumber,
          cwe: rule.cwe || null,
          owasp: rule.owasp || null,
          description: rule.description,
          recommendation: rule.recommendation,
          matchedCode: match[0].substring(0, 80),
          codeContext: contextLine.trim().substring(0, 100),
          example: rule.example || null
        });
      }
    }
  }

  // Apply language-specific patterns
  const langPatterns = LANGUAGE_PATTERNS[language] || [];
  for (const rule of langPatterns) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match;
    
    while ((match = regex.exec(code)) !== null) {
      const beforeMatch = code.substring(0, match.index);
      const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;
      
      const lines = code.split('\n');
      const contextLine = lines[lineNumber - 1] || '';
      
      vulnerabilities.push({
        type: rule.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        severity: rule.severity,
        line: lineNumber,
        cwe: rule.cwe || null,
        owasp: null,
        description: rule.description,
        recommendation: rule.recommendation,
        matchedCode: match[0].substring(0, 80),
        codeContext: contextLine.trim().substring(0, 100),
        example: rule.example || null
      });
    }
  }

  // Deduplicate by type and line
  const seen = new Set();
  return vulnerabilities.filter(v => {
    const key = v.type + '-' + v.line;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return (order[a.severity] || 5) - (order[b.severity] || 5);
  });
};

/**
 * Calculate overall risk based on CVSS-like scoring
 */
const calculateOverallRisk = (vulns) => {
  if (vulns.length === 0) return 'secure';
  
  // Weight vulnerabilities
  const weights = { critical: 10, high: 7, medium: 4, low: 1, info: 0 };
  let totalScore = 0;
  let maxSeverity = 'info';
  
  for (const v of vulns) {
    totalScore += weights[v.severity] || 0;
    if ((weights[v.severity] || 0) > (weights[maxSeverity] || 0)) {
      maxSeverity = v.severity;
    }
  }
  
  // Determine overall risk
  if (vulns.some(v => v.severity === 'critical') || totalScore >= 20) return 'critical';
  if (vulns.some(v => v.severity === 'high') || totalScore >= 14) return 'high';
  if (vulns.some(v => v.severity === 'medium') || totalScore >= 8) return 'medium';
  return 'low';
};

/**
 * Generate comprehensive summary with OWASP Top 10 mapping
 */
const generateSummary = (vulns) => {
  if (vulns.length === 0) {
    return 'No security vulnerabilities detected. Code appears to follow secure coding practices.';
  }
  
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  const owaspCategories = new Set();
  const cweIds = new Set();
  
  vulns.forEach(v => {
    counts[v.severity]++;
    if (v.owasp) owaspCategories.add(v.owasp);
    if (v.cwe) cweIds.add(v.cwe);
  });
  
  const parts = [];
  if (counts.critical) parts.push(`${counts.critical} critical`);
  if (counts.high) parts.push(`${counts.high} high`);
  if (counts.medium) parts.push(`${counts.medium} medium`);
  if (counts.low) parts.push(`${counts.low} low`);
  if (counts.info) parts.push(`${counts.info} info`);
  
  let summary = `Found ${vulns.length} security issue(s): ${parts.join(', ')}.`;
  
  if (owaspCategories.size > 0) {
    summary += ` OWASP Top 10 categories affected: ${Array.from(owaspCategories).join(', ')}.`;
  }
  
  if (counts.critical > 0 || counts.high > 0) {
    summary += ' URGENT: Address critical and high severity issues before deployment.';
  }
  
  return summary;
};

/**
 * Generate OWASP compliance report
 */
const generateOwaspReport = (vulns) => {
  const owaspMapping = {
    'A01:2021': { name: 'Broken Access Control', issues: [] },
    'A02:2021': { name: 'Cryptographic Failures', issues: [] },
    'A03:2021': { name: 'Injection', issues: [] },
    'A04:2021': { name: 'Insecure Design', issues: [] },
    'A05:2021': { name: 'Security Misconfiguration', issues: [] },
    'A06:2021': { name: 'Vulnerable Components', issues: [] },
    'A07:2021': { name: 'Auth Failures', issues: [] },
    'A08:2021': { name: 'Data Integrity Failures', issues: [] },
    'A09:2021': { name: 'Logging Failures', issues: [] },
    'A10:2021': { name: 'SSRF', issues: [] }
  };
  
  for (const v of vulns) {
    if (v.owasp && owaspMapping[v.owasp]) {
      owaspMapping[v.owasp].issues.push({
        type: v.type,
        severity: v.severity,
        line: v.line,
        cwe: v.cwe
      });
    }
  }
  
  return Object.entries(owaspMapping)
    .filter(([_, data]) => data.issues.length > 0)
    .map(([code, data]) => ({
      code,
      name: data.name,
      issueCount: data.issues.length,
      issues: data.issues
    }));
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
    const owaspReport = generateOwaspReport(vulnerabilities);
    
    review.status = 'completed';
    review.vulnerabilities = vulnerabilities;
    review.overallRisk = calculateOverallRisk(vulnerabilities);
    review.summary = generateSummary(vulnerabilities);
    review.owaspCompliance = owaspReport;
    review.processingTime = Date.now() - startTime;
    review.analysisMetadata = {
      patternsChecked: Object.keys(SECURITY_PATTERNS).length,
      languagePatternsChecked: (LANGUAGE_PATTERNS[language] || []).length,
      linesAnalyzed: codeSnippet.split('\n').length,
      analysisVersion: '2.0-owasp'
    };
    
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

module.exports = { 
  reviewCode, 
  getReviewHistory, 
  getReviewById, 
  deleteReview, 
  getReviewStats, 
  analyzeCode,
  generateOwaspReport,
  SECURITY_PATTERNS,
  LANGUAGE_PATTERNS
};
