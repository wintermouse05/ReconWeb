import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Alert, Spinner, Tab, Tabs, ListGroup, Accordion } from 'react-bootstrap';
import { apiRequest } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { FaCode, FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaBug, FaHistory, FaChartBar, FaTrash } from 'react-icons/fa';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'php', label: 'PHP' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML/CSS' },
  { value: 'other', label: 'Other' }
];

const CodeReviewPage = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('review');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [canReview, setCanReview] = useState({ allowed: true });

  useEffect(() => {
    checkCanReview();
    if (activeTab === 'history') {
      fetchHistory();
    } else if (activeTab === 'stats') {
      fetchStats();
    }
  }, [activeTab]);

  const checkCanReview = async () => {
    try {
      const res = await apiRequest('/subscription/can-review', { token });
      setCanReview(res);
    } catch (err) {
      console.error('Error checking review availability:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/code-review/history', { token });
      setHistory(res.reviews || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/code-review/stats', { token });
      setStats(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter code to review');
      return;
    }

    try {
      setReviewing(true);
      setError('');
      setResult(null);

      const res = await apiRequest('/code-review/review', {
        method: 'POST',
        body: { code, language, title: title || 'Untitled Review' },
        token
      });

      setResult(res);
      checkCanReview();
    } catch (err) {
      setError(err.message);
    } finally {
      setReviewing(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      await apiRequest(`/code-review/${reviewId}`, {
        method: 'DELETE',
        token
      });
      fetchHistory();
    } catch (err) {
      setError(err.message);
    }
  };

  const getSeverityBadge = (severity) => {
    const variants = {
      critical: 'danger',
      high: 'warning',
      medium: 'info',
      low: 'secondary',
      info: 'light'
    };
    return <Badge bg={variants[severity] || 'secondary'}>{severity}</Badge>;
  };

  const getRiskBadge = (risk) => {
    const variants = {
      critical: 'danger',
      high: 'warning',
      medium: 'info',
      low: 'secondary',
      secure: 'success'
    };
    return <Badge bg={variants[risk] || 'secondary'} className="fs-6">{risk}</Badge>;
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4 text-white text-shadow">
        <FaCode className="me-2" />
        AI Code Security Review
      </h1>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {!canReview.allowed && (
        <Alert variant="warning">
          {canReview.reason}
          <Button variant="link" href="/subscription" className="p-0 ms-2">
            Upgrade Plan
          </Button>
        </Alert>
      )}

      <Tabs 
        activeKey={activeTab} 
        onSelect={setActiveTab} 
        className="mb-4"
      >
        <Tab 
          eventKey="review" 
          title={
            <span className="d-flex align-items-center">
              <FaShieldAlt className="me-1" /> New Review
            </span>
          }
        >
          <Row>
            <Col lg={6}>
              <Card className="mb-4 glass-card shadow-lg">
                <Card.Header>
                  <h5 className="mb-0">Submit Code for Review</h5>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Title (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g., Login form validation"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Programming Language</Form.Label>
                      <Form.Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                        {LANGUAGES.map((lang) => (
                          <option key={lang.value} value={lang.value}>{lang.label}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Code to Review</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={12}
                        placeholder="Paste your code here..."
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        style={{ fontFamily: 'monospace' }}
                      />
                      <Form.Text className="text-muted">
                        Maximum 50,000 characters
                      </Form.Text>
                    </Form.Group>

                    <Button 
                      type="submit" 
                      variant="primary" 
                      size="lg" 
                      className="w-100 btn-gradient-primary"
                      disabled={reviewing || !canReview.allowed}
                    >
                      {reviewing ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Analyzing Code...
                        </>
                      ) : (
                        <>
                          <FaShieldAlt className="me-2" />
                          Review Code
                        </>
                      )}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              {result && (
                <Card className="mb-4 glass-card shadow-lg">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Security Review Results</h5>
                    {getRiskBadge(result.overallRisk)}
                  </Card.Header>
                  <Card.Body>
                    {result.summary && (
                      <Alert variant={result.overallRisk === 'secure' ? 'success' : 'warning'}>
                        {result.summary}
                      </Alert>
                    )}

                    {result.vulnerabilities && result.vulnerabilities.length > 0 ? (
                      <Accordion defaultActiveKey="0">
                        {result.vulnerabilities.map((vuln, idx) => (
                          <Accordion.Item key={idx} eventKey={idx.toString()}>
                            <Accordion.Header>
                              <span className="me-2">{getSeverityBadge(vuln.severity)}</span>
                              {vuln.type}
                              {vuln.line && <small className="text-muted ms-2">Line {vuln.line}</small>}
                            </Accordion.Header>
                            <Accordion.Body>
                              <p><strong>Description:</strong> {vuln.description}</p>
                              <p><strong>Recommendation:</strong> {vuln.recommendation}</p>
                              {vuln.fixedCode && (
                                <div>
                                  <strong>Fixed Code:</strong>
                                  <pre className="bg-light p-2 rounded mt-2">
                                    <code>{vuln.fixedCode}</code>
                                  </pre>
                                </div>
                              )}
                            </Accordion.Body>
                          </Accordion.Item>
                        ))}
                      </Accordion>
                    ) : (
                      <Alert variant="success">
                        <FaCheckCircle className="me-2" />
                        No security vulnerabilities detected in this code!
                      </Alert>
                    )}

                    {result.aiResponse?.bestPractices && result.aiResponse.bestPractices.length > 0 && (
                      <div className="mt-4">
                        <h6>Best Practices:</h6>
                        <ul>
                          {result.aiResponse.bestPractices.map((practice, idx) => (
                            <li key={idx}>{practice}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              )}

              {!result && !reviewing && (
                <Card className="text-center py-5 glass-card shadow-lg">
                  <Card.Body>
                    <FaBug size={48} className="text-muted mb-3" />
                    <h5>Ready to Review</h5>
                    <p className="text-muted">
                      Paste your code on the left and click "Review Code" to get an AI-powered security analysis.
                    </p>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </Tab>

        <Tab 
          eventKey="history" 
          title={
            <span className="d-flex align-items-center">
              <FaHistory className="me-1" /> History
            </span>
          }
        >
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: 'white' }} />
            </div>
          ) : history.length === 0 ? (
            <Alert variant="info">No code reviews yet. Submit your first code review above!</Alert>
          ) : (
            <ListGroup>
              {history.map((review) => (
                <ListGroup.Item key={review._id} className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1">{review.title}</h6>
                    <small className="text-muted">
                      {review.language} • {new Date(review.createdAt).toLocaleString()}
                    </small>
                    <div className="mt-1">
                      <Badge bg="secondary" className="me-2">{review.status}</Badge>
                      {review.overallRisk && getRiskBadge(review.overallRisk)}
                      {review.vulnerabilities?.length > 0 && (
                        <Badge bg="warning" className="ms-2">
                          {review.vulnerabilities.length} issues
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => handleDeleteReview(review._id)}
                  >
                    <FaTrash />
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Tab>

        <Tab 
          eventKey="stats" 
          title={
            <span className="d-flex align-items-center">
              <FaChartBar className="me-1" /> Statistics
            </span>
          }
        >
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: 'white' }} />
            </div>
          ) : stats ? (
            <Row>
              <Col md={3}>
                <Card className="text-center mb-3 glass-card shadow">
                  <Card.Body>
                    <h2>{stats.totalReviews}</h2>
                    <p className="text-muted mb-0">Total Reviews</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center mb-3 glass-card shadow">
                  <Card.Body>
                    <h2>{stats.completedReviews}</h2>
                    <p className="text-muted mb-0">Completed</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center mb-3 glass-card shadow border-danger">
                  <Card.Body>
                    <h2 className="text-danger">{stats.criticalVulns}</h2>
                    <p className="text-muted mb-0">Critical Issues</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center mb-3 glass-card shadow border-warning">
                  <Card.Body>
                    <h2 className="text-warning">{stats.highVulns}</h2>
                    <p className="text-muted mb-0">High Issues</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          ) : (
            <Alert variant="info">No statistics available yet.</Alert>
          )}
        </Tab>
      </Tabs>
    </Container>
  );
};

export default CodeReviewPage;