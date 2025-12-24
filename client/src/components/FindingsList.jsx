import { Badge, Card, ListGroup } from 'react-bootstrap';

const FindingsList = ({ findings }) => {
  if (!findings || findings.length === 0) {
    return null;
  }

  const getSeverityVariant = (severity) => {
    switch (severity) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'primary';
      case 'info':
        return 'secondary';
      default:
        return 'light';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'vulnerability':
        return '🔴';
      case 'directory':
        return '📁';
      case 'information':
        return 'ℹ️';
      default:
        return '•';
    }
  };

  return (
    <Card className="mb-3">
      <Card.Header className="bg-light">
        <strong>Chi tiết phát hiện ({findings.length})</strong>
      </Card.Header>
      <ListGroup variant="flush" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {findings.map((finding, index) => (
          <ListGroup.Item key={index} className="d-flex justify-content-between align-items-start">
            <div className="flex-grow-1">
              <div className="d-flex align-items-center mb-1">
                <span className="me-2">{getTypeIcon(finding.type)}</span>
                <Badge bg={getSeverityVariant(finding.severity)} className="me-2">
                  {finding.severity.toUpperCase()}
                </Badge>
                <small className="text-muted">[{finding.tool}]</small>
              </div>
              <div className="text-break">{finding.description}</div>
              {finding.path && (
                <small className="text-muted d-block mt-1">Path: {finding.path}</small>
              )}
              {finding.templateId && (
                <small className="text-muted d-block mt-1">Template: {finding.templateId}</small>
              )}
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  );
};

export default FindingsList;
