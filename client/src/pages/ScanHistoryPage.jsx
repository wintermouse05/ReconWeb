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
        <Spinner animation="border" role="status" />
        <p className="mt-3">Loading scan history…</p>
      </div>
    );
  }

  return (
    <Stack gap={4}>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="mb-1">Scan History</h1>
          <p className="text-muted mb-0">Review and export results from previous scans.</p>
        </div>
        <Button as={Link} to="/" variant="outline-primary">
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
          {scans.map((scan) => (
            <Col xs={12} key={scan._id}>
              <Card className="shadow-sm">
                <Card.Body>
                  <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                    <div>
                      <Card.Title className="mb-1">{scan.targetUrl}</Card.Title>
                      <div className="text-muted small">{formatDate(scan.createdAt)}</div>
                      <div className="mt-2 d-flex flex-wrap gap-2">
                        {scan.results.map((result) => (
                          <Badge
                            bg={result.status === 'completed' ? 'success' : 'warning'}
                            key={`${scan._id}-${result.tool}`}
                          >
                            {TOOL_DEFINITIONS[result.tool]?.label || result.tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Button as={Link} to={`/scans/${scan._id}`} variant="primary">
                        View Details
                      </Button>
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" id={`export-${scan._id}`}>
                          Export
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleExport(scan._id, 'json')}>
                            JSON
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleExport(scan._id, 'txt')}>
                            Text
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Stack>
  );
};

export default ScanHistoryPage;
