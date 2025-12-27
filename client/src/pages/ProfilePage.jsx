// client/src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaCalendar, FaSave, FaUserEdit } from 'react-icons/fa';

const ProfilePage = () => {
  const { user, request, setError } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setErrorMsg('');

    try {
      const response = await request('/auth/update-profile', {
        method: 'PUT',
        body: formData
      });

      setSuccess('Profile updated successfully!');
      setEditing(false);
      
      // Refresh user data
      const updatedUser = await request('/auth/me');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4 text-white text-shadow">
        <FaUser className="me-2" />
        My Profile
      </h1>

      {error && <Alert variant="danger" dismissible onClose={() => setErrorMsg('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Row>
        <Col lg={8}>
          <Card className="shadow-lg glass-card">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Profile Information</h5>
              {!editing && (
                <Button 
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setEditing(true)}
                  style={{
                    background: 'rgba(102, 126, 234, 0.1)',
                    borderColor: '#667eea',
                    color: '#667eea',
                    fontWeight: 600
                  }}
                >
                  <FaUserEdit className="me-1" />
                  Edit Profile
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaUser className="me-2" />
                    Full Name
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!editing}
                    required
                    style={{
                      background: editing ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.7)',
                      border: '1px solid rgba(102, 126, 234, 0.3)',
                      color: '#2d3748',
                      fontWeight: 500
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaEnvelope className="me-2" />
                    Email Address
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!editing}
                    required
                    style={{
                      background: editing ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.7)',
                      border: '1px solid rgba(102, 126, 234, 0.3)',
                      color: '#2d3748',
                      fontWeight: 500
                    }}
                  />
                  <Form.Text className="text-muted">
                    Email changes may require verification
                  </Form.Text>
                </Form.Group>

                {editing && (
                  <div className="d-flex gap-2">
                    <Button 
                      type="submit" 
                      variant="primary"
                      className="btn-gradient-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave className="me-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          name: user.name,
                          email: user.email
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow-lg glass-card mb-3">
            <Card.Header>
              <h6 className="mb-0">Account Details</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-2">
                <strong>Account Created:</strong>
                <div className="text-muted">
                  <FaCalendar className="me-2" />
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div className="mb-2">
                <strong>Current Plan:</strong>
                <div className="text-muted">
                  {user?.subscription?.plan?.toUpperCase() || 'FREE'}
                </div>
              </div>
              <div>
                <strong>Account Status:</strong>
                <div className="text-success">Active</div>
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow-lg glass-card">
            <Card.Body>
              <h6 className="mb-3">Quick Actions</h6>
              <div className="d-grid gap-2">
                <Button 
                  variant="outline-primary" 
                  href="/settings" 
                  size="sm"
                  style={{
                    background: 'rgba(102, 126, 234, 0.1)',
                    borderColor: '#667eea',
                    color: '#667eea',
                    fontWeight: 600
                  }}
                >
                  Change Password
                </Button>
                <Button 
                  variant="outline-secondary" 
                  href="/subscription" 
                  size="sm"
                  style={{
                    background: 'rgba(108, 117, 125, 0.1)',
                    borderColor: '#6c757d',
                    color: '#6c757d',
                    fontWeight: 600
                  }}
                >
                  Manage Subscription
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfilePage;