import { Container, Navbar, Nav, NavDropdown, Badge } from 'react-bootstrap';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaShieldAlt, FaHistory, FaTachometerAlt, FaCode, FaCrown } from 'react-icons/fa';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-body-tertiary">
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand as={Link} to="/">
            <FaShieldAlt className="me-2" />
            ReconWeb
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-navbar" />
          <Navbar.Collapse id="main-navbar">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">
                <FaTachometerAlt className="me-1" /> Dashboard
              </Nav.Link>
              <Nav.Link as={Link} to="/history">
                <FaHistory className="me-1" /> History
              </Nav.Link>
              <Nav.Link as={Link} to="/code-review">
                <FaCode className="me-1" /> Code Review
              </Nav.Link>
            </Nav>
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/subscription" className="me-2">
                <FaCrown className="text-warning me-1" /> Plans
              </Nav.Link>
              <NavDropdown title={user?.name || 'Account'} align="end">
                <NavDropdown.Item disabled>Email: {user?.email}</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as={Link} to="/subscription">
                  <FaCrown className="me-2 text-warning" /> Subscription
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>Log out</NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <main className="flex-grow-1 py-4">
        <Container>
          <Outlet />
        </Container>
      </main>
      <footer className="bg-dark text-white py-3 text-center">
        <small>&copy; {new Date().getFullYear()} ReconWeb Security Automation</small>
      </footer>
    </div>
  );
};

export default Layout;
