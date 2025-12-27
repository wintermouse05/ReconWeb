import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Alert, Badge, Button, ButtonGroup, Card, Col, Row, Spinner, Stack } from 'react-bootstrap';
import { FaFilePdf, FaFileCode, FaFileAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { TOOL_DEFINITIONS } from '../constants/tools';
import ScanSummary from '../components/ScanSummary';
import ScanResultAccordion from '../components/ScanResultAccordion';
import RemediationPanel from '../components/RemediationPanel';
import { API_BASE_URL } from '../config';

const formatDateTime = (value) => new Date(value).toLocaleString();

const ScanDetailsPage = () => {
  const { id } = useParams();
  const { request, token } = useAuth();
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
      setError(''); // Clear previous errors
      
      const response = await fetch(`${API_BASE_URL}/scans/${id}/export?format=${format}`, {
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
      let filename = `scan-${id}.${format}`;
      
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
        <p className="mt-3">Loading scan data…</p>
      </div>
    );
  }

  if (error && !scan) {
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
        <div className="d-flex gap-2 flex-wrap">
  <Button as={Link} to="/history" variant="outline-secondary">
    Back to History
  </Button>
  
  <ButtonGroup size="sm">
    <Button 
      variant="outline-success"
      onClick={() => handleExport('json')}
      title="Export as JSON"
    >
      <FaFileCode className="me-1" />
      JSON
    </Button>
    <Button 
      variant="outline-info"
      onClick={() => handleExport('txt')}
      title="Export as Text"
    >
      <FaFileAlt className="me-1" />
      TXT
    </Button>
    <Button 
      variant="outline-danger"
      onClick={() => handleExport('pdf')}
      title="Export as PDF"
    >
      <FaFilePdf className="me-1" />
      PDF
    </Button>
  </ButtonGroup>
</div>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

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