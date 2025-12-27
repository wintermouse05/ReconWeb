import { useState } from 'react';
import { Button, Card, Col, Container, Form, Row, Alert } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaLock, FaEnvelope, FaShieldAlt, FaKey, FaUserShield } from 'react-icons/fa';
import '../styles/auth.css';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
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
      await login(form);
      
      // Show curtain animation
      setShowCurtain(true);
      
      // Wait for animation then navigate
      setTimeout(() => {
        const redirectTo = location.state?.from?.pathname || '/';
        navigate(redirectTo, { replace: true });
      }, 1000);
    } catch (err) {
      console.error('Login error:', err);
      if (err.payload?.errors && Array.isArray(err.payload.errors)) {
        const messages = err.payload.errors.map(e => e.msg).join(', ');
        setError(messages);
      } else {
        setError(err.message || 'Đăng nhập thất bại');
      }
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Loading Curtain */}
      {showCurtain && (
        <div className="loading-curtain closing">
          <div className="loading-spinner"></div>
          <p className="text-white mt-4 fs-5 fw-semibold">Đang đăng nhập...</p>
        </div>
      )}

      {/* Animated Background */}
      <div className="auth-background">
        {/* Floating Locks */}
        <div className="floating-locks">
          <FaLock className="lock-icon text-white" size={60} style={{ top: '10%' }} />
          <FaShieldAlt className="lock-icon text-white" size={70} style={{ top: '20%' }} />
          <FaKey className="lock-icon text-white" size={50} style={{ top: '30%' }} />
          <FaUserShield className="lock-icon text-white" size={80} style={{ top: '40%' }} />
          <FaLock className="lock-icon text-white" size={55} style={{ top: '50%' }} />
        </div>

        {/* Particles */}
        <div className="particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>

        {/* Login Form */}
        <Container className="position-relative" style={{ zIndex: 1 }}>
          <Row className="min-vh-100 align-items-center justify-content-center">
            <Col xs={12} md={6} lg={5} xl={4}>
              <Card className="auth-card glass-card shadow-lg border-0 rounded-4">
                <Card.Body className="p-5">
                  {/* Icon & Title */}
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
                      <FaShieldAlt size={40} className="text-white" />
                    </div>
                    <h2 className="fw-bold mb-2" style={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      Welcome Back!
                    </h2>
                    <p className="text-muted mb-0">Đăng nhập để tiếp tục với ReconWeb</p>
                  </div>

                  {error && (
                    <Alert variant="danger" className="rounded-3 border-0" style={{ 
                      animation: 'slideInUp 0.3s ease-out' 
                    }}>
                      <div className="d-flex align-items-center">
                        <FaLock className="me-2" />
                        {error}
                      </div>
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    {/* Email Field */}
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-dark">
                        <FaEnvelope className="me-2 text-primary" />
                        Email
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type="email"
                          name="email"
                          placeholder="example@email.com"
                          value={form.email}
                          onChange={handleChange}
                          required
                          className="auth-input py-3 rounded-3"
                        />
                      </div>
                    </Form.Group>

                    {/* Password Field */}
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-dark">
                        <FaLock className="me-2 text-primary" />
                        Mật khẩu
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type="password"
                          name="password"
                          placeholder="••••••••"
                          value={form.password}
                          onChange={handleChange}
                          required
                          className="auth-input py-3 rounded-3"
                        />
                      </div>
                    </Form.Group>

                    {/* Remember Me & Forgot Password */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <Form.Check
                        type="checkbox"
                        id="rememberMe"
                        label="Ghi nhớ đăng nhập"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="text-dark"
                      />
                      <Link 
                        to="#" 
                        className="text-decoration-none fw-semibold"
                        style={{ color: '#667eea' }}
                      >
                        Quên mật khẩu?
                      </Link>
                    </div>

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      className="auth-button w-100 py-3 rounded-3 fw-semibold border-0 position-relative" 
                      style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontSize: '16px'
                      }}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Đang đăng nhập...
                        </>
                      ) : (
                        <>
                          <FaShieldAlt className="me-2" />
                          ĐĂNG NHẬP
                        </>
                      )}
                    </Button>
                  </Form>

                  {/* Register Link */}
                  <div className="text-center mt-4">
                    <span className="text-muted">Chưa có tài khoản? </span>
                    <Link 
                      to="/register" 
                      className="fw-bold text-decoration-none"
                      style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      Đăng ký ngay
                    </Link>
                  </div>

                  {/* Footer */}
                  <div className="text-center mt-4 pt-3 border-top">
                    <small className="text-muted">
                      <FaLock className="me-1" />
                      Bảo mật bởi ReconWeb Security
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

export default LoginPage;