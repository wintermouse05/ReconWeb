const { spawn } = require('child_process');

const SUPPORTED_TOOLS = ['nikto', 'gobuster', 'nuclei', 'sqlmap', 'xsstrike'];

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
};

const runCommand = (command, args = []) =>
  new Promise((resolve) => {
    const child = spawn(command, args, { shell: false });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      resolve({ status: 'failed', output: stdout, error: error.message });
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ status: 'completed', output: stdout, error: stderr });
      } else {
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

  const { args, normalizedOptions } = definition.buildArgs(targetUrl, rawOptions);
  const executionResult = await runCommand(definition.command, args);

  return {
    ...executionResult,
    options: normalizedOptions,
    args,
  };
};

const runScanBatch = async (targetUrl, toolRequests = []) => {
  const results = [];

  for (const request of toolRequests) {
    const toolName = typeof request.tool === 'string' ? request.tool.toLowerCase() : '';
    const options = request.options || {};

    const startTime = new Date();

    try {
      const execution = await runTool(toolName, targetUrl, options);
      results.push({
        tool: toolName,
        status: execution.status,
        options: execution.options,
        output: execution.output,
        error: execution.error,
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
        startedAt: startTime,
        finishedAt: new Date(),
      });
    }
  }

  return results;
};

const getSupportedTools = () => [...SUPPORTED_TOOLS];

module.exports = {
  runTool,
  runScanBatch,
  getSupportedTools,
};
