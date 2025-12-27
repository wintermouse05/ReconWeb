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
    <Card className="glass-card border-0 shadow-lg fade-in">
      <Card.Header 
        className="d-flex justify-content-between align-items-center"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '16px 16px 0 0'
        }}
      >
        <h5 className="mb-0">
          <Spinner animation="border" size="sm" className="me-2" />
          Scan Progress
        </h5>
        <Badge bg="light" text="dark" className="px-3 py-2">
          {scan.status.toUpperCase()}
        </Badge>
      </Card.Header>
      
      <Card.Body className="p-4">
        {/* ... rest of component with existing logic ... */}
        <div className="mb-4">
          <div className="d-flex justify-content-between mb-2">
            <span className="fw-semibold">Overall Progress</span>
            <strong className="gradient-text">{scan.progress || 0}%</strong>
          </div>
          <ProgressBar 
            now={scan.progress || 0} 
            style={{
              height: '12px',
              borderRadius: '6px',
              background: 'rgba(102, 126, 234, 0.1)'
            }}
            className="shadow-sm"
          />
        </div>
        {/* ... rest of existing code ... */}
      </Card.Body>
    </Card>
  );
};

export default ScanProgress;
