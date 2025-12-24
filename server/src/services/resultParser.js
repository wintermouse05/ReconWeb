/**
 * Result Parser Service
 * Phân tích output từ các security tools và trích xuất các lỗ hổng/phát hiện
 */

/**
 * Remove ANSI color codes from text
 */
const stripAnsiCodes = (text) => {
  if (!text) return '';
  // Match all ANSI escape sequences
  return text.replace(/\x1b\[[0-9;]*m|\[\[?[0-9;]*m|\[0m/g, '');
};

/**
 * Parse Nikto output để tìm các lỗ hổng
 */
const parseNiktoOutput = (output) => {
  if (!output) return [];
  
  const cleanOutput = stripAnsiCodes(output);
  const findings = [];
  const lines = cleanOutput.split('\n');
  
  for (const line of lines) {
    // Nikto findings thường bắt đầu với + hoặc -
    if (line.trim().startsWith('+') && !line.includes('Target') && !line.includes('Server:') && !line.includes('Start Time:')) {
      const text = line.substring(1).trim();
      
      // Phân loại mức độ nghiêm trọng dựa trên keywords
      let severity = 'info';
      const lowerText = text.toLowerCase();
      
      if (lowerText.includes('vulnerability') || lowerText.includes('exploit') || 
          lowerText.includes('sql injection') || lowerText.includes('xss') ||
          lowerText.includes('command injection') || lowerText.includes('rce')) {
        severity = 'critical';
      } else if (lowerText.includes('outdated') || lowerText.includes('insecure') ||
                 lowerText.includes('weak') || lowerText.includes('exposed')) {
        severity = 'high';
      } else if (lowerText.includes('missing') || lowerText.includes('unnecessary') ||
                 lowerText.includes('information disclosure')) {
        severity = 'medium';
      } else if (lowerText.includes('allowed') || lowerText.includes('retrieved')) {
        severity = 'low';
      }
      
      findings.push({
        type: 'vulnerability',
        severity,
        description: text,
        tool: 'nikto'
      });
    }
  }
  
  return findings;
};

/**
 * Parse Gobuster output để tìm các thư mục/file
 */
const parseGobusterOutput = (output) => {
  if (!output) return [];
  
  const findings = [];
  const lines = output.split('\n');
  
  for (const line of lines) {
    // Gobuster output: /path (Status: 200) [Size: 1234]
    const match = line.match(/^(\/[^\s]+)\s+\(Status:\s*(\d+)\)/);
    if (match) {
      const [, path, status] = match;
      
      let severity = 'info';
      const lowerPath = path.toLowerCase();
      
      // Phát hiện các đường dẫn nhạy cảm
      if (lowerPath.includes('admin') || lowerPath.includes('backup') ||
          lowerPath.includes('config') || lowerPath.includes('.git') ||
          lowerPath.includes('phpinfo') || lowerPath.includes('upload')) {
        severity = status === '200' ? 'high' : 'medium';
      } else if (lowerPath.includes('login') || lowerPath.includes('dashboard') ||
                 lowerPath.includes('panel') || lowerPath.includes('test')) {
        severity = status === '200' ? 'medium' : 'low';
      } else if (status === '200' || status === '301' || status === '302') {
        severity = 'low';
      }
      
      findings.push({
        type: 'directory',
        severity,
        description: `Found path: ${path} (Status: ${status})`,
        path,
        statusCode: parseInt(status),
        tool: 'gobuster'
      });
    }
  }
  
  return findings;
};

/**
 * Parse Nuclei output để tìm các template match
 */
const parseNucleiOutput = (output) => {
  if (!output) return [];
  
  const findings = [];
  const lines = output.split('\n');
  
  // Remove ANSI color codes
  const cleanLine = (line) => line.replace(/\x1b\[[0-9;]*m|\[\[?[0-9;]*m/g, '');
  
  for (const line of lines) {
    const cleaned = cleanLine(line);
    
    // Nuclei format variations:
    // 1. [severity] [template-id] [matcher-name] url
    // 2. [template-id:matcher] [severity] [protocol] url
    // 3. [template-id] [severity] url
    
    // Pattern 1: [template-id:extra] [protocol] url - common format
    let match = cleaned.match(/\[([^\]]+)\]\s+\[([^\]]+)\]\s+(.+)/);
    if (match) {
      const [, part1, part2, url] = match;
      
      // Determine severity from the parts
      let severity = 'info';
      let templateId = part1;
      
      const severityKeywords = {
        'critical': ['critical', 'rce', 'sqli', 'ssti'],
        'high': ['high', 'xss', 'lfi', 'rfi', 'ssrf', 'xxe'],
        'medium': ['medium', 'redirect', 'exposure'],
        'low': ['low', 'info-disclosure'],
        'info': ['info', 'tech-detect', 'waf-detect', 'http-missing']
      };
      
      const lowerPart1 = part1.toLowerCase();
      const lowerPart2 = part2.toLowerCase();
      
      for (const [sev, keywords] of Object.entries(severityKeywords)) {
        if (keywords.some(kw => lowerPart1.includes(kw) || lowerPart2.includes(kw))) {
          severity = sev;
          break;
        }
      }
      
      // Extract template name
      if (part1.includes(':')) {
        templateId = part1.split(':')[0];
      }
      
      findings.push({
        type: 'vulnerability',
        severity,
        description: `${templateId}: ${part2}`,
        templateId,
        url: url.trim(),
        tool: 'nuclei'
      });
      continue;
    }
    
    // Pattern 2: Simple match with severity in brackets
    match = cleaned.match(/\[(critical|high|medium|low|info)\]\s+\[([^\]]+)\]\s+(.+)/i);
    if (match) {
      const [, severity, templateId, url] = match;
      
      findings.push({
        type: 'vulnerability',
        severity: severity.toLowerCase(),
        description: `Template matched: ${templateId}`,
        templateId,
        url: url.trim(),
        tool: 'nuclei'
      });
    }
  }
  
  return findings;
};

/**
 * Parse SQLMap output để tìm SQL injection
 */
const parseSQLMapOutput = (output) => {
  if (!output) return [];
  
  const findings = [];
  const lowerOutput = output.toLowerCase();
  
  // Tìm các dấu hiệu SQL injection
  if (lowerOutput.includes('parameter') && lowerOutput.includes('vulnerable')) {
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('parameter') && line.toLowerCase().includes('vulnerable')) {
        findings.push({
          type: 'vulnerability',
          severity: 'critical',
          description: line.trim(),
          tool: 'sqlmap'
        });
      }
    }
  }
  
  // Tìm backend DBMS được phát hiện
  if (lowerOutput.includes('back-end dbms:')) {
    const dbmsMatch = output.match(/back-end DBMS:\s*([^\n]+)/i);
    if (dbmsMatch) {
      findings.push({
        type: 'information',
        severity: 'info',
        description: `Database detected: ${dbmsMatch[1].trim()}`,
        tool: 'sqlmap'
      });
    }
  }
  
  // Nếu không tìm thấy lỗ hổng
  if (findings.length === 0 && lowerOutput.includes('all tested parameters do not appear to be injectable')) {
    findings.push({
      type: 'information',
      severity: 'info',
      description: 'No SQL injection vulnerabilities found',
      tool: 'sqlmap'
    });
  }
  
  return findings;
};

/**
 * Parse XSStrike output để tìm XSS
 */
const parseXSStrikeOutput = (output) => {
  if (!output) return [];
  
  const cleanOutput = stripAnsiCodes(output);
  const findings = [];
  const lines = cleanOutput.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    const lowerLine = trimmed.toLowerCase();
    
    // XSStrike findings patterns
    // Reflections found
    if (lowerLine.includes('reflections found:')) {
      const match = trimmed.match(/reflections found:\s*(\d+)/i);
      if (match && parseInt(match[1]) > 0) {
        findings.push({
          type: 'information',
          severity: 'medium',
          description: `Reflections found: ${match[1]} - potential XSS vectors detected`,
          tool: 'xsstrike'
        });
      }
    }
    
    // Payloads generated
    if (lowerLine.includes('payloads generated:')) {
      const match = trimmed.match(/payloads generated:\s*(\d+)/i);
      if (match && parseInt(match[1]) > 0) {
        findings.push({
          type: 'information',
          severity: 'medium',
          description: `XSS Payloads generated: ${match[1]}`,
          tool: 'xsstrike'
        });
      }
    }
    
    // WAF detection
    if (lowerLine.includes('waf status:')) {
      const wafStatus = trimmed.replace(/.*waf status:\s*/i, '').trim();
      findings.push({
        type: 'information',
        severity: wafStatus.toLowerCase() === 'offline' ? 'medium' : 'info',
        description: `WAF Status: ${wafStatus}`,
        tool: 'xsstrike'
      });
    }
    
    // Testing parameter
    if (lowerLine.includes('testing parameter:')) {
      const param = trimmed.replace(/.*testing parameter:\s*/i, '').trim();
      findings.push({
        type: 'information',
        severity: 'info',
        description: `Testing parameter: ${param}`,
        tool: 'xsstrike'
      });
    }
    
    // Confirmed XSS
    if (lowerLine.includes('confirmed') || lowerLine.includes('vulnerable')) {
      findings.push({
        type: 'vulnerability',
        severity: 'critical',
        description: trimmed,
        tool: 'xsstrike'
      });
    }
    
    // Payload found/working
    if ((lowerLine.includes('payload') && lowerLine.includes('work')) ||
        lowerLine.includes('[vuln]')) {
      findings.push({
        type: 'vulnerability',
        severity: 'high',
        description: trimmed,
        tool: 'xsstrike'
      });
    }
  }
  
  // If no findings but had some output, add summary
  if (findings.length === 0 && cleanOutput.length > 100) {
    if (cleanOutput.toLowerCase().includes('no xss') || 
        cleanOutput.toLowerCase().includes('not vulnerable')) {
      findings.push({
        type: 'information',
        severity: 'info',
        description: 'No XSS vulnerabilities found',
        tool: 'xsstrike'
      });
    }
  }
  
  return findings;
};

/**
 * Parse WPScan output để tìm lỗ hổng WordPress
 */
const parseWPScanOutput = (output) => {
  if (!output) return [];
  
  const findings = [];
  const lines = output.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Tìm vulnerabilities
    if (trimmed.startsWith('[!]')) {
      const text = trimmed.substring(3).trim();
      
      let severity = 'medium';
      const lowerText = text.toLowerCase();
      
      if (lowerText.includes('version') && lowerText.includes('vulnerabilit')) {
        severity = 'high';
      } else if (lowerText.includes('outdated') || lowerText.includes('insecure')) {
        severity = 'medium';
      }
      
      findings.push({
        type: 'vulnerability',
        severity,
        description: text,
        tool: 'wpscan'
      });
    }
    
    // Tìm interesting findings
    if (trimmed.startsWith('[+]')) {
      const text = trimmed.substring(3).trim();
      
      if (text.toLowerCase().includes('wordpress version') || 
          text.toLowerCase().includes('plugin') ||
          text.toLowerCase().includes('theme')) {
        findings.push({
          type: 'information',
          severity: 'info',
          description: text,
          tool: 'wpscan'
        });
      }
    }
  }
  
  return findings;
};

/**
 * Parse output dựa trên tool
 */
const parseToolOutput = (tool, output) => {
  switch (tool) {
    case 'nikto':
      return parseNiktoOutput(output);
    case 'gobuster':
      return parseGobusterOutput(output);
    case 'nuclei':
      return parseNucleiOutput(output);
    case 'sqlmap':
      return parseSQLMapOutput(output);
    case 'xsstrike':
      return parseXSStrikeOutput(output);
    case 'wpscan':
      return parseWPScanOutput(output);
    default:
      return [];
  }
};

/**
 * Tạo summary tổng quan từ tất cả findings
 */
const generateSummary = (allFindings) => {
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    total: 0
  };
  
  const vulnerabilities = [];
  const directories = [];
  const information = [];
  
  for (const finding of allFindings) {
    counts.total++;
    counts[finding.severity] = (counts[finding.severity] || 0) + 1;
    
    if (finding.type === 'vulnerability') {
      vulnerabilities.push(finding);
    } else if (finding.type === 'directory') {
      directories.push(finding);
    } else if (finding.type === 'information') {
      information.push(finding);
    }
  }
  
  // Xác định risk level tổng thể
  let riskLevel = 'safe';
  let riskScore = 0;
  
  if (counts.critical > 0) {
    riskLevel = 'critical';
    riskScore = 100;
  } else if (counts.high > 0) {
    riskLevel = 'high';
    riskScore = 75;
  } else if (counts.medium > 0) {
    riskLevel = 'medium';
    riskScore = 50;
  } else if (counts.low > 0) {
    riskLevel = 'low';
    riskScore = 25;
  } else if (counts.info > 0) {
    riskLevel = 'info';
    riskScore = 10;
  }
  
  return {
    riskLevel,
    riskScore,
    counts,
    vulnerabilities: vulnerabilities.length,
    directories: directories.length,
    information: information.length,
    hasVulnerabilities: counts.critical > 0 || counts.high > 0 || counts.medium > 0
  };
};

module.exports = {
  parseToolOutput,
  generateSummary,
  parseNiktoOutput,
  parseGobusterOutput,
  parseNucleiOutput,
  parseSQLMapOutput,
  parseXSStrikeOutput,
  parseWPScanOutput
};
