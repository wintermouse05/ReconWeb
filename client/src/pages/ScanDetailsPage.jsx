import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, Dropdown, Row, Spinner, Stack } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { TOOL_DEFINITIONS } from '../constants/tools';
import ScanSummary from '../components/ScanSummary';
import ScanResultAccordion from '../components/ScanResultAccordion';
import RemediationPanel from '../components/RemediationPanel';

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
              <Dropdown.Item onClick={() => handleExport('pdf')}>PDF Report</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      {/* Hiển thị summary */}
      {scan.summary && <ScanSummary summary={scan.summary} />}

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

      {/* Hiển thị kết quả chi tiết với findings */}
      <div>
        <h4 className="mb-3">Chi tiết từng công cụ</h4>
        <ScanResultAccordion results={scan.results} />
      </div>

      {/* Remediation Panel */}
      {scan.findings && scan.findings.length > 0 && (
        <RemediationPanel 
          scanId={scan._id} 
          findings={scan.findings} 
          targetUrl={scan.targetUrl} 
        />
      )}
    </Stack>
  );
};

export default ScanDetailsPage;
