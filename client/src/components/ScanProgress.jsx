import { useEffect, useState } from 'react';
import { Alert, Badge, Card, ListGroup, ProgressBar, Spinner } from 'react-bootstrap';
import { TOOL_DEFINITIONS } from '../constants/tools';

const ScanProgress = ({ scanId, onComplete, request }) => {
  const [scan, setScan] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!scanId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await request(`/scans/${scanId}`);
        setScan(response.scan);

        // Nếu scan hoàn tất hoặc failed, dừng polling
        if (response.scan.status === 'completed' || response.scan.status === 'failed') {
          clearInterval(pollInterval);
          if (onComplete) {
            onComplete(response.scan);
          }
        }
      } catch (err) {
        setError(err.message);
        clearInterval(pollInterval);
      }
    }, 2000); // Poll mỗi 2 giây

    return () => clearInterval(pollInterval);
  }, [scanId, request, onComplete]);

  if (error) {
    return <Alert variant="danger">Error: {error}</Alert>;
  }

  if (!scan) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" />
        <p className="mt-2">Initializing scan...</p>
      </div>
    );
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'danger';
      case 'running':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'failed':
        return '✗';
      case 'running':
        return '⟳';
      case 'pending':
        return '○';
      default:
        return '•';
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-light">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Scan Progress</h5>
          <Badge bg={getStatusVariant(scan.status)}>
            {scan.status.toUpperCase()}
          </Badge>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="mb-3">
          <div className="d-flex justify-content-between mb-2">
            <span>Overall Progress</span>
            <strong>{scan.progress || 0}%</strong>
          </div>
          <ProgressBar 
            now={scan.progress || 0} 
            variant={getStatusVariant(scan.status)}
            striped={scan.status === 'running'}
            animated={scan.status === 'running'}
          />
        </div>

        <div className="mb-2">
          <strong>Target:</strong> {scan.targetUrl}
        </div>

        <div>
          <strong>Tools Status:</strong>
          <ListGroup variant="flush" className="mt-2">
            {scan.results && scan.results.map((result, index) => (
              <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center px-0">
                <div className="d-flex align-items-center">
                  <span className="me-2" style={{ fontSize: '1.2em' }}>
                    {getStatusIcon(result.status)}
                  </span>
                  <span>
                    {TOOL_DEFINITIONS[result.tool]?.label || result.tool}
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {result.findings && result.findings.length > 0 && (
                    <Badge bg="danger" pill>
                      {result.findings.length} findings
                    </Badge>
                  )}
                  <Badge bg={getStatusVariant(result.status)}>
                    {result.status}
                  </Badge>
                  {result.status === 'running' && (
                    <Spinner animation="border" size="sm" />
                  )}
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ScanProgress;
