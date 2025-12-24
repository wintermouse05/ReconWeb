const { spawn, execSync } = require('child_process');
const path = require('path');
const os = require('os');
const resultParser = require('./resultParser');

const SUPPORTED_TOOLS = ['nikto', 'gobuster', 'nuclei', 'sqlmap', 'xsstrike', 'wpscan'];

// Extended PATH để tìm tools trong các thư mục phổ biến
const EXTENDED_PATH = [
  process.env.PATH,
  path.join(os.homedir(), 'go', 'bin'),  // Go binaries (nuclei)
  '/usr/local/bin',
  '/usr/bin',
].filter(Boolean).join(':');

const sanitizeString = (value, { maxLength = 300, allowEmpty = false, name } = {}) => {
  if (value === undefined || value === null) {
    throw new Error(`Option '${name}' requires a value`);
  }

  const str = String(value);

  if (!allowEmpty && str.trim().length === 0) {
    throw new Error(`Option '${name}' cannot be empty`);
  }

  if (str.length > maxLength) {
    throw new Error(`Option '${name}' exceeds ${maxLength} characters`);
  }

  if (/[\0\r\n]/.test(str)) {
    throw new Error(`Option '${name}' contains invalid control characters`);
  }

  return str;
};

const sanitizeNumber = (value, { min, max, integer = false, name } = {}) => {
  const num = Number(value);

  if (Number.isNaN(num)) {
    throw new Error(`Option '${name}' must be a valid number`);
  }

  if (integer && !Number.isInteger(num)) {
    throw new Error(`Option '${name}' must be an integer`);
  }

  if (min !== undefined && num < min) {
    throw new Error(`Option '${name}' must be at least ${min}`);
  }

  if (max !== undefined && num > max) {
    throw new Error(`Option '${name}' must be at most ${max}`);
  }

  return num;
};

const sanitizeBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return ['true', '1', 'yes'].includes(value.toLowerCase());
  }

  return Boolean(value);
};

const sanitizeList = (value, definition) => {
  const list = Array.isArray(value)
    ? value
    : String(value)
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);

  if (definition.maxItems && list.length > definition.maxItems) {
    throw new Error(`Option '${definition.name}' accepts at most ${definition.maxItems} values`);
  }

  return list.map((entry) =>
    sanitizeString(entry, {
      name: definition.name,
      maxLength: definition.maxLength || 200,
      allowEmpty: false,
    })
  );
};

const extractExtraArgs = (options, toolName) => {
  if (!options || options.extraArgs === undefined) {
    return [];
  }

  const raw = options.extraArgs;
  delete options.extraArgs;

  if (!Array.isArray(raw)) {
    throw new Error(`extraArgs for tool '${toolName}' must be an array of strings`);
  }

  if (raw.length > 10) {
    throw new Error(`extraArgs for tool '${toolName}' supports up to 10 entries`);
  }

  return raw.map((arg, index) =>
    sanitizeString(arg, {
      name: `extraArgs[${index}]`,
      maxLength: 200,
      allowEmpty: false,
    })
  );
};

const processOptions = (toolName, schema, options = {}) => {
  const args = [];
  const sanitizedOptions = {};

  Object.entries(options).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    const definition = schema[key];
    if (!definition) {
      throw new Error(`Unsupported option '${key}' for tool '${toolName}'`);
    }

    const { flag, type, ...rest } = definition;

    switch (type) {
      case 'boolean': {
        const boolValue = sanitizeBoolean(value);
        sanitizedOptions[key] = boolValue;
        if (boolValue) {
          args.push(flag);
        }
        break;
      }
      case 'number': {
        const numberValue = sanitizeNumber(value, { ...rest, name: key });
        sanitizedOptions[key] = numberValue;
        args.push(flag, String(numberValue));
        break;
      }
      case 'string': {
        const stringValue = sanitizeString(value, { ...rest, name: key, allowEmpty: rest.allowEmpty });
        sanitizedOptions[key] = stringValue;
        args.push(flag, stringValue);
        break;
      }
      case 'csv': {
        const list = sanitizeList(value, { ...rest, name: key });
        if (list.length > 0) {
          sanitizedOptions[key] = list.join(',');
          args.push(flag, list.join(','));
        }
        break;
      }
      case 'array': {
        const list = sanitizeList(value, { ...rest, name: key });
        if (list.length > 0) {
          sanitizedOptions[key] = list;
          list.forEach((entry) => {
            args.push(flag, entry);
          });
        }
        break;
      }
      default:
        throw new Error(`Unsupported option type '${type}' for '${key}'`);
    }
  });

  return { args, sanitizedOptions };
};

const sanitizeGobusterMode = (mode) => {
  const allowed = ['dir', 'dns', 'vhost', 'fuzz'];
  const normalized = sanitizeString(mode || 'dir', { name: 'mode', maxLength: 10 });

  if (!allowed.includes(normalized)) {
    throw new Error(`Unsupported Gobuster mode '${normalized}'. Allowed: ${allowed.join(', ')}`);
  }

  return normalized;
};

const sanitizePath = (value, name) =>
  sanitizeString(value, {
    name,
    maxLength: 400,
    allowEmpty: false,
  });

const niktoOptionSchema = {
  timeout: { flag: '-timeout', type: 'number', min: 1, max: 3600, integer: true },
  maxTime: { flag: '-maxtime', type: 'number', min: 1, max: 86400, integer: true },
  tuning: { flag: '-Tuning', type: 'string', maxLength: 40 },
  userAgent: { flag: '-useragent', type: 'string', maxLength: 200 },
  port: { flag: '-port', type: 'number', min: 1, max: 65535, integer: true },
  ssl: { flag: '-ssl', type: 'boolean' },
  hostHeader: { flag: '-vhost', type: 'string', maxLength: 200 },
  cookies: { flag: '-C', type: 'string', maxLength: 400 },
  plugins: { flag: '-Plugins', type: 'string', maxLength: 200 },
};

const gobusterOptionSchema = {
  extensions: { flag: '-x', type: 'csv', maxItems: 10, maxLength: 40 },
  statusCodes: { flag: '-s', type: 'csv', maxItems: 20, maxLength: 20 },
  threads: { flag: '-t', type: 'number', min: 1, max: 200, integer: true },
  delay: { flag: '--delay', type: 'number', min: 0, max: 10 },
  timeout: { flag: '-to', type: 'number', min: 1, max: 300, integer: true },
  userAgent: { flag: '-a', type: 'string', maxLength: 200 },
  proxy: { flag: '-p', type: 'string', maxLength: 200 },
  followRedirect: { flag: '-r', type: 'boolean' },
  includeLength: { flag: '-l', type: 'boolean' },
  noTlsValidation: { flag: '-k', type: 'boolean' },
};

const nucleiOptionSchema = {
  templates: { flag: '-t', type: 'array', maxItems: 10, maxLength: 200 },
  severity: { flag: '-severity', type: 'string', maxLength: 80 },
  tags: { flag: '-tags', type: 'csv', maxItems: 20, maxLength: 80 },
  excludeTags: { flag: '-etags', type: 'csv', maxItems: 20, maxLength: 80 },
  rateLimit: { flag: '-rate-limit', type: 'number', min: 1, max: 10000, integer: true },
  bulkSize: { flag: '-bulk-size', type: 'number', min: 1, max: 1000, integer: true },
  concurrency: { flag: '-c', type: 'number', min: 1, max: 500, integer: true },
  headless: { flag: '-headless', type: 'boolean' },
  proxy: { flag: '-proxy', type: 'string', maxLength: 200 },
  resolvers: { flag: '-r', type: 'string', maxLength: 200 },
};

const sqlmapOptionSchema = {
  batch: { flag: '--batch', type: 'boolean' },
  risk: { flag: '--risk', type: 'number', min: 0, max: 3, integer: true },
  level: { flag: '--level', type: 'number', min: 1, max: 5, integer: true },
  threads: { flag: '--threads', type: 'number', min: 1, max: 10, integer: true },
  tamper: { flag: '--tamper', type: 'string', maxLength: 200 },
  dbms: { flag: '--dbms', type: 'string', maxLength: 120 },
  os: { flag: '--os', type: 'string', maxLength: 120 },
  tech: { flag: '--tech', type: 'string', maxLength: 200 },
  timeout: { flag: '--timeout', type: 'number', min: 1, max: 600, integer: true },
  delay: { flag: '--delay', type: 'number', min: 0, max: 10 },
  tor: { flag: '--tor', type: 'boolean' },
  randomAgent: { flag: '--random-agent', type: 'boolean' },
};

const xsstrikeOptionSchema = {
  crawl: { flag: '--crawl', type: 'boolean' },
  blind: { flag: '--blind', type: 'boolean' },
  skip: { flag: '--skip', type: 'boolean' },
  fuzz: { flag: '--fuzzer', type: 'boolean' },
  delay: { flag: '--delay', type: 'number', min: 0, max: 10 },
  headers: { flag: '--headers', type: 'string', maxLength: 400 },
  threads: { flag: '--threads', type: 'number', min: 1, max: 20, integer: true },
};

const wpscanOptionSchema = {
  apiToken: { flag: '--api-token', type: 'string', maxLength: 100 },
  enumeratePlugins: { flag: '--enumerate', type: 'string', maxLength: 20 },
  enumerateThemes: { flag: '--enumerate', type: 'string', maxLength: 20 },
  enumerateUsers: { flag: '--enumerate', type: 'string', maxLength: 20 },
  randomUserAgent: { flag: '--random-user-agent', type: 'boolean' },
  disableTlsChecks: { flag: '--disable-tls-checks', type: 'boolean' },
  ignoreMainRedirect: { flag: '--ignore-main-redirect', type: 'boolean' },
  userAgent: { flag: '--user-agent', type: 'string', maxLength: 200 },
  proxy: { flag: '--proxy', type: 'string', maxLength: 200 },
  cookieString: { flag: '--cookie-string', type: 'string', maxLength: 500 },
  maxThreads: { flag: '--max-threads', type: 'number', min: 1, max: 50, integer: true },
  throttle: { flag: '--throttle', type: 'number', min: 0, max: 5000, integer: true },
  requestTimeout: { flag: '--request-timeout', type: 'number', min: 1, max: 600, integer: true },
  connectTimeout: { flag: '--connect-timeout', type: 'number', min: 1, max: 300, integer: true },
  stealthy: { flag: '--stealthy', type: 'boolean' },
};

const TOOL_DEFINITIONS = {
  nikto: {
    command: 'nikto',
    buildArgs: (targetUrl, rawOptions = {}) => {
      const options = { ...rawOptions };
      const extraArgs = extractExtraArgs(options, 'nikto');
      const { args: optionArgs, sanitizedOptions } = processOptions('nikto', niktoOptionSchema, options);
      const normalizedOptions = { ...sanitizedOptions };
      if (extraArgs.length) {
        normalizedOptions.extraArgs = extraArgs;
      }
      return {
        args: ['-h', targetUrl, ...optionArgs, ...extraArgs],
        normalizedOptions,
      };
    },
  },
  gobuster: {
    command: 'gobuster',
    buildArgs: (targetUrl, rawOptions = {}) => {
      const options = { ...rawOptions };
      const mode = sanitizeGobusterMode(options.mode);
      if (!options.wordlist) {
        throw new Error('Gobuster requires the "wordlist" option.');
      }
      const wordlist = sanitizePath(options.wordlist, 'wordlist');
      delete options.mode;
      delete options.wordlist;
      const extraArgs = extractExtraArgs(options, 'gobuster');
      const { args: optionArgs, sanitizedOptions } = processOptions('gobuster', gobusterOptionSchema, options);
      const normalizedOptions = { mode, wordlist, ...sanitizedOptions };
      if (extraArgs.length) {
        normalizedOptions.extraArgs = extraArgs;
      }
      return {
        args: [mode, '-u', targetUrl, '-w', wordlist, ...optionArgs, ...extraArgs],
        normalizedOptions,
      };
    },
  },
  nuclei: {
    command: 'nuclei',
    buildArgs: (targetUrl, rawOptions = {}) => {
      const options = { ...rawOptions };
      const extraArgs = extractExtraArgs(options, 'nuclei');
      const { args: optionArgs, sanitizedOptions } = processOptions('nuclei', nucleiOptionSchema, options);
      const normalizedOptions = { ...sanitizedOptions };
      if (extraArgs.length) {
        normalizedOptions.extraArgs = extraArgs;
      }
      return {
        args: ['-u', targetUrl, ...optionArgs, ...extraArgs],
        normalizedOptions,
      };
    },
  },
  sqlmap: {
    command: 'sqlmap',
    buildArgs: (targetUrl, rawOptions = {}) => {
      const options = { ...rawOptions };
      const extraArgs = extractExtraArgs(options, 'sqlmap');
      const { args: optionArgs, sanitizedOptions } = processOptions('sqlmap', sqlmapOptionSchema, options);
      const normalizedOptions = { ...sanitizedOptions };
      if (extraArgs.length) {
        normalizedOptions.extraArgs = extraArgs;
      }
      return {
        args: ['-u', targetUrl, ...optionArgs, ...extraArgs],
        normalizedOptions,
      };
    },
  },
  xsstrike: {
    command: 'xsstrike',
    buildArgs: (targetUrl, rawOptions = {}) => {
      const options = { ...rawOptions };
      const extraArgs = extractExtraArgs(options, 'xsstrike');
      const { args: optionArgs, sanitizedOptions } = processOptions('xsstrike', xsstrikeOptionSchema, options);
      const normalizedOptions = { ...sanitizedOptions };
      if (extraArgs.length) {
        normalizedOptions.extraArgs = extraArgs;
      }
      return {
        args: ['-u', targetUrl, ...optionArgs, ...extraArgs],
        normalizedOptions,
      };
    },
  },
  wpscan: {
    command: 'wpscan',
    buildArgs: (targetUrl, rawOptions = {}) => {
      const options = { ...rawOptions };
      const extraArgs = extractExtraArgs(options, 'wpscan');
      const { args: optionArgs, sanitizedOptions } = processOptions('wpscan', wpscanOptionSchema, options);
      const normalizedOptions = { ...sanitizedOptions };
      if (extraArgs.length) {
        normalizedOptions.extraArgs = extraArgs;
      }
      return {
        // --no-update: skip database update check (tránh timeout)
        // --no-banner: giảm output
        // --format cli-no-color: output dễ parse
        args: ['--url', targetUrl, '--no-update', '--no-banner', '--format', 'cli-no-color', ...optionArgs, ...extraArgs],
        normalizedOptions,
      };
    },
  },
};

// Default timeout: 5 minutes (300 seconds)
// Tool-specific timeouts (in milliseconds)
const TOOL_TIMEOUTS = {
  nikto: 10 * 60 * 1000,    // 10 minutes
  gobuster: 10 * 60 * 1000, // 10 minutes
  nuclei: 15 * 60 * 1000,   // 15 minutes
  sqlmap: 10 * 60 * 1000,   // 10 minutes
  xsstrike: 5 * 60 * 1000,  // 5 minutes
  wpscan: 2 * 60 * 1000,    // 2 minutes (WPScan thường chạy lâu, giảm timeout)
};

const DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const runCommand = (command, args = [], timeout = DEFAULT_TIMEOUT) =>
  new Promise((resolve) => {
    console.log(`[ScanService] Starting ${command} with args:`, args.join(' '));
    console.log(`[ScanService] Timeout set to ${timeout / 1000} seconds`);
    
    // Sử dụng EXTENDED_PATH để tìm command
    const child = spawn(command, args, { 
      shell: false,
      env: { ...process.env, PATH: EXTENDED_PATH }
    });
    let killed = false;

    let stdout = '';
    let stderr = '';

    // Set timeout để tự động kill process nếu chạy quá lâu
    const timeoutId = setTimeout(() => {
      killed = true;
      child.kill('SIGTERM');
      
      // Nếu SIGTERM không work, dùng SIGKILL sau 5 giây
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 5000);
    }, timeout);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timeoutId);
      console.log(`[ScanService] ${command} error:`, error.message);
      resolve({ status: 'failed', output: stdout, error: error.message });
    });

    child.on('close', (code) => {
      clearTimeout(timeoutId);
      
      if (killed) {
        console.log(`[ScanService] ${command} TIMEOUT after ${timeout / 1000}s`);
        resolve({
          status: 'timeout',
          output: stdout,
          error: `Process timed out after ${timeout / 1000} seconds. Partial output included.`,
        });
      } else if (code === 0) {
        console.log(`[ScanService] ${command} completed successfully`);
        // Nếu exit code = 0, không coi stderr là error (nhiều tool in info ra stderr)
        resolve({ status: 'completed', output: stdout, error: null });
      } else {
        console.log(`[ScanService] ${command} failed with code ${code}`);
        resolve({
          status: 'failed',
          output: stdout,
          error: stderr || `Process exited with code ${code}`,
        });
      }
    });
  });

const runTool = async (toolName, targetUrl, rawOptions = {}) => {
  if (!SUPPORTED_TOOLS.includes(toolName)) {
    throw new Error(`Unsupported tool '${toolName}'`);
  }

  const definition = TOOL_DEFINITIONS[toolName];
  const timeout = TOOL_TIMEOUTS[toolName] || DEFAULT_TIMEOUT;

  const { args, normalizedOptions } = definition.buildArgs(targetUrl, rawOptions);
  const executionResult = await runCommand(definition.command, args, timeout);

  return {
    ...executionResult,
    options: normalizedOptions,
    args,
  };
};

const runScanBatch = async (targetUrl, toolRequests = []) => {
  const results = [];
  const allFindings = [];

  for (const request of toolRequests) {
    const toolName = typeof request.tool === 'string' ? request.tool.toLowerCase() : '';
    const options = request.options || {};

    const startTime = new Date();

    try {
      const execution = await runTool(toolName, targetUrl, options);
      
      // Parse output để trích xuất findings
      const findings = resultParser.parseToolOutput(toolName, execution.output);
      allFindings.push(...findings);
      
      results.push({
        tool: toolName,
        status: execution.status,
        options: execution.options,
        output: execution.output,
        error: execution.error,
        findings,
        startedAt: startTime,
        finishedAt: new Date(),
      });
    } catch (error) {
      results.push({
        tool: toolName,
        status: 'failed',
        options,
        output: '',
        error: error.message,
        findings: [],
        startedAt: startTime,
        finishedAt: new Date(),
      });
    }
  }

  // Tạo summary tổng quan
  const summary = resultParser.generateSummary(allFindings);

  return { results, summary };
};

/**
 * Chạy scan batch trong background với update progress
 */
const runScanBatchAsync = async (scanId, targetUrl, toolRequests = []) => {
  const Scan = require('../models/Scan');
  
  try {
    // Update status sang running
    await Scan.findByIdAndUpdate(scanId, { 
      status: 'running',
      progress: 0
    });

    const allFindings = [];
    const totalTools = toolRequests.length;

    for (let i = 0; i < toolRequests.length; i++) {
      const request = toolRequests[i];
      const toolName = typeof request.tool === 'string' ? request.tool.toLowerCase() : '';
      const options = request.options || {};

      const startTime = new Date();

      // Update tool status to running
      await Scan.findOneAndUpdate(
        { _id: scanId, 'results.tool': toolName },
        { 
          $set: { 
            'results.$.status': 'running',
            'results.$.startedAt': startTime
          }
        }
      );

      try {
        const execution = await runTool(toolName, targetUrl, options);
        
        // Parse output để trích xuất findings
        const findings = resultParser.parseToolOutput(toolName, execution.output);
        allFindings.push(...findings);
        
        // Update tool result
        await Scan.findOneAndUpdate(
          { _id: scanId, 'results.tool': toolName },
          { 
            $set: { 
              'results.$.status': execution.status,
              'results.$.output': execution.output,
              'results.$.error': execution.error,
              'results.$.findings': findings,
              'results.$.finishedAt': new Date()
            }
          }
        );
      } catch (error) {
        // Update tool with error
        await Scan.findOneAndUpdate(
          { _id: scanId, 'results.tool': toolName },
          { 
            $set: { 
              'results.$.status': 'failed',
              'results.$.error': error.message,
              'results.$.finishedAt': new Date()
            }
          }
        );
      }

      // Update overall progress
      const progress = Math.round(((i + 1) / totalTools) * 100);
      await Scan.findByIdAndUpdate(scanId, { progress });
    }

    // Tạo summary và update scan status
    const summary = resultParser.generateSummary(allFindings);
    await Scan.findByIdAndUpdate(scanId, { 
      status: 'completed',
      progress: 100,
      summary
    });

  } catch (error) {
    console.error('Scan batch error:', error);
    await Scan.findByIdAndUpdate(scanId, { 
      status: 'failed',
      progress: 100
    });
  }
};

const getSupportedTools = () => [...SUPPORTED_TOOLS];

/**
 * Kiểm tra tool có được cài đặt trên hệ thống không
 */
const isToolInstalled = (toolName) => {
  try {
    // Sử dụng EXTENDED_PATH để tìm tool
    execSync(`which ${toolName}`, { 
      stdio: 'ignore',
      env: { ...process.env, PATH: EXTENDED_PATH }
    });
    return true;
  } catch {
    return false;
  }
};

/**
 * Lấy danh sách các tool đã được cài đặt
 */
const getInstalledTools = () => {
  const installed = [];
  for (const tool of SUPPORTED_TOOLS) {
    if (isToolInstalled(tool)) {
      installed.push(tool);
    }
  }
  console.log('[ScanService] Installed tools:', installed);
  return installed;
};

module.exports = {
  runTool,
  runScanBatch,
  runScanBatchAsync,
  getSupportedTools,
  getInstalledTools,
  isToolInstalled,
};
