import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaUniversity, FaUsers, FaGithub, FaShieldAlt, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const AboutPage = () => {
  const teamMembers = [
    {
      name: 'Đỗ Duy Đông',
      role: 'Developer',
      id: 'MSSV: 23127171',
      github: 'https://github.com/wintermouse05'
    },
    {
      name: 'Nguyễn Gia Huy',
      role: 'UX/UI Designer',
      id: 'MSSV: 23127054',
      github: 'https://github.com/wintermouse05'
    },
    {
      name: 'Đinh Viết Hải',
      role: 'Tester',
      id: 'MSSV: 23127045',
      github: 'https://github.com/wintermouse05'
    },
    {
      name: 'Lê Công Tuấn',
      role: 'Code deployer',
      id: 'MSSV: 23127509',
      github: 'https://github.com/wintermouse05'
    },
  ];

  const references = [
    { name: 'Nikto', url: 'https://github.com/sullo/nikto' },
    { name: 'Gobuster', url: 'https://github.com/OJ/gobuster' },
    { name: 'Nuclei', url: 'https://github.com/projectdiscovery/nuclei' },
    { name: 'SQLMap', url: 'https://github.com/sqlmapproject/sqlmap' },
    { name: 'XSStrike', url: 'https://github.com/s0md3v/XSStrike' },
    { name: 'WPScan', url: 'https://github.com/wpscanteam/wpscan' },
  ];

  return (
    <Container className="py-5 about-page">
      <div className="text-center mb-5">
        <FaShieldAlt 
          size={64} 
          className="mb-3" 
          style={{ 
            color: 'white',
            filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))'
          }} 
        />
        <h1 className="mb-3 text-white text-shadow">About ReconWeb</h1>
        <p className="lead text-white text-shadow">
          Web Vulnerability Scanning Platform for Educational Purposes
        </p>
      </div>

      {/* University Information */}
      <Card className="shadow-lg mb-4 glass-card">
        <Card.Body>
          <div className="d-flex align-items-center mb-3">
            <FaUniversity size={32} className="text-primary me-3" />
            <h3 className="mb-0">Thông tin trường</h3>
          </div>
          <Row>
            <Col md={6}>
              <p className="mb-2">
                <strong>Trường:</strong> Trường Đại học Khoa học Tự nhiên - ĐHQG TP.HCM
              </p>
              <p className="mb-2">
                <strong>Khoa:</strong> Khoa Công nghệ thông tin
              </p>
              <p className="mb-2">
                <strong>Môn học:</strong> Nhập môn công nghệ Phần mềm
              </p>
            </Col>
            <Col md={6}>
              <p className="mb-2">
                <strong>Học kỳ:</strong> HK1 2024-2025
              </p>
              <p className="mb-2">
                <strong>Giảng viên hướng dẫn:</strong> [Nguyễn Văn Huy]
              </p>
              <p className="mb-2">
                <FaMapMarkerAlt className="me-2" />
                227 Nguyễn Văn Cừ, Phường Chợ Quán, TP. Hồ Chí Minh
              </p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Team Members */}
      <Card className="shadow-lg mb-4 glass-card">
        <Card.Body>
          <div className="d-flex align-items-center mb-4">
            <FaUsers size={32} className="text-primary me-3" />
            <h3 className="mb-0">Thành viên nhóm</h3>
          </div>
          <Row>
            {teamMembers.map((member, index) => (
              <Col md={6} lg={4} key={index} className="mb-3">
                <Card className="h-100 border shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.95)' }}>
                  <Card.Body>
                    <h5 className="mb-2">{member.name}</h5>
                    <p className="text-muted mb-2">{member.role}</p>
                    <p className="mb-2 small">{member.id}</p>
                    {member.github && (
                      <a 
                        href={member.github} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-dark"
                      >
                        <FaGithub className="me-2" />
                        GitHub
                      </a>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      {/* Project Information */}
      <Card className="shadow-lg mb-4 glass-card">
        <Card.Body>
          <h3 className="mb-3">Về dự án</h3>
          <p>
            <strong>ReconWeb</strong> là một nền tảng quét lỗ hổng bảo mật web được phát triển 
            như một đồ án môn học Nhập môn công nghệ phần mềm. Dự án tích hợp nhiều công cụ bảo mật 
            mã nguồn mở để tự động hóa quá trình kiểm tra bảo mật website.
          </p>
          <h5 className="mt-4 mb-3">Tính năng chính:</h5>
          <ul>
            <li>Tích hợp 6 công cụ bảo mật mã nguồn mở</li>
            <li>Quét lỗ hổng tự động với giao diện thân thiện</li>
            <li>Phân tích code bảo mật với AI</li>
            <li>Xuất báo cáo PDF chi tiết</li>
            <li>Hệ thống đăng ký và quản lý người dùng</li>
            <li>Hệ thống subscription với các gói dịch vụ</li>
          </ul>
        </Card.Body>
      </Card>

      {/* Technologies */}
      <Card className="shadow-lg mb-4 glass-card">
        <Card.Body>
          <h3 className="mb-3">Công nghệ sử dụng</h3>
          <Row>
            <Col md={6}>
              <h5>Frontend</h5>
              <ul>
                <li>React 18 + Vite</li>
                <li>React Bootstrap</li>
                <li>Tailwind CSS</li>
                <li>React Router</li>
              </ul>
            </Col>
            <Col md={6}>
              <h5>Backend</h5>
              <ul>
                <li>Node.js + Express.js</li>
                <li>MongoDB + Mongoose</li>
                <li>JWT Authentication</li>
                <li>PDFKit</li>
              </ul>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* References */}
      <Card className="shadow-lg mb-4 glass-card">
        <Card.Body>
          <div className="d-flex align-items-center mb-4">
            <FaGithub size={32} className="text-primary me-3" />
            <h3 className="mb-0">Nguồn trích dẫn</h3>
          </div>
          <p className="mb-3">
            Dự án này sử dụng các công cụ bảo mật mã nguồn mở sau:
          </p>
          <Row>
            {references.map((ref, index) => (
              <Col md={6} lg={4} key={index} className="mb-3">
                <Card className="border h-100 shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.95)' }}>
                  <Card.Body className="d-flex align-items-center justify-content-between">
                    <span><strong>{ref.name}</strong></span>
                    <a 
                      href={ref.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-primary"
                    >
                      GitHub
                    </a>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      {/* Contact */}
      <Card className="shadow-lg bg-light glass-card">
        <Card.Body className="text-center">
          <FaEnvelope size={32} className="text-primary mb-3" />
          <h5>Liên hệ</h5>
          <p className="mb-2">
            <strong>Email:</strong> [email của bạn]@clc.fitus.edu.vn
          </p>
          <p className="mb-2">
            <strong>GitHub:</strong>{' '}
            <a 
              href="https://github.com/wintermouse05/ReconWeb" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              github.com/wintermouse05/ReconWeb
            </a>
          </p>
        </Card.Body>
      </Card>

      {/* Disclaimer */}
      <div className="text-center mt-5">
        <Card className="glass-card shadow-sm">
          <Card.Body>
            <p className="mb-2">
              <strong>Disclaimer:</strong> Công cụ này chỉ dành cho mục đích giáo dục và nghiên cứu. 
              Chỉ sử dụng trên các hệ thống bạn có quyền kiểm tra.
            </p>
            <p className="mb-0 text-muted">
              &copy; {new Date().getFullYear()} ReconWeb - HCMUS Software Engineering Project
            </p>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default AboutPage;