import { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert, Spinner, Accordion, ListGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { apiRequest } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { FaMagic, FaLightbulb, FaClipboardList, FaShieldAlt, FaLock, FaCrown, FaRocket, FaExternalLinkAlt } from 'react-icons/fa';

const RemediationPanel = ({ scanId, findings, targetUrl }) => {
  const { user, token } = useAuth();
  const [remediation, setRemediation] = useState(null);
  const [basicRemediation, setBasicRemediation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVip, setIsVip] = useState(false);

  useEffect(() => {
    checkVipStatus();
    fetchBasicRemediation();
  }, [scanId]);

  const checkVipStatus = async () => {
    try {
      const status = await apiRequest('/subscription/status', { token });
      setIsVip(status.plan?.id === 'vip' && status.status === 'active');
    } catch (err) {
      console.error('Error checking VIP status:', err);
    }
  };

  const fetchBasicRemediation = async () => {
    try {
      const res = await apiRequest(`/remediation/basic/${scanId}`, { token });
      setBasicRemediation(res);
    } catch (err) {
      console.error('Error fetching basic remediation:', err);
    }
  };

  const fetchAIRemediation = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiRequest(`/remediation/scan/${scanId}`, { token });
      setRemediation(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'danger',
      high: 'warning',
      medium: 'info',
      low: 'secondary'
    };
    return colors[severity] || 'secondary';
  };

  const getEffortBadge = (effort) => {
    const colors = { low: 'success', medium: 'warning', high: 'danger' };
    return <Badge bg={colors[effort] || 'secondary'}>{effort} effort</Badge>;
  };

  if (!findings || findings.length === 0) {
    return (
      <Alert variant="success">
        <FaShieldAlt className="me-2" />
        No vulnerabilities found. No remediation needed!
      </Alert>
    );
  }

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <FaMagic className="me-2" />
          Remediation Suggestions
        </h5>
        {isVip ? (
          <Badge bg="warning" text="dark">
            <FaCrown className="me-1" /> VIP Access
          </Badge>
        ) : (
          <Badge bg="secondary">Basic</Badge>
        )}
      </Card.Header>
      <Card.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* AI-Powered Remediation (VIP) */}
        {isVip && (
          <div className="mb-4">
            {!remediation ? (
              <div className="text-center py-3">
                <p className="text-muted mb-3">
                  Get detailed, AI-powered remediation suggestions with code examples and step-by-step guidance.
                </p>
                <Button variant="warning" onClick={fetchAIRemediation} disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FaRocket className="me-2" />
                      Generate AI Remediation
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <>
                {/* Summary */}
                <Alert variant="info">
                  <strong>Executive Summary:</strong> {remediation.summary}
                </Alert>

                {/* Quick Wins */}
                {remediation.quickWins && remediation.quickWins.length > 0 && (
                  <Card className="mb-3 border-success">
                    <Card.Header className="bg-success text-white">
                      <FaLightbulb className="me-2" />
                      Quick Wins
                    </Card.Header>
                    <ListGroup variant="flush">
                      {remediation.quickWins.map((win, idx) => (
                        <ListGroup.Item key={idx}>✓ {win}</ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Card>
                )}

                {/* Prioritized Actions */}
                {remediation.prioritizedActions && remediation.prioritizedActions.length > 0 && (
                  <Accordion className="mb-3">
                    {remediation.prioritizedActions.map((action, idx) => (
                      <Accordion.Item key={idx} eventKey={idx.toString()}>
                        <Accordion.Header>
                          <Badge bg={getSeverityColor(action.severity)} className="me-2">
                            #{action.priority}
                          </Badge>
                          {action.title}
                          <span className="ms-2">{getEffortBadge(action.effort)}</span>
                        </Accordion.Header>
                        <Accordion.Body>
                          <p><strong>Related Finding:</strong> {action.finding}</p>
                          <p>{action.description}</p>
                          
                          {action.steps && (
                            <>
                              <strong>Steps:</strong>
                              <ol>
                                {action.steps.map((step, sIdx) => (
                                  <li key={sIdx}>{step}</li>
                                ))}
                              </ol>
                            </>
                          )}

                          {action.codeExample && (
                            <div className="mt-3">
                              <strong>Code Example:</strong>
                              <pre className="bg-light p-3 rounded mt-2">
                                <code>{action.codeExample}</code>
                              </pre>
                            </div>
                          )}

                          {action.resources && action.resources.length > 0 && (
                            <div className="mt-3">
                              <strong>Resources:</strong>
                              <ul>
                                {action.resources.map((resource, rIdx) => (
                                  <li key={rIdx}>
                                    <a href={resource} target="_blank" rel="noopener noreferrer">
                                      {resource} <FaExternalLinkAlt size={10} />
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                )}

                {/* Long-term Recommendations */}
                {remediation.longTermRecommendations && remediation.longTermRecommendations.length > 0 && (
                  <Card className="mb-3">
                    <Card.Header>
                      <FaClipboardList className="me-2" />
                      Long-term Recommendations
                    </Card.Header>
                    <ListGroup variant="flush">
                      {remediation.longTermRecommendations.map((rec, idx) => (
                        <ListGroup.Item key={idx}>{rec}</ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Card>
                )}

                {/* Compliance Notes */}
                {remediation.complianceNotes && (
                  <Card>
                    <Card.Header>
                      <FaLock className="me-2" />
                      Compliance Notes
                    </Card.Header>
                    <Card.Body>
                      {remediation.complianceNotes.owasp && (
                        <p><strong>OWASP:</strong> {remediation.complianceNotes.owasp}</p>
                      )}
                      {remediation.complianceNotes.pciDss && (
                        <p><strong>PCI-DSS:</strong> {remediation.complianceNotes.pciDss}</p>
                      )}
                      {remediation.complianceNotes.gdpr && (
                        <p><strong>GDPR:</strong> {remediation.complianceNotes.gdpr}</p>
                      )}
                    </Card.Body>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* Basic Remediation (All Plans) */}
        {basicRemediation && basicRemediation.remediations && (
          <div>
            {!isVip && (
              <Alert variant="info" className="mb-3">
                <FaCrown className="me-2 text-warning" />
                Upgrade to VIP for detailed, AI-powered remediation with code examples.
                <Button variant="link" href="/subscription" className="p-0 ms-2">
                  Upgrade Now
                </Button>
              </Alert>
            )}

            <h6 className="mb-3">Basic Remediation Guidance</h6>
            <Accordion>
              {basicRemediation.remediations.map((item, idx) => (
                <Accordion.Item key={idx} eventKey={idx.toString()}>
                  <Accordion.Header>
                    <Badge bg={getSeverityColor(item.severity)} className="me-2">
                      {item.severity}
                    </Badge>
                    {item.finding}
                  </Accordion.Header>
                  <Accordion.Body>
                    <p><strong>{item.guidance?.title}:</strong> {item.guidance?.description}</p>
                    
                    <strong>Steps:</strong>
                    <ol>
                      {item.guidance?.steps?.map((step, sIdx) => (
                        <li key={sIdx}>{step}</li>
                      ))}
                    </ol>

                    {item.quickTips && (
                      <>
                        <strong>Quick Tips:</strong>
                        <ul>
                          {item.quickTips.map((tip, tIdx) => (
                            <li key={tIdx}>{tip}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default RemediationPanel;
