import { Alert, Badge, Card, ProgressBar } from 'react-bootstrap';
import { ExclamationTriangleFill, ShieldFillCheck, InfoCircleFill } from 'react-bootstrap-icons';

const ScanSummary = ({ summary }) => {
  if (!summary) {
    return null;
  }

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'primary';
      case 'safe':
      case 'info':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'critical':
      case 'high':
      case 'medium':
        return <ExclamationTriangleFill className="me-2" />;
      case 'safe':
        return <ShieldFillCheck className="me-2" />;
      default:
        return <InfoCircleFill className="me-2" />;
    }
  };

  const getRiskMessage = (riskLevel) => {
    switch (riskLevel) {
      case 'critical':
        return 'Trang web có lỗ hổng nghiêm trọng cần khắc phục ngay lập tức!';
      case 'high':
        return 'Phát hiện các lỗ hổng mức độ cao, cần xử lý sớm.';
      case 'medium':
        return 'Có một số vấn đề bảo mật cần được xem xét.';
      case 'low':
        return 'Phát hiện các vấn đề nhỏ, nên cải thiện.';
      case 'safe':
        return 'Không phát hiện lỗ hổng nghiêm trọng.';
      case 'info':
        return 'Scan hoàn tất, chỉ có thông tin tổng quan.';
      default:
        return 'Kết quả scan đã sẵn sàng.';
    }
  };

  const { riskLevel, riskScore, counts, vulnerabilities, directories, information } = summary;
  const color = getRiskColor(riskLevel);

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Header className={`bg-${color} text-white`}>
        <h5 className="mb-0">
          {getRiskIcon(riskLevel)}
          Tóm tắt kết quả scan
        </h5>
      </Card.Header>
      <Card.Body>
        <Alert variant={color} className="mb-3">
          <strong>{getRiskMessage(riskLevel)}</strong>
        </Alert>

        <div className="mb-3">
          <div className="d-flex justify-content-between mb-2">
            <span>Risk Score</span>
            <strong>{riskScore}/100</strong>
          </div>
          <ProgressBar 
            now={riskScore} 
            variant={color} 
            label={`${riskScore}%`}
          />
        </div>

        <div className="row text-center mb-3">
          <div className="col">
            <div className="border rounded p-3">
              <h3 className="mb-1">{counts.total || 0}</h3>
              <small className="text-muted">Tổng phát hiện</small>
            </div>
          </div>
          <div className="col">
            <div className="border rounded p-3">
              <h3 className="mb-1 text-danger">{vulnerabilities || 0}</h3>
              <small className="text-muted">Lỗ hổng</small>
            </div>
          </div>
          <div className="col">
            <div className="border rounded p-3">
              <h3 className="mb-1 text-primary">{directories || 0}</h3>
              <small className="text-muted">Thư mục</small>
            </div>
          </div>
        </div>

        <div>
          <h6 className="mb-3">Phân loại theo mức độ nghiêm trọng:</h6>
          <div className="d-flex flex-wrap gap-2">
            {counts.critical > 0 && (
              <Badge bg="danger" className="px-3 py-2">
                Critical: {counts.critical}
              </Badge>
            )}
            {counts.high > 0 && (
              <Badge bg="warning" className="px-3 py-2">
                High: {counts.high}
              </Badge>
            )}
            {counts.medium > 0 && (
              <Badge bg="info" className="px-3 py-2">
                Medium: {counts.medium}
              </Badge>
            )}
            {counts.low > 0 && (
              <Badge bg="primary" className="px-3 py-2">
                Low: {counts.low}
              </Badge>
            )}
            {counts.info > 0 && (
              <Badge bg="secondary" className="px-3 py-2">
                Info: {counts.info}
              </Badge>
            )}
            {counts.total === 0 && (
              <Badge bg="success" className="px-3 py-2">
                Không có phát hiện
              </Badge>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ScanSummary;
