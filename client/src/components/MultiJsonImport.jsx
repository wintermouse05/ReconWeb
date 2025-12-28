// client/src/components/MultiJsonImport.jsx
import { useState, useRef } from 'react';
import { Button, Modal, Alert, ListGroup, Badge, Form } from 'react-bootstrap';
import { FaFileImport, FaCheckCircle, FaExclamationTriangle, FaTrash, FaTimes } from 'react-icons/fa';

const MultiJsonImport = ({ onImportSuccess, onToolsToggle }) => {
  const [show, setShow] = useState(false);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const SUPPORTED_TOOLS = ['nikto', 'gobuster', 'nuclei', 'sqlmap', 'xsstrike', 'wpscan'];

  const handleClose = () => {
    setShow(false);
    setFiles([]);
    setErrors([]);
    setSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateJsonStructure = (data, toolKey) => {
    const validations = {
      nikto: ['timeout', 'maxTime', 'tuning', 'userAgent', 'port', 'ssl', 'hostHeader', 'cookies', 'plugins'],
      gobuster: ['mode', 'wordlist', 'extensions', 'statusCodes', 'threads', 'delay', 'timeout', 'userAgent', 'proxy', 'followRedirect', 'includeLength', 'noTlsValidation', 'extraArgs'],
      nuclei: ['templates', 'severity', 'tags', 'excludeTags', 'rateLimit', 'bulkSize', 'concurrency', 'headless', 'proxy', 'resolvers', 'extraArgs'],
      sqlmap: ['batch', 'risk', 'level', 'threads', 'tamper', 'dbms', 'os', 'tech', 'timeout', 'delay', 'tor', 'randomAgent', 'extraArgs'],
      xsstrike: ['crawl', 'blind', 'skip', 'fuzz', 'delay', 'headers', 'threads', 'extraArgs'],
      wpscan: ['apiToken', 'enumeratePlugins', 'enumerateThemes', 'enumerateUsers', 'randomUserAgent', 'disableTlsChecks', 'ignoreMainRedirect', 'userAgent', 'proxy', 'cookieString', 'maxThreads', 'throttle', 'requestTimeout', 'connectTimeout', 'stealthy', 'extraArgs']
    };

    const allowedFields = validations[toolKey] || [];
    const dataKeys = Object.keys(data);
    const invalidKeys = dataKeys.filter(key => !allowedFields.includes(key));

    if (invalidKeys.length > 0) {
      return { valid: false, message: `Invalid fields for ${toolKey}: ${invalidKeys.join(', ')}` };
    }

    // Tool-specific validation
    if (toolKey === 'gobuster' && !data.wordlist) {
      return { valid: false, message: 'Gobuster requires "wordlist" field' };
    }

    if (data.extraArgs) {
      if (!Array.isArray(data.extraArgs)) {
        return { valid: false, message: 'extraArgs must be an array' };
      }
      if (data.extraArgs.length > 10) {
        return { valid: false, message: 'extraArgs max 10 items' };
      }
    }

    return { valid: true };
  };

  const parseJsonFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const jsonData = JSON.parse(content);

          // Determine if single tool or multiple tools
          let toolConfigs = [];

          // Case 1: Single tool config with explicit "tool" field
          if (jsonData.tool && typeof jsonData.tool === 'string') {
            const toolKey = jsonData.tool.toLowerCase();
            if (!SUPPORTED_TOOLS.includes(toolKey)) {
              reject({ fileName: file.name, error: `Unsupported tool: ${toolKey}` });
              return;
            }

            const validation = validateJsonStructure(jsonData, toolKey);
            if (!validation.valid) {
              reject({ fileName: file.name, error: validation.message });
              return;
            }

            toolConfigs.push({ tool: toolKey, config: jsonData });
          }
          // Case 2: Multiple tools in one file { "nikto": {...}, "gobuster": {...} }
          else if (typeof jsonData === 'object' && !Array.isArray(jsonData)) {
            const potentialTools = Object.keys(jsonData).filter(key => 
              SUPPORTED_TOOLS.includes(key.toLowerCase())
            );

            if (potentialTools.length === 0) {
              // Case 3: Assume single tool based on fields (auto-detect)
              let detectedTool = null;
              for (const tool of SUPPORTED_TOOLS) {
                const validation = validateJsonStructure(jsonData, tool);
                if (validation.valid) {
                  detectedTool = tool;
                  break;
                }
              }

              if (!detectedTool) {
                reject({ 
                  fileName: file.name, 
                  error: 'Cannot detect tool. Please specify "tool" field or use tool as root key' 
                });
                return;
              }

              toolConfigs.push({ tool: detectedTool, config: jsonData });
            } else {
              // Multiple tools in one file
              for (const toolKey of potentialTools) {
                const tool = toolKey.toLowerCase();
                const config = jsonData[toolKey];

                const validation = validateJsonStructure(config, tool);
                if (!validation.valid) {
                  reject({ fileName: file.name, error: `${tool}: ${validation.message}` });
                  return;
                }

                toolConfigs.push({ tool, config });
              }
            }
          }
          // Case 4: Array of tool configs
          else if (Array.isArray(jsonData)) {
            for (const item of jsonData) {
              if (!item.tool) {
                reject({ fileName: file.name, error: 'Each item in array must have "tool" field' });
                return;
              }

              const toolKey = item.tool.toLowerCase();
              if (!SUPPORTED_TOOLS.includes(toolKey)) {
                reject({ fileName: file.name, error: `Unsupported tool: ${toolKey}` });
                return;
              }

              const validation = validateJsonStructure(item, toolKey);
              if (!validation.valid) {
                reject({ fileName: file.name, error: validation.message });
                return;
              }

              toolConfigs.push({ tool: toolKey, config: item });
            }
          } else {
            reject({ fileName: file.name, error: 'Invalid JSON structure' });
            return;
          }

          resolve({ fileName: file.name, toolConfigs });
        } catch (err) {
          reject({ fileName: file.name, error: 'Invalid JSON: ' + err.message });
        }
      };

      reader.onerror = () => {
        reject({ fileName: file.name, error: 'Failed to read file' });
      };

      reader.readAsText(file);
    });
  };

  const handleFileSelect = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    setErrors([]);
    setSuccess('');

    if (selectedFiles.length === 0) return;

    const newFiles = [];
    const newErrors = [];

    // Validate file extensions and size
    for (const file of selectedFiles) {
      if (!file.name.endsWith('.json')) {
        newErrors.push({ fileName: file.name, error: 'Must be .json file' });
        continue;
      }

      if (file.size > 1024 * 1024) {
        newErrors.push({ fileName: file.name, error: 'File size > 1MB' });
        continue;
      }

      try {
        const parsed = await parseJsonFile(file);
        newFiles.push(parsed);
      } catch (err) {
        newErrors.push(err);
      }
    }

    // Check for tool conflicts across all files
    const toolsMap = new Map();
    const conflicts = [];

    for (const fileData of newFiles) {
      for (const { tool } of fileData.toolConfigs) {
        if (toolsMap.has(tool)) {
          conflicts.push({
            fileName: fileData.fileName,
            error: `Tool "${tool}" already configured in ${toolsMap.get(tool)}`
          });
        } else {
          toolsMap.set(tool, fileData.fileName);
        }
      }
    }

    if (conflicts.length > 0) {
      setErrors([...newErrors, ...conflicts]);
      return;
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
    }

    if (newFiles.length > 0) {
      setFiles(newFiles);
      setSuccess(`${newFiles.length} file(s) loaded successfully`);
    }
  };

  const handleRemoveFile = (fileName) => {
    setFiles(files.filter(f => f.fileName !== fileName));
    if (files.length === 1) {
      setSuccess('');
    }
  };

  const handleImport = () => {
    if (files.length === 0) return;

    const allTools = [];
    const allConfigs = {};

    // Collect all tools and configs
    files.forEach(fileData => {
      fileData.toolConfigs.forEach(({ tool, config }) => {
        if (!allTools.includes(tool)) {
          allTools.push(tool);
        }
        allConfigs[tool] = config;
      });
    });

    // Pass to parent
    onImportSuccess(allConfigs);
    onToolsToggle(allTools);

    setSuccess('Configuration imported successfully!');
    setTimeout(() => {
      handleClose();
    }, 1500);
  };

  return (
    <>
      <Button
        variant="outline-primary"
        onClick={() => setShow(true)}
        className="d-flex align-items-center gap-2"
      >
        <FaFileImport />
        Import JSON Config
      </Button>

      <Modal show={show} onHide={handleClose} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFileImport className="me-2" />
            Import JSON Configuration
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errors.length > 0 && (
            <Alert variant="danger">
              <FaExclamationTriangle className="me-2" />
              <strong>Errors found:</strong>
              <ul className="mb-0 mt-2">
                {errors.map((err, idx) => (
                  <li key={idx}>
                    <strong>{err.fileName}:</strong> {err.error}
                  </li>
                ))}
              </ul>
            </Alert>
          )}

          {success && (
            <Alert variant="success">
              <FaCheckCircle className="me-2" />
              {success}
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Select JSON Config Files</Form.Label>
            <Form.Control
              ref={fileInputRef}
              type="file"
              accept=".json"
              multiple
              onChange={handleFileSelect}
            />
            <Form.Text className="text-muted">
              You can select multiple JSON files. Each file can contain one or multiple tool configurations.
            </Form.Text>
          </Form.Group>

          {files.length > 0 && (
            <div className="mt-3">
              <h6>Loaded Files ({files.length}):</h6>
              <ListGroup>
                {files.map((fileData, idx) => (
                  <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <strong>{fileData.fileName}</strong>
                      <div className="mt-1">
                        {fileData.toolConfigs.map(({ tool }, tIdx) => (
                          <Badge key={tIdx} bg="primary" className="me-1">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemoveFile(fileData.fileName)}
                    >
                      <FaTimes />
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          )}

          <div className="mt-4">
            <details>
              <summary className="text-primary" style={{ cursor: 'pointer' }}>
                Supported JSON Formats
              </summary>
              <div className="mt-2">
                <h6>Format 1: Single Tool with "tool" field</h6>
                <pre className="bg-light p-2 rounded" style={{ fontSize: '0.85rem' }}>
{`{
  "tool": "gobuster",
  "mode": "dir",
  "wordlist": "/path/to/wordlist.txt",
  "threads": 50,
  "extraArgs": ["--exclude-length", "75055"]
}`}
                </pre>

                <h6 className="mt-3">Format 2: Multiple Tools in One File</h6>
                <pre className="bg-light p-2 rounded" style={{ fontSize: '0.85rem' }}>
{`{
  "nikto": {
    "timeout": 60,
    "ssl": true
  },
  "gobuster": {
    "mode": "dir",
    "wordlist": "/path/to/wordlist.txt"
  }
}`}
                </pre>

                <h6 className="mt-3">Format 3: Auto-detect (fields only)</h6>
                <pre className="bg-light p-2 rounded" style={{ fontSize: '0.85rem' }}>
{`{
  "mode": "dir",
  "wordlist": "/path/to/wordlist.txt",
  "threads": 50
}`}
                </pre>
              </div>
            </details>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={files.length === 0}
          >
            <FaCheckCircle className="me-2" />
            Import {files.length > 0 && `(${files.length} file${files.length > 1 ? 's' : ''})`}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default MultiJsonImport;