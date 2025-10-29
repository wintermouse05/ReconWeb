import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, Dropdown, Row, Spinner, Stack } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { TOOL_DEFINITIONS } from '../constants/tools';

const formatDateTime = (value) => new Date(value).toLocaleString();

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

const ScanDetailsPage = () => {
  const { id } = useParams();
  const { request } = useAuth();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await request(`/scans/${id}`);
        setScan(response.scan);
      } catch (err) {
        setError(err.message || 'Unable to load scan details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, request]);

  const handleExport = async (format) => {
    try {
      const blob = await request(`/scans/${id}/export?format=${format}`, { responseType: 'blob' });
      downloadBlob(blob, `scan-${id}.${format}`);
    } catch (err) {
      setError(err.message || 'Export failed');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status" />
        <p className="mt-3">Loading scan data…</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!scan) {
    return (
      <Alert variant="warning">
        Scan not found.{' '}
        <Link className="alert-link" to="/history">
          Back to history
        </Link>
      </Alert>
    );
  }

  return (
    <Stack gap={4}>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h1 className="mb-1">Scan Details</h1>
          <p className="mb-0 text-muted">Target: {scan.targetUrl}</p>
        </div>
        <div className="d-flex gap-2">
          <Button as={Link} to="/history" variant="outline-secondary">
            Back to History
          </Button>
          <Dropdown>
            <Dropdown.Toggle variant="primary">Export</Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleExport('json')}>JSON</Dropdown.Item>
              <Dropdown.Item onClick={() => handleExport('txt')}>Text</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
      <Card className="shadow-sm">
        <Card.Body>
          <Row className="g-3">
            <Col xs={12} md={6}>
              <div className="fw-semibold">Created</div>
              <div>{formatDateTime(scan.createdAt)}</div>
            </Col>
            <Col xs={12} md={6}>
              <div className="fw-semibold">Last updated</div>
              <div>{formatDateTime(scan.updatedAt)}</div>
            </Col>
            {scan.notes ? (
              <Col xs={12}>
                <div className="fw-semibold">Notes</div>
                <Card className="bg-body-secondary">
                  <Card.Body>{scan.notes}</Card.Body>
                </Card>
              </Col>
            ) : null}
          </Row>
        </Card.Body>
      </Card>
      {scan.results.map((result) => (
        <Card className="shadow-sm" key={result.tool}>
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">{TOOL_DEFINITIONS[result.tool]?.label || result.tool}</h5>
                <div className="small text-muted">Status: {result.status}</div>
              </div>
              <Badge bg={result.status === 'completed' ? 'success' : 'warning'}>{result.status}</Badge>
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col xs={12} md={6}>
                <div className="fw-semibold">Started</div>
                <div>{result.startedAt ? formatDateTime(result.startedAt) : 'N/A'}</div>
              </Col>
              <Col xs={12} md={6}>
                <div className="fw-semibold">Finished</div>
                <div>{result.finishedAt ? formatDateTime(result.finishedAt) : 'N/A'}</div>
              </Col>
              <Col xs={12}>
                <div className="fw-semibold">Options</div>
                <Card className="bg-body-tertiary">
                  <Card.Body>
                    <pre className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(result.options || {}, null, 2)}
                    </pre>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={12}>
                <div className="fw-semibold">Output</div>
                <pre className="bg-dark text-white p-3 rounded-3 overflow-auto" style={{ maxHeight: '320px' }}>
                  {result.output || 'No output recorded.'}
                </pre>
              </Col>
              {result.error ? (
                <Col xs={12}>
                  <Alert variant="warning">
                    <strong>Error:</strong>
                    <div className="small mt-2" style={{ whiteSpace: 'pre-wrap' }}>
                      {result.error}
                    </div>
                  </Alert>
                </Col>
              ) : null}
            </Row>
          </Card.Body>
        </Card>
      ))}
    </Stack>
  );
};

export default ScanDetailsPage;
