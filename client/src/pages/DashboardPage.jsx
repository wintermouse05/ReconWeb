import { useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Stack } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ToolOptionForm from '../components/ToolOptionForm';
import { SUPPORTED_TOOLS, TOOL_DEFINITIONS } from '../constants/tools';

const buildInitialSelection = () =>
  SUPPORTED_TOOLS.filter((tool) => TOOL_DEFINITIONS[tool].defaultEnabled);

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
  const [targetUrl, setTargetUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTools, setSelectedTools] = useState(buildInitialSelection);
  const [toolOptions, setToolOptions] = useState(buildInitialOptions);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: null });
  const [latestScan, setLatestScan] = useState(null);

  const availableTools = useMemo(
    () =>
      SUPPORTED_TOOLS.map((toolKey) => ({
        key: toolKey,
        label: TOOL_DEFINITIONS[toolKey].label,
        description: TOOL_DEFINITIONS[toolKey].description,
      })),
    []
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

    try {
      const tools = selectedTools.map(prepareToolPayload);
      const payload = {
        url: targetUrl,
        notes,
        tools,
      };

      const response = await request('/scans', { method: 'POST', body: payload });
      setLatestScan(response);
      setFeedback({ type: 'success', message: 'Scan completed and saved successfully.' });
    } catch (error) {
      setFeedback({ type: 'danger', message: error.message || 'Scan failed. Please try again.' });
    } finally {
      setSubmitting(false);
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
              {submitting ? 'Running scans…' : 'Start Scan'}
            </Button>
          </div>
        </Form>
      </div>

      {latestScan ? (
        <Card className="shadow-sm">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div>
              <strong>Latest Scan Result</strong>
              <div className="small text-muted">Target: {latestScan.targetUrl}</div>
            </div>
            <Badge bg="secondary">{new Date(latestScan.createdAt).toLocaleString()}</Badge>
          </Card.Header>
          <Card.Body>
            {latestScan.results.map((result) => (
              <div key={result.tool} className="mb-4">
                <h5 className="d-flex align-items-center gap-2">
                  {TOOL_DEFINITIONS[result.tool]?.label || result.tool}
                  <Badge bg={result.status === 'completed' ? 'success' : 'danger'}>{result.status}</Badge>
                </h5>
                <pre className="bg-dark text-light p-3 rounded-3 overflow-auto" style={{ maxHeight: '240px' }}>
                  {result.output || 'No output captured.'}
                </pre>
                {result.error ? (
                  <Alert variant="warning">
                    <strong>Error:</strong>
                    <div className="small mt-2" style={{ whiteSpace: 'pre-wrap' }}>
                      {result.error}
                    </div>
                  </Alert>
                ) : null}
              </div>
            ))}
          </Card.Body>
          <Card.Footer className="text-muted">
            <Link to={`/scans/${latestScan._id}`}>View full report</Link>
          </Card.Footer>
        </Card>
      ) : null}
    </Stack>
  );
};

export default DashboardPage;
