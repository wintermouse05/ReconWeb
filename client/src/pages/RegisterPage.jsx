import { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUserPlus, FaEnvelope, FaLock, FaUser, FaShieldAlt, FaKey, FaUserShield, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import '../styles/auth.css';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '',
    confirmPassword: '',
    agreedToPolicy: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showCurtain, setShowCurtain] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setForm((prev) => ({ ...prev, [name]: fieldValue }));

    // Kiểm tra khớp mật khẩu real-time
    if (name === 'confirmPassword' || name === 'password') {
      if (name === 'confirmPassword') {
        setPasswordMatch(form.password === value);
      } else {
        setPasswordMatch(value === form.confirmPassword);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    // Validate confirm password
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      setPasswordMatch(false);
      return;
    }

    // Validate policy agreement
    if (!form.agreedToPolicy) {
      setError('Bạn phải đồng ý với Chính sách bảo mật để tiếp tục đăng ký!');
      return;
    }

    setSubmitting(true);

    try {
      // Chỉ gửi name, email, password lên server
      await register({
        name: form.name,
        email: form.email,
        password: form.password
      });
      
      setShowCurtain(true);
      
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    } catch (err) {
      console.error('Registration error:', err);
      if (err.payload?.errors && Array.isArray(err.payload.errors)) {
        const messages = err.payload.errors.map(e => e.msg).join(', ');
        setError(messages);
      } else {
        setError(err.message || 'Đăng ký thất bại');
      }
      setSubmitting(false);
    }
  };

  return (
    <>
      {showCurtain && (
        <div className="loading-curtain closing">
          <div className="loading-spinner"></div>
          <p className="text-white mt-4 fs-5 fw-semibold">Đang tạo tài khoản...</p>
        </div>
      )}

      {/* Privacy Policy Modal */}
      <Modal 
        show={showPolicyModal} 
        onHide={() => setShowPolicyModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold d-flex align-items-center">
            <FaShieldAlt className="me-2 text-primary" />
            Chính Sách Bảo Mật
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 py-4">
          <div className="privacy-policy-content" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            
            <section className="mb-4">
              <h5 className="fw-bold text-primary mb-3">1. Thu Thập Thông Tin</h5>
              <p className="text-muted">
                ReconWeb thu thập các thông tin cá nhân sau khi bạn đăng ký tài khoản:
              </p>
              <ul className="text-muted">
                <li>Họ và tên đầy đủ</li>
                <li>Địa chỉ email</li>
                <li>Mật khẩu đã được mã hóa (bcrypt)</li>
                <li>Lịch sử quét bảo mật và phân tích mã nguồn</li>
              </ul>
            </section>

            <section className="mb-4">
              <h5 className="fw-bold text-primary mb-3">2. Sử Dụng Thông Tin</h5>
              <p className="text-muted">Thông tin của bạn được sử dụng để:</p>
              <ul className="text-muted">
                <li>Xác thực và quản lý tài khoản người dùng</li>
                <li>Cung cấp dịch vụ quét bảo mật và phân tích code</li>
                <li>Gửi thông báo về kết quả quét và cập nhật hệ thống</li>
                <li>Cải thiện chất lượng dịch vụ</li>
                <li>Hỗ trợ kỹ thuật khi cần thiết</li>
              </ul>
            </section>

            <section className="mb-4">
              <h5 className="fw-bold text-primary mb-3">3. Bảo Mật Dữ Liệu</h5>
              <p className="text-muted">
                Chúng tôi cam kết bảo vệ thông tin của bạn:
              </p>
              <ul className="text-muted">
                <li><strong>Không chia sẻ:</strong> Thông tin không được bán hoặc chia sẻ với bên thứ ba</li>
                <li><strong>Lưu trữ an toàn:</strong> Database được bảo vệ và backup định kỳ</li>
              </ul>
            </section>

            <section className="mb-4">
              <h5 className="fw-bold text-primary mb-3">4. Quyền Của Người Dùng</h5>
              <p className="text-muted">Bạn có quyền:</p>
              <ul className="text-muted">
                <li>Truy cập và xem thông tin cá nhân</li>
                <li>Cập nhật hoặc sửa đổi thông tin</li>
                <li>Xóa tài khoản và dữ liệu liên quan</li>
                <li>Xuất dữ liệu quét và phân tích</li>
                <li>Từ chối nhận email marketing (nếu có)</li>
              </ul>
            </section>

            <section className="mb-4">
              <h5 className="fw-bold text-primary mb-3">5. Cookie và Tracking</h5>
              <p className="text-muted">
                ReconWeb sử dụng cookie để:
              </p>
              <ul className="text-muted">
                <li>Duy trì phiên đăng nhập</li>
                <li>Lưu trữ token xác thực (localStorage)</li>
                <li>Cải thiện trải nghiệm người dùng</li>
              </ul>
              <p className="text-muted">
                <em>Lưu ý: Cookie chỉ được sử dụng cho mục đích kỹ thuật, không theo dõi hành vi người dùng.</em>
              </p>
            </section>

            <section className="mb-4">
              <h5 className="fw-bold text-primary mb-3">6. Dữ Liệu Quét Bảo Mật</h5>
              <p className="text-muted">
                Các kết quả quét và phân tích code:
              </p>
              <ul className="text-muted">
                <li>Được lưu trữ riêng cho từng người dùng</li>
                <li>Chỉ người dùng mới có quyền truy cập</li>
                <li>Có thể xóa bất cứ lúc nào</li>
                <li>Không được chia sẻ hoặc công khai</li>
              </ul>
            </section>

            <section className="mb-4">
              <h5 className="fw-bold text-primary mb-3">7. Thay Đổi Chính Sách</h5>
              <p className="text-muted">
                ReconWeb có quyền cập nhật chính sách bảo mật. Các thay đổi quan trọng sẽ được thông báo qua email.
              </p>
            </section>

            <section className="mb-4">
              <h5 className="fw-bold text-primary mb-3">8. Liên Hệ</h5>
              <p className="text-muted">
                Nếu có thắc mắc về chính sách bảo mật, vui lòng liên hệ:
              </p>
              <ul className="text-muted">
                <li><strong>Email:</strong> nghuy231@clc.fitus.edu.vn</li>
                <li><strong>Hotline:</strong> 0349876124</li>
              </ul>
            </section>

            <Alert variant="info" className="mt-4 border-0">
              <FaCheckCircle className="me-2" />
              <small>
                <strong>Ngày cập nhật:</strong> {new Date().toLocaleDateString()}
                <strong>Phiên bản:</strong> 1.0.1
              </small>
            </Alert>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button 
            variant="primary" 
            onClick={() => setShowPolicyModal(false)}
            className="px-4 rounded-3"
          >
            Đã hiểu
          </Button>
        </Modal.Footer>
      </Modal>

      <div className="auth-background">
        <div className="floating-locks">
          <FaLock className="lock-icon text-white" size={60} style={{ top: '10%' }} />
          <FaShieldAlt className="lock-icon text-white" size={70} style={{ top: '20%' }} />
          <FaKey className="lock-icon text-white" size={50} style={{ top: '30%' }} />
          <FaUserShield className="lock-icon text-white" size={80} style={{ top: '40%' }} />
          <FaUserPlus className="lock-icon text-white" size={55} style={{ top: '50%' }} />
        </div>

        <div className="particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>

        <Container className="position-relative" style={{ zIndex: 1 }}>
  <Row className="min-vh-100 align-items-center justify-content-center py-5">
    <Col xs={12} md={6} lg={5} xl={4}>
      <Card 
        className="auth-card glass-card shadow-lg border-0 rounded-4"
        style={{ 
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Card.Body 
          className="p-4 p-md-5"
          style={{ 
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          <div className="text-center mb-4">
            {/* Icon và Title */}
            <div 
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 icon-pulse"
              style={{ 
                width: '80px',  // ← Giảm từ 90px
                height: '80px', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
              }}
            >
              <FaUserPlus size={35} className="text-white" /> {/* ← Giảm từ 40 */}
            </div>
            <h2 className="fw-bold mb-2" style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1.75rem'  // ← Giảm size
            }}>
              Join ReconWeb
            </h2>
            <p className="text-muted mb-0 small">Tạo tài khoản để bắt đầu</p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="danger" className="rounded-3 border-0 py-2">
              <div className="d-flex align-items-center">
                <FaExclamationTriangle className="me-2" />
                <small>{error}</small>
              </div>
            </Alert>
          )}

          {/* Form */}
          <Form onSubmit={handleSubmit}>
            {/* Các form groups - giữ nguyên */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold text-dark small">
                <FaUser className="me-2 text-primary" />
                Họ và tên
              </Form.Label>
              <Form.Control
                type="text"
                name="name"
                placeholder="Nhập họ và tên đầy đủ"
                value={form.name}
                onChange={handleChange}
                required
                className="auth-input py-2 rounded-3"  // ← Giảm padding
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold text-dark small">
                <FaEnvelope className="me-2 text-primary" />
                Email
              </Form.Label>
              <Form.Control
                type="email"
                name="email"
                placeholder="Nhập địa chỉ email"
                value={form.email}
                onChange={handleChange}
                required
                className="auth-input py-2 rounded-3"
              />
              <Form.Text className="text-muted">
                <small>Email dùng để đăng nhập và nhận thông báo</small>
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold text-dark small">
                <FaLock className="me-2 text-primary" />
                Mật khẩu
              </Form.Label>
              <Form.Control
                type="password"
                name="password"
                placeholder="Tạo mật khẩu mạnh"
                value={form.password}
                onChange={handleChange}
                required
                className="auth-input py-2 rounded-3"
              />
              <Form.Text className="text-muted">
                <small>Ít nhất 8 ký tự, bao gồm chữ và số</small>
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold text-dark small">
                <FaKey className="me-2 text-primary" />
                Xác nhận mật khẩu
              </Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                placeholder="Nhập lại mật khẩu"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className={`auth-input py-2 rounded-3 ${
                  form.confirmPassword && !passwordMatch ? 'is-invalid' : ''
                } ${
                  form.confirmPassword && passwordMatch ? 'is-valid' : ''
                }`}
              />
              {form.confirmPassword && !passwordMatch && (
                <Form.Text className="text-danger d-flex align-items-center mt-1">
                  <FaExclamationTriangle className="me-1" />
                  <small>Mật khẩu không khớp!</small>
                </Form.Text>
              )}
              {form.confirmPassword && passwordMatch && (
                <Form.Text className="text-success d-flex align-items-center mt-1">
                  <FaCheckCircle className="me-1" />
                  <small>Mật khẩu khớp</small>
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="agreedToPolicy"
                name="agreedToPolicy"
                checked={form.agreedToPolicy}
                onChange={handleChange}
                required
                label={
                  <span className="text-dark small">
                    Tôi đồng ý với{' '}
                    <Button
                      variant="link"
                      className="p-0 text-decoration-none fw-bold"
                      style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        border: 'none',
                        fontSize: '0.9rem'
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPolicyModal(true);
                      }}
                    >
                      Chính sách bảo mật
                    </Button>
                  </span>
                }
              />
            </Form.Group>

            <Button 
              type="submit" 
              className="auth-button w-100 py-2 rounded-3 fw-semibold border-0"  // ← Giảm padding
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '15px'  // ← Giảm size
              }}
              disabled={submitting || !passwordMatch || !form.agreedToPolicy}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Đang tạo tài khoản...
                </>
              ) : (
                <>
                  <FaUserPlus className="me-2" />
                  ĐĂNG KÝ NGAY
                </>
              )}
            </Button>
          </Form>

          <div className="text-center mt-3">
            <small className="text-muted">Đã có tài khoản? </small>
            <Link 
              to="/login" 
              className="fw-bold text-decoration-none"
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: '0.9rem'
              }}
            >
              Đăng nhập
            </Link>
          </div>

          <div className="text-center mt-3 pt-2 border-top">
            <small className="text-muted">
              <FaShieldAlt className="me-1" />
              Bảo mật và an toàn với ReconWeb
            </small>
          </div>
        </Card.Body>
      </Card>
    </Col>
  </Row>
</Container>
      </div>
    </>
  );
};

export default RegisterPage;