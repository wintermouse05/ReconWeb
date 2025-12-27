import { useEffect, useState } from 'react';
import { Alert, Badge, Button, ButtonGroup, Card, Col, Row, Spinner, Stack } from 'react-bootstrap';
import { FaDownload, FaEye, FaFilePdf, FaFileCode, FaFileAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TOOL_DEFINITIONS } from '../constants/tools';
import { API_BASE_URL } from '../config';

const formatDate = (value) => new Date(value).toLocaleString();

const ScanHistoryPage = () => {
  const { request, token } = useAuth();
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
      setError(''); // Clear previous errors
      
      const response = await fetch(`${API_BASE_URL}/scans/${scanId}/export?format=${format}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Export failed with status ${response.status}`);
      }

      // Get filename from header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `scan-${scanId}.${format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Export error:', err);
      setError(`Failed to export: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status" />
        <p className="mt-3">Loading scan history…</p>
      </div>
    );
  }

  return (
    <Stack gap={4}>
  <div className="d-flex justify-content-between align-items-center">
    <div>
      <h1 
        className="mb-1 fw-bold" 
        style={{ 
          color: '#1e293b',
          fontSize: '2rem'
        }}
      >
        Scan History
      </h1>
      <p 
        className="mb-0" 
        style={{ 
          color: '#D4F1F9',
          fontSize: '1rem'
        }}
      >
        Review and export results from previous scans.
      </p>
    </div>
    <Button 
      as={Link} 
      to="/" 
      variant="primary"
      className="fw-semibold px-4"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        fontWeight: '600'
      }}
    >
      New Scan
    </Button>
  </div>
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {scans.length === 0 ? (
        <Card className="shadow-sm">
          <Card.Body className="text-center py-5">
            <p className="mb-2">No scans found.</p>
            <Button as={Link} to="/" variant="primary">
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
                <Card className="shadow-sm" style={{ position: 'relative', zIndex: 1 }}>
                  <Card.Body>
                    <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <Card.Title className="mb-0">{scan.targetUrl}</Card.Title>
                          {summary.riskLevel && (
                            <Badge bg={getRiskColor(riskLevel)} className="text-uppercase">
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
                            >
                              {TOOL_DEFINITIONS[result.tool]?.label || result.tool}
                              {result.findings && result.findings.length > 0 && (
                                <span className="ms-1">({result.findings.length})</span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
  <Button 
    as={Link} 
    to={`/scans/${scan._id}`} 
    variant="primary"
    style={{
      fontWeight: '600',
      padding: '0.5rem 1.2rem'
    }}
  >
    View Details
  </Button>
  
  <ButtonGroup size="sm">
    <Button 
      variant="outline-success"
      onClick={() => handleExport(scan._id, 'json')}
      title="Export as JSON"
      style={{ fontWeight: '600' }}
    >
      <FaFileCode className="me-1" />
      JSON
    </Button>
    <Button 
      variant="outline-info"
      onClick={() => handleExport(scan._id, 'txt')}
      title="Export as Text"
      style={{ fontWeight: '600' }}
    >
      <FaFileAlt className="me-1" />
      TXT
    </Button>
    <Button 
      variant="outline-danger"
      onClick={() => handleExport(scan._id, 'pdf')}
      title="Export as PDF"
      style={{ fontWeight: '600' }}
    >
      <FaFilePdf className="me-1" />
      PDF
    </Button>
  </ButtonGroup>
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