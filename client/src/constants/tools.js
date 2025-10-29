export const TOOL_DEFINITIONS = {
  nikto: {
    label: 'Nikto',
    description: 'Open-source web server scanner for known vulnerabilities.',
    defaultEnabled: true,
    options: [
      {
        name: 'timeout',
        label: 'Timeout (seconds)',
        type: 'number',
        placeholder: '60',
        min: 1,
        max: 3600,
        serialize: (value) => (value ? Number(value) : undefined),
      },
      {
        name: 'maxTime',
        label: 'Max Time (seconds)',
        type: 'number',
        placeholder: '3600',
        min: 1,
        max: 86400,
        serialize: (value) => (value ? Number(value) : undefined),
      },
      {
        name: 'userAgent',
        label: 'Custom User-Agent',
        type: 'text',
        placeholder: 'ReconWebScanner/1.0',
      },
      {
        name: 'port',
        label: 'Target Port',
        type: 'number',
        placeholder: '443',
        min: 1,
        max: 65535,
        serialize: (value) => (value ? Number(value) : undefined),
      },
      {
        name: 'ssl',
        label: 'Force SSL',
        type: 'checkbox',
        serialize: (value) => Boolean(value),
      },
      {
        name: 'hostHeader',
        label: 'Host Header Override',
        type: 'text',
        placeholder: 'example.com',
      },
      {
        name: 'cookies',
        label: 'Cookies',
        type: 'textarea',
        placeholder: 'sessionid=abc123; theme=dark',
      },
      {
        name: 'plugins',
        label: 'Plugins',
        type: 'text',
        placeholder: 'apache_expect_xss',
      },
    ],
  },
  gobuster: {
    label: 'Gobuster',
    description: 'Directory/DNS/Fuzzing brute forcing tool.',
    defaultEnabled: true,
    options: [
      {
        name: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'dir', label: 'Directory' },
          { value: 'dns', label: 'DNS' },
          { value: 'vhost', label: 'Virtual Host' },
          { value: 'fuzz', label: 'Fuzz' },
        ],
        defaultValue: 'dir',
      },
      {
        name: 'wordlist',
        label: 'Wordlist Path',
        type: 'text',
        placeholder: '/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt',
        required: true,
        serialize: (value) => (value ? value.trim() : undefined),
      },
      {
        name: 'extensions',
        label: 'Extensions',
        type: 'text',
        placeholder: 'php,html,js',
      },
      {
        name: 'statusCodes',
        label: 'Status Codes',
        type: 'text',
        placeholder: '200,204,301,302,307,403',
      },
      {
        name: 'threads',
        label: 'Threads',
        type: 'number',
        placeholder: '32',
        min: 1,
        max: 200,
        serialize: (value) => (value ? Number(value) : undefined),
      },
      {
        name: 'delay',
        label: 'Delay (seconds)',
        type: 'number',
        placeholder: '0',
        min: 0,
        max: 10,
        step: '0.1',
        serialize: (value) => (value ? Number(value) : undefined),
      },
      {
        name: 'timeout',
        label: 'Timeout (seconds)',
        type: 'number',
        placeholder: '30',
        min: 1,
        max: 300,
        serialize: (value) => (value ? Number(value) : undefined),
      },
      {
        name: 'userAgent',
        label: 'User-Agent',
        type: 'text',
        placeholder: 'ReconWebGobuster/1.0',
      },
      {
        name: 'proxy',
        label: 'Proxy',
        type: 'text',
        placeholder: 'http://127.0.0.1:8080',
      },
      {
        name: 'followRedirect',
        label: 'Follow Redirects',
        type: 'checkbox',
        serialize: (value) => Boolean(value),
      },
      {
        name: 'includeLength',
        label: 'Include Body Length',
        type: 'checkbox',
        serialize: (value) => Boolean(value),
      },
      {
        name: 'noTlsValidation',
        label: 'Skip TLS Verification',
        type: 'checkbox',
        serialize: (value) => Boolean(value),
      },
      {
        name: 'extraArgs',
        label: 'Extra Arguments',
        type: 'textarea',
  placeholder: '--wildcard\n--add-slash',
        serialize: (value) =>
          value
            ? value
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line.length > 0)
            : undefined,
      },
    ],
  },
  nuclei: {
    label: 'Nuclei',
    description: 'Fast template-based vulnerability scanner.',
    defaultEnabled: false,
    options: [
      {
        name: 'templates',
        label: 'Templates',
        type: 'textarea',
        placeholder: '/path/to/template.yaml',
        serialize: (value) =>
          value
            ? value
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line.length > 0)
            : undefined,
      },
      {
        name: 'severity',
        label: 'Severity Filter',
        type: 'text',
        placeholder: 'critical,high',
      },
      {
        name: 'tags',
        label: 'Tags',
        type: 'text',
        placeholder: 'cve,dos',
      },
      {
        name: 'excludeTags',
        label: 'Exclude Tags',
        type: 'text',
        placeholder: 'info',
      },
      {
        name: 'rateLimit',
        label: 'Rate Limit (req/s)',
        type: 'number',
        placeholder: '100',
        min: 1,
        max: 10000,
        serialize: (value) => (value ? Number(value) : undefined),
      },
      {
        name: 'bulkSize',
        label: 'Bulk Size',
        type: 'number',
        placeholder: '25',
        min: 1,
        max: 1000,
        serialize: (value) => (value ? Number(value) : undefined),
      },
      {
        name: 'concurrency',
        label: 'Concurrency',
        type: 'number',
        placeholder: '10',
        min: 1,
        max: 500,
        serialize: (value) => (value ? Number(value) : undefined),
      },
      {
        name: 'headless',
        label: 'Headless Browser Mode',
        type: 'checkbox',
        serialize: (value) => Boolean(value),
      },
      {
        name: 'proxy',
        label: 'Proxy',
        type: 'text',
        placeholder: 'http://127.0.0.1:8080',
      },
      {
        name: 'resolvers',
        label: 'Custom Resolvers',
        type: 'text',
        placeholder: '/etc/resolvers.txt',
      },
      {
        name: 'extraArgs',
        label: 'Extra Arguments',
        type: 'textarea',
  placeholder: '-duc\n--silent',
        serialize: (value) =>
          value
            ? value
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line.length > 0)
            : undefined,
      },
    ],
  },
  sqlmap: {
    label: 'SQLMap',
    description: 'Automatic SQL injection detection and exploitation tool.',
    defaultEnabled: false,
    options: [
      {
        name: 'batch',
        label: 'Batch Mode',
        type: 'checkbox',
        serialize: (value) => Boolean(value),
      },
      {
        name: 'risk',
        label: 'Risk',
        type: 'number',
        placeholder: '1-3',
        min: 0,
        max: 3,
        serialize: (value) => (value ? Number(value) : undefined),
      },
      {
        name: 'level',
        label: 'Level',
        type: 'number',
        placeholder: '1-5',
        min: 1,
        max: 5,
        serialize: (value) => (value ? Number(value) : undefined),
      },
      {
        name: 'threads',
        label: 'Threads',
        type: 'number',
        placeholder: '1-10',
        min: 1,
        max: 10,
        serialize: (value) => (value ? Number(value) : undefined),
      },
      {
        name: 'tamper',
        label: 'Tamper Scripts',
        type: 'text',
        placeholder: 'between,space2comment',
      },
      {
        name: 'dbms',
        label: 'DBMS',
        type: 'text',
        placeholder: 'MySQL',
      },
      {
        name: 'os',
        label: 'Operating System',
        type: 'text',
        placeholder: 'Linux',
      },
      {
        name: 'tech',
        label: 'Techniques',
        type: 'text',
        placeholder: 'BEUSTQ',
      },
      {
        name: 'timeout',
        label: 'Timeout (seconds)',
        type: 'number',
        placeholder: '30',
        min: 1,
        max: 600,
        serialize: (value) => (value ? Number(value) : undefined),
      },
      {
        name: 'delay',
        label: 'Delay (seconds)',
        type: 'number',
        placeholder: '0',
        min: 0,
        max: 10,
        step: '0.1',
        serialize: (value) => (value ? Number(value) : undefined),
      },
      {
        name: 'tor',
        label: 'Use Tor',
        type: 'checkbox',
        serialize: (value) => Boolean(value),
      },
      {
        name: 'randomAgent',
        label: 'Random User-Agent',
        type: 'checkbox',
        serialize: (value) => Boolean(value),
      },
      {
        name: 'extraArgs',
        label: 'Extra Arguments',
        type: 'textarea',
        placeholder: '--fresh-queries',
        serialize: (value) =>
          value
            ? value
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line.length > 0)
            : undefined,
      },
    ],
  },
  xsstrike: {
    label: 'XSStrike',
    description: 'Intelligent XSS detection suite.',
    defaultEnabled: false,
    options: [
      {
        name: 'crawl',
        label: 'Crawl Target',
        type: 'checkbox',
        serialize: (value) => Boolean(value),
      },
      {
        name: 'blind',
        label: 'Enable Blind Payloads',
        type: 'checkbox',
        serialize: (value) => Boolean(value),
      },
      {
        name: 'skip',
        label: 'Skip Parameter Discovery',
        type: 'checkbox',
        serialize: (value) => Boolean(value),
      },
      {
        name: 'fuzz',
        label: 'Enable Fuzzer',
        type: 'checkbox',
        serialize: (value) => Boolean(value),
      },
      {
        name: 'delay',
        label: 'Delay (seconds)',
        type: 'number',
        placeholder: '0',
        min: 0,
        max: 10,
        serialize: (value) => (value ? Number(value) : undefined),
      },
      {
        name: 'headers',
        label: 'Custom Headers',
        type: 'textarea',
        placeholder: 'Authorization: Bearer token',
      },
      {
        name: 'threads',
        label: 'Threads',
        type: 'number',
        placeholder: '4',
        min: 1,
        max: 20,
        serialize: (value) => (value ? Number(value) : undefined),
      },
      {
        name: 'extraArgs',
        label: 'Extra Arguments',
        type: 'textarea',
  placeholder: '--skip-dom\n--data "q=test"',
        serialize: (value) =>
          value
            ? value
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line.length > 0)
            : undefined,
      },
    ],
  },
};

export const SUPPORTED_TOOLS = Object.keys(TOOL_DEFINITIONS);
