import { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUserPlus, FaEnvelope, FaLock, FaUser, FaShieldAlt, FaKey, FaUserShield } from 'react-icons/fa';
import '../styles/auth.css';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showCurtain, setShowCurtain] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await register(form);
      
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
          <Row className="min-vh-100 align-items-center justify-content-center">
            <Col xs={12} md={6} lg={5} xl={4}>
              <Card className="auth-card glass-card shadow-lg border-0 rounded-4">
                <Card.Body className="p-5">
                  <div className="text-center mb-4">
                    <div 
                      className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 icon-pulse"
                      style={{ 
                        width: '90px', 
                        height: '90px', 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
                      }}
                    >
                      <FaUserPlus size={40} className="text-white" />
                    </div>
                    <h2 className="fw-bold mb-2" style={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      Join ReconWeb
                    </h2>
                    <p className="text-muted mb-0">Tạo tài khoản để bắt đầu</p>
                  </div>

                  {error && (
                    <Alert variant="danger" className="rounded-3 border-0">
                      <div className="d-flex align-items-center">
                        <FaLock className="me-2" />
                        {error}
                      </div>
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-dark">
                        <FaUser className="me-2 text-primary" />
                        Họ và tên
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        placeholder="Nguyễn Văn A"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="auth-input py-3 rounded-3"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-dark">
                        <FaEnvelope className="me-2 text-primary" />
                        Email
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder="example@email.com"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="auth-input py-3 rounded-3"
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold text-dark">
                        <FaLock className="me-2 text-primary" />
                        Mật khẩu
                      </Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        placeholder="Ít nhất 8 ký tự"
                        value={form.password}
                        onChange={handleChange}
                        required
                        className="auth-input py-3 rounded-3"
                      />
                      <Form.Text className="text-muted">
                        <small>Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số</small>
                      </Form.Text>
                    </Form.Group>

                    <Button 
                      type="submit" 
                      className="auth-button w-100 py-3 rounded-3 fw-semibold border-0" 
                      style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontSize: '16px'
                      }}
                      disabled={submitting}
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

                  <div className="text-center mt-4">
                    <span className="text-muted">Đã có tài khoản? </span>
                    <Link 
                      to="/login" 
                      className="fw-bold text-decoration-none"
                      style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      Đăng nhập
                    </Link>
                  </div>

                  <div className="text-center mt-4 pt-3 border-top">
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