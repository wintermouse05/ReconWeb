// client/src/pages/DashboardPage.jsx - Chỉ thêm styling, logic giữ nguyên
import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Stack } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ToolOptionForm from '../components/ToolOptionForm';
import ScanProgress from '../components/ScanProgress';
import { SUPPORTED_TOOLS, TOOL_DEFINITIONS } from '../constants/tools';
import { apiRequest } from '../services/apiClient';
import { FaRocket, FaHistory, FaCheckCircle } from 'react-icons/fa';

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
    <Stack gap={4} className="fade-in">
      {/* Header Card */}
      <Card className="glass-card border-0 shadow-lg">
        <Card.Body className="p-4">
          <Row className="align-items-center">
            <Col md={8}>
              <h1 className="mb-1 gradient-text">
                <FaRocket className="me-2" />
                Security Scanner
              </h1>
              <p className="text-muted mb-0">
                Configure and run vulnerability scans using open-source tools
              </p>
            </Col>
            <Col md={4} className="text-md-end">
              <Button 
                as={Link} 
                to="/history" 
                variant="outline-primary"
                className="btn-gradient-primary"
              >
                <FaHistory className="me-2" />
                View Scan History
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Feedback Messages */}
      {feedback.message && (
        <Alert variant={feedback.type} className="glass-card border-0 fade-in">
          {feedback.message}
        </Alert>
      )}

      {/* Scan Form */}
      <Card className="glass-card border-0 shadow-lg">
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            <Row className="g-4">
              <Col xs={12}>
                <Form.Group controlId="targetUrl">
                  <Form.Label className="fw-semibold">Target URL</Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://example.com"
                    value={targetUrl}
                    onChange={(event) => setTargetUrl(event.target.value)}
                    required
                    className="glass-input"
                    style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                  />
                  <Form.Text className="text-muted">
                    <FaCheckCircle className="me-1" />
                    Include the protocol (http or https)
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col xs={12}>
                <Form.Group controlId="scanNotes">
                  <Form.Label className="fw-semibold">Notes (optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Describe the goal of this scan..."
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Tools Selection */}
            <div className="mt-4">
              <h4 className="mb-3 gradient-text">Select Security Tools</h4>
              
              {loadingTools ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" />
                  <p className="mt-2 text-muted">Checking installed tools...</p>
                </div>
              ) : (
                <>
                  {notInstalledTools.length > 0 && (
                    <Alert variant="warning" className="glass-card mb-3">
                      <strong>Some tools are not installed:</strong>{' '}
                      {notInstalledTools.map(t => TOOL_DEFINITIONS[t]?.label || t).join(', ')}
                    </Alert>
                  )}
                  
                  <Row className="g-3 fade-in-delay-1">
                    {availableTools.map((tool) => (
                      <Col xs={12} md={6} lg={4} key={tool.key}>
                        <Card 
                          className={`h-100 glass-card stat-card ${selectedTools.includes(tool.key) ? 'border-primary' : ''}`}
                          style={{
                            cursor: 'pointer',
                            borderWidth: '2px',
                            transition: 'all 0.3s ease'
                          }}
                          onClick={() => handleToolToggle(tool.key)}
                        >
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <Card.Title className="gradient-text mb-2">
                                  {tool.label}
                                </Card.Title>
                                <Card.Text className="small text-muted">
                                  {tool.description}
                                </Card.Text>
                              </div>
                              <Form.Check
                                type="switch"
                                id={`select-${tool.key}`}
                                checked={selectedTools.includes(tool.key)}
                                onChange={() => handleToolToggle(tool.key)}
                                className="ms-2"
                              />
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </>
              )}
            </div>

            {/* Tool Options */}
            {selectedTools.map((toolKey, index) => (
              <div key={toolKey} className={`fade-in-delay-${Math.min(index + 2, 3)}`}>
                <ToolOptionForm
                  toolKey={toolKey}
                  values={toolOptions[toolKey]}
                  onChange={handleOptionChange}
                />
              </div>
            ))}

            {/* Submit Button */}
            <div className="d-flex justify-content-end mt-4">
              <Button 
                type="submit" 
                className="btn-gradient-primary px-5 py-3"
                disabled={submitting}
                size="lg"
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <FaRocket className="me-2" />
                    Start Security Scan
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Scan Progress */}
      {activeScanId && (
        <div className="fade-in">
          <ScanProgress 
            scanId={activeScanId} 
            onComplete={handleScanComplete}
            request={request}
          />
        </div>
      )}
    </Stack>
  );
};


export default DashboardPage;
