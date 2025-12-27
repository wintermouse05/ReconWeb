// client/src/pages/SettingsPage.jsx
import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { FaCog, FaLock, FaBell, FaShieldAlt } from 'react-icons/fa';

const SettingsPage = () => {
  const { request } = useAuth();
  const [activeTab, setActiveTab] = useState('security');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    scanComplete: true,
    vulnerabilityAlerts: true,
    weeklyReport: false
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      await request('/auth/change-password', {
        method: 'POST',
        body: {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        }
      });

      setSuccess('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      await request('/auth/update-notifications', {
        method: 'PUT',
        body: notifications
      });

      setSuccess('Notification preferences updated!');
    } catch (err) {
      setError(err.message || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4 text-white text-shadow">
        <FaCog className="me-2" />
        Settings
      </h1>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Row>
        <Col lg={12}>
          <Card className="shadow-lg glass-card">
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-3"
              >
                {/* Security Tab */}
                <Tab 
                  eventKey="security" 
                  title={
                    <span className="d-flex align-items-center">
                      <FaLock className="me-1" /> Security
                    </span>
                  }
                >
                  <h5 className="mb-3">Change Password</h5>
                  <Form onSubmit={handlePasswordChange}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Current Password</Form.Label>
                          <Form.Control
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({
                              ...passwordForm,
                              currentPassword: e.target.value
                            })}
                            required
                            style={{
                              background: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid rgba(102, 126, 234, 0.3)',
                              color: '#2d3748'
                            }}
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>New Password</Form.Label>
                          <Form.Control
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({
                              ...passwordForm,
                              newPassword: e.target.value
                            })}
                            required
                            minLength={8}
                            style={{
                              background: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid rgba(102, 126, 234, 0.3)',
                              color: '#2d3748'
                            }}
                          />
                          <Form.Text className="text-muted">
                            At least 8 characters, including letters and numbers
                          </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Confirm New Password</Form.Label>
                          <Form.Control
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({
                              ...passwordForm,
                              confirmPassword: e.target.value
                            })}
                            required
                            style={{
                              background: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid rgba(102, 126, 234, 0.3)',
                              color: '#2d3748'
                            }}
                          />
                        </Form.Group>

                        <Button 
                          type="submit" 
                          variant="primary"
                          className="btn-gradient-primary"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <FaShieldAlt className="me-2" />
                              Update Password
                            </>
                          )}
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                </Tab>

                {/* Notifications Tab */}
                <Tab 
                  eventKey="notifications" 
                  title={
                    <span className="d-flex align-items-center">
                      <FaBell className="me-1" /> Notifications
                    </span>
                  }
                >
                  <h5 className="mb-3">Notification Preferences</h5>
                  <Form>
                    <Form.Check
                      type="switch"
                      id="emailNotifications"
                      label="Enable email notifications"
                      checked={notifications.emailNotifications}
                      onChange={(e) => setNotifications({
                        ...notifications,
                        emailNotifications: e.target.checked
                      })}
                      className="mb-3"
                      style={{ fontSize: '1.1rem' }}
                    />

                    <Form.Check
                      type="switch"
                      id="scanComplete"
                      label="Notify when scan completes"
                      checked={notifications.scanComplete}
                      onChange={(e) => setNotifications({
                        ...notifications,
                        scanComplete: e.target.checked
                      })}
                      className="mb-3"
                      style={{ fontSize: '1.1rem' }}
                    />

                    <Form.Check
                      type="switch"
                      id="vulnerabilityAlerts"
                      label="Alert on critical vulnerabilities"
                      checked={notifications.vulnerabilityAlerts}
                      onChange={(e) => setNotifications({
                        ...notifications,
                        vulnerabilityAlerts: e.target.checked
                      })}
                      className="mb-3"
                      style={{ fontSize: '1.1rem' }}
                    />

                    <Form.Check
                      type="switch"
                      id="weeklyReport"
                      label="Send weekly security report"
                      checked={notifications.weeklyReport}
                      onChange={(e) => setNotifications({
                        ...notifications,
                        weeklyReport: e.target.checked
                      })}
                      className="mb-3"
                      style={{ fontSize: '1.1rem' }}
                    />

                    <Button 
                      variant="primary"
                      className="btn-gradient-primary"
                      onClick={handleNotificationUpdate}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Saving...
                        </>
                      ) : (
                        'Save Preferences'
                      )}
                    </Button>
                  </Form>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SettingsPage;