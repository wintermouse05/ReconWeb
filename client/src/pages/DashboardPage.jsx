import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Stack } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ToolOptionForm from '../components/ToolOptionForm';
import ScanProgress from '../components/ScanProgress';
import { SUPPORTED_TOOLS, TOOL_DEFINITIONS } from '../constants/tools';
import { apiRequest } from '../services/apiClient';

const buildInitialSelection = (installedTools = []) =>
  SUPPORTED_TOOLS.filter((tool) => 
    TOOL_DEFINITIONS[tool].defaultEnabled && installedTools.includes(tool)
  );

const buildInitialOptions = () => {
  const initial = {};
  SUPPORTED_TOOLS.forEach((tool) => {
    initial[tool] = {};
    TOOL_DEFINITIONS[tool].options.forEach((option) => {
      if (option.defaultValue !== undefined) {
        initial[tool][option.name] = option.defaultValue;
      }
    });
  });
  return initial;
};

const DashboardPage = () => {
  const { request } = useAuth();
  const navigate = useNavigate();
  const [targetUrl, setTargetUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTools, setSelectedTools] = useState([]);
  const [toolOptions, setToolOptions] = useState(buildInitialOptions);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: null });
  const [activeScanId, setActiveScanId] = useState(null);
  const [installedTools, setInstalledTools] = useState([]);
  const [notInstalledTools, setNotInstalledTools] = useState([]);
  const [loadingTools, setLoadingTools] = useState(true);

  // Load danh sách tool đã cài đặt
  useEffect(() => {
    const fetchInstalledTools = async () => {
      try {
        const data = await apiRequest('/scans/tools/installed');
        setInstalledTools(data.installed || []);
        setNotInstalledTools(data.notInstalled || []);
        setSelectedTools(buildInitialSelection(data.installed || []));
      } catch (error) {
        console.error('Failed to fetch installed tools:', error);
        // Fallback to all tools if API fails
        setInstalledTools(SUPPORTED_TOOLS);
        setSelectedTools(buildInitialSelection(SUPPORTED_TOOLS));
      } finally {
        setLoadingTools(false);
      }
    };
    fetchInstalledTools();
  }, []);

  const availableTools = useMemo(
    () =>
      SUPPORTED_TOOLS
        .filter((toolKey) => installedTools.includes(toolKey))
        .map((toolKey) => ({
          key: toolKey,
          label: TOOL_DEFINITIONS[toolKey].label,
          description: TOOL_DEFINITIONS[toolKey].description,
        })),
    [installedTools]
  );

  const handleToolToggle = (toolKey) => {
    setSelectedTools((prev) =>
      prev.includes(toolKey) ? prev.filter((key) => key !== toolKey) : [...prev, toolKey]
    );
  };

  const handleOptionChange = (toolKey, optionName, value) => {
    setToolOptions((prev) => ({
      ...prev,
      [toolKey]: {
        ...prev[toolKey],
        [optionName]: value,
      },
    }));
  };

  const prepareToolPayload = (toolKey) => {
    const toolDefinition = TOOL_DEFINITIONS[toolKey];
    const storedOptions = toolOptions[toolKey] || {};
    const optionsPayload = {};

    toolDefinition.options.forEach((option) => {
      const rawValue = storedOptions[option.name];
      const serializer = option.serialize;
      const serialized = serializer ? serializer(rawValue) : rawValue;

      const shouldSkip =
        serialized === undefined ||
        serialized === null ||
        serialized === '' ||
        serialized === false ||
        (Array.isArray(serialized) && serialized.length === 0);

      if (!shouldSkip) {
        optionsPayload[option.name] = serialized;
      }
    });

    return {
      tool: toolKey,
      options: optionsPayload,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedTools.length) {
      setFeedback({ type: 'danger', message: 'Please choose at least one tool to run the scan.' });
      return;
    }

    setSubmitting(true);
    setFeedback({ type: null, message: null });
    setActiveScanId(null);

    try {
      const tools = selectedTools.map(prepareToolPayload);
      const payload = {
        url: targetUrl,
        notes,
        tools,
      };

      const response = await request('/scans', { method: 'POST', body: payload });
      setActiveScanId(response._id);
      setFeedback({ type: 'info', message: 'Scan started! Progress will update automatically.' });
    } catch (error) {
      setFeedback({ type: 'danger', message: error.message || 'Failed to start scan. Please try again.' });
      setSubmitting(false);
    }
  };

  const handleScanComplete = (completedScan) => {
    setSubmitting(false);
    if (completedScan.status === 'completed') {
      setFeedback({ type: 'success', message: 'Scan completed successfully!' });
      // Redirect to scan details sau 2 giây
      setTimeout(() => {
        navigate(`/scans/${completedScan._id}`);
      }, 2000);
    } else {
      setFeedback({ type: 'warning', message: 'Scan finished with some errors. Check the details.' });
    }
  };

  return (
    <Stack gap={4}>
      <div className="bg-white shadow-sm p-4 rounded-3">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h1 className="mb-1">Automation Dashboard</h1>
            <p className="mb-0 text-muted">Configure and run vulnerability scans using open-source tools.</p>
          </div>
          <Button as={Link} to="/history" variant="outline-primary">
            View Scan History
          </Button>
        </div>
        {feedback.message ? <Alert variant={feedback.type}>{feedback.message}</Alert> : null}
        <Form onSubmit={handleSubmit}>
          <Row className="g-4">
            <Col xs={12}>
              <Form.Group controlId="targetUrl">
                <Form.Label>Target URL</Form.Label>
                <Form.Control
                  type="url"
                  placeholder="https://example.com"
                  value={targetUrl}
                  onChange={(event) => setTargetUrl(event.target.value)}
                  required
                />
                <Form.Text>Include the protocol (http or https) for the target website.</Form.Text>
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group controlId="scanNotes">
                <Form.Label>Notes (optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Describe the goal of this scan or additional context."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="mt-4">
            <h4 className="mb-3">Select Tools</h4>
            {loadingTools ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Checking installed tools...</p>
              </div>
            ) : (
              <>
                {notInstalledTools.length > 0 && (
                  <Alert variant="warning" className="mb-3">
                    <strong>Some tools are not installed:</strong>{' '}
                    {notInstalledTools.map(t => TOOL_DEFINITIONS[t]?.label || t).join(', ')}.
                    <br />
                    <small>Please install them to use in scans.</small>
                  </Alert>
                )}
                {availableTools.length === 0 ? (
                  <Alert variant="danger">
                    No scanning tools are installed on the server. Please install at least one tool (nikto, gobuster, nuclei, sqlmap, xsstrike, or wpscan).
                  </Alert>
                ) : (
                  <Row className="g-3">
                    {availableTools.map((tool) => (
                      <Col xs={12} md={6} lg={4} key={tool.key}>
                        <Card className={selectedTools.includes(tool.key) ? 'border-primary shadow-sm' : 'shadow-sm'}>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <Card.Title>{tool.label}</Card.Title>
                                <Card.Text className="small text-muted">{tool.description}</Card.Text>
                              </div>
                              <Form.Check
                                type="switch"
                                id={`select-${tool.key}`}
                                checked={selectedTools.includes(tool.key)}
                                onChange={() => handleToolToggle(tool.key)}
                                label=""
                              />
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </>
            )}
          </div>

          {selectedTools.map((toolKey) => (
            <ToolOptionForm
              key={toolKey}
              toolKey={toolKey}
              values={toolOptions[toolKey]}
              onChange={handleOptionChange}
            />
          ))}

          <div className="d-flex justify-content-end">
            <Button type="submit" variant="primary" size="lg" disabled={submitting}>
              {submitting ? 'Scanning...' : 'Start Scan'}
            </Button>
          </div>
        </Form>
      </div>

      {activeScanId && (
        <ScanProgress 
          scanId={activeScanId} 
          onComplete={handleScanComplete}
          request={request}
        />
      )}
    </Stack>
  );
};

export default DashboardPage;
