import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Dropdown, Row, Spinner, Stack } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TOOL_DEFINITIONS } from '../constants/tools';

const formatDate = (value) => new Date(value).toLocaleString();

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

const ScanHistoryPage = () => {
  const { request } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await request('/scans');
        setScans(response.scans);
      } catch (err) {
        setError(err.message || 'Unable to load scan history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [request]);

  const handleExport = async (scanId, format) => {
    try {
      const blob = await request(`/scans/${scanId}/export?format=${format}`, { responseType: 'blob' });
      downloadBlob(blob, `scan-${scanId}.${format}`);
    } catch (err) {
      setError(err.message || 'Export failed');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status" style={{ color: 'white' }} />
        <p className="mt-3 text-white text-shadow">Loading scan history…</p>
      </div>
    );
  }

  return (
    <Stack gap={4}>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="mb-1 text-white text-shadow">Scan History</h1>
          <p className="text-white text-shadow mb-0" style={{ opacity: 0.9 }}>
            Review and export results from previous scans.
          </p>
        </div>
        <Button 
          as={Link} 
          to="/" 
          variant="outline-light"
          className="btn-gradient-primary"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '2px solid white',
            color: 'white',
            fontWeight: 600,
            backdropFilter: 'blur(10px)'
          }}
        >
          New Scan
        </Button>
      </div>
      
      {error ? <Alert variant="danger">{error}</Alert> : null}
      
      {scans.length === 0 ? (
        <Card className="shadow-lg glass-card">
          <Card.Body className="text-center py-5">
            <p className="mb-2">No scans found.</p>
            <Button as={Link} to="/" variant="primary" className="btn-gradient-primary">
              Run your first scan
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {scans.map((scan) => {
            const summary = scan.summary || {};
            const riskLevel = summary.riskLevel || 'info';
            
            const getRiskColor = (level) => {
              switch (level) {
                case 'critical': return 'danger';
                case 'high': return 'warning';
                case 'medium': return 'info';
                case 'low': return 'primary';
                default: return 'success';
              }
            };

            return (
              <Col xs={12} key={scan._id}>
                <Card className="shadow-lg glass-card">
                  <Card.Body>
                    <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <Card.Title className="mb-0" style={{ fontSize: '1.25rem' }}>
                            {scan.targetUrl}
                          </Card.Title>
                          {summary.riskLevel && (
                            <Badge 
                              bg={getRiskColor(riskLevel)} 
                              className="text-uppercase"
                              style={{ fontSize: '0.85rem', padding: '0.5em 1em' }}
                            >
                              {riskLevel}
                            </Badge>
                          )}
                        </div>
                        <div className="text-muted small mb-2">{formatDate(scan.createdAt)}</div>
                        
                        {summary.counts && (
                          <div className="mb-2 small">
                            <span className="me-3">
                              📊 Tổng: <strong>{summary.counts.total || 0}</strong>
                            </span>
                            {summary.counts.critical > 0 && (
                              <span className="me-3 text-danger">
                                🔴 Critical: <strong>{summary.counts.critical}</strong>
                              </span>
                            )}
                            {summary.counts.high > 0 && (
                              <span className="me-3 text-warning">
                                🟡 High: <strong>{summary.counts.high}</strong>
                              </span>
                            )}
                            {summary.counts.medium > 0 && (
                              <span className="me-3 text-info">
                                🔵 Medium: <strong>{summary.counts.medium}</strong>
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="mt-2 d-flex flex-wrap gap-2">
                          {scan.results.map((result) => (
                            <Badge
                              bg={result.status === 'completed' ? 'success' : 'warning'}
                              key={`${scan._id}-${result.tool}`}
                              style={{ 
                                fontSize: '0.85rem',
                                padding: '0.5em 0.75em',
                                fontWeight: 600
                              }}
                            >
                              {TOOL_DEFINITIONS[result.tool]?.label || result.tool}
                              {result.findings && result.findings.length > 0 && (
                                <span className="ms-1">({result.findings.length})</span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="d-flex align-items-center gap-2">
                        <Button 
                          as={Link} 
                          to={`/scans/${scan._id}`} 
                          variant="primary"
                          className="btn-gradient-primary"
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          View Details
                        </Button>
                        <Dropdown>
                          <Dropdown.Toggle 
                            variant="outline-secondary" 
                            id={`export-${scan._id}`}
                            style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                              color: '#2d3748',
                              fontWeight: 600
                            }}
                          >
                            Export
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => handleExport(scan._id, 'json')}>
                              JSON
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => handleExport(scan._id, 'txt')}>
                              Text
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => handleExport(scan._id, 'pdf')}>
                              PDF Report
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Stack>
  );
};

export default ScanHistoryPage;