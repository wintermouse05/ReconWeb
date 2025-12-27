// client/src/components/Layout.jsx
import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaShieldAlt, FaHistory, FaTachometerAlt, FaCode, FaCrown, FaInfoCircle, FaUser, FaCog } from 'react-icons/fa';
import AnimatedBackground from './AnimatedBackground';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-vh-100 d-flex flex-column position-relative">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Gradient Navbar */}
      <Navbar 
        expand="lg" 
        className="shadow-lg glass-card-dark"
        style={{
          background: 'rgba(26, 32, 44, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 1000
        }}
      >
        <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <div 
              className="d-inline-flex align-items-center justify-content-center rounded-circle me-2"
              style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
            >
              <FaShieldAlt size={20} className="text-white" />
            </div>
            <span className="fw-bold gradient-text" style={{ fontSize: '1.3rem' }}>
              ReconWeb
            </span>
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="main-navbar" />
          <Navbar.Collapse id="main-navbar">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/" className="text-white-50 hover-text-white">
                <FaTachometerAlt className="me-1" /> Dashboard
              </Nav.Link>
              <Nav.Link as={Link} to="/history" className="text-white-50 hover-text-white">
                <FaHistory className="me-1" /> History
              </Nav.Link>
              <Nav.Link as={Link} to="/code-review" className="text-white-50 hover-text-white">
                <FaCode className="me-1" /> Code Review
              </Nav.Link>
              <Nav.Link as={Link} to="/about" className="text-white-50 hover-text-white">
                <FaInfoCircle className="me-1" /> About
              </Nav.Link>
            </Nav>
            
            <Nav className="ms-auto align-items-center">
              <Nav.Link as={Link} to="/subscription" className="me-2">
                <div className="btn btn-sm btn-gradient-primary">
                  <FaCrown className="me-1" /> Upgrade
                </div>
              </Nav.Link>
              
              <NavDropdown 
                title={
                  <span className="text-white d-flex align-items-center">
                    <div 
                      className="rounded-circle me-2"
                      style={{
                        width: '32px',
                        height: '32px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FaUser size={14} className="text-white" />
                    </div>
                    <span className="d-none d-md-inline">{user?.name || 'Account'}</span>
                  </span>
                }
                align="end"
                className="user-dropdown"
                id="user-dropdown"
                style={{ position: 'relative' }}
              >
                <NavDropdown.Item disabled className="text-muted small">
                  {user?.email}
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as={Link} to="/profile">
                  <FaUser className="me-2" /> My Profile
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/settings">
                  <FaCog className="me-2" /> Settings
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as={Link} to="/subscription">
                  <FaCrown className="me-2 text-warning" /> Subscription
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  Log out
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <main 
  className="flex-grow-1 py-4"
  style={{
    background: 'linear-gradient(180deg, rgba(102, 126, 234, 0.1) 0%, rgba(246, 248, 250, 1) 100%)',
    minHeight: '100vh'
  }}
>
  <Container>
    <Outlet />
  </Container>
</main>

      {/* Gradient Footer */}
      <footer 
        className="glass-card-dark py-3 text-center mt-auto"
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 1
        }}
      >
        <small className="text-white-50">
          &copy; {new Date().getFullYear()} ReconWeb Security Automation
          <span className="mx-2">•</span>
          <span className="gradient-text">Powered by Libra Team</span>
        </small>
      </footer>

      {/* Additional CSS for dropdown fix */}
      <style jsx>{`
        .user-dropdown .dropdown-menu {
          position: absolute !important;
          top: 100% !important;
          right: 0 !important;
          left: auto !important;
          transform: none !important;
        }
      `}</style>
    </div>
  );
};

export default Layout;