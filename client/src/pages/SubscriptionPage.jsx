import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { apiRequest } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { FaCheck, FaCrown, FaStar, FaRocket, FaInfinity } from 'react-icons/fa';

const SubscriptionPage = () => {
  const { user, token } = useAuth();
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, statusRes] = await Promise.all([
        apiRequest('/subscription/plans'),
        apiRequest('/subscription/status', { token })
      ]);
      setPlans(plansRes.plans || []);
      setStatus(statusRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    try {
      setUpgrading(true);
      setError('');
      setSuccess('');

      await apiRequest('/subscription/upgrade', {
        method: 'POST',
        body: { plan: planId, autoRenew: true },
        token
      });

      setSuccess(`Successfully upgraded to ${planId.toUpperCase()} plan!`);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) return;

    try {
      setUpgrading(true);
      setError('');
      await apiRequest('/subscription/cancel', {
        method: 'POST',
        token
      });
      setSuccess('Subscription cancelled. You will retain access until the end of your billing period.');
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpgrading(false);
    }
  };

  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'vip': return <FaCrown className="text-warning" />;
      case 'pro': return <FaStar className="text-primary" />;
      default: return <FaRocket className="text-secondary" />;
    }
  };

  const getPlanBadge = (planId) => {
    if (planId === 'vip') return <Badge bg="warning" text="dark">Most Popular</Badge>;
    if (planId === 'pro') return <Badge bg="primary">Best Value</Badge>;
    return null;
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" style={{ color: 'white' }}>
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4 text-white text-shadow">Subscription Plans</h1>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Current Status Card */}
      {status && (
        <Card className="mb-4 border-primary glass-card shadow-lg">
          <Card.Header 
            className="text-white"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '16px 16px 0 0'
            }}
          >
            <h5 className="mb-0">Current Subscription</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={4}>
                <div className="mb-3">
                  <strong>Plan:</strong>{' '}
                  <span className="fs-5">
                    {getPlanIcon(status.plan?.id)} {status.plan?.name}
                  </span>
                </div>
                <div>
                  <strong>Status:</strong>{' '}
                  <Badge bg={status.status === 'active' ? 'success' : 'warning'}>
                    {status.status}
                  </Badge>
                </div>
              </Col>
              <Col md={4}>
                <div className="mb-2">
                  <strong>Scans This Month:</strong>
                  {status.usage?.scansLimit === -1 ? (
                    <span className="ms-2"><FaInfinity /> Unlimited</span>
                  ) : (
                    <>
                      <div className="d-flex align-items-center mt-1">
                        <ProgressBar 
                          now={(status.usage?.scansThisMonth / status.usage?.scansLimit) * 100} 
                          className="flex-grow-1 me-2"
                          variant={status.usage?.scansThisMonth >= status.usage?.scansLimit ? 'danger' : 'primary'}
                        />
                        <span>{status.usage?.scansThisMonth}/{status.usage?.scansLimit}</span>
                      </div>
                    </>
                  )}
                </div>
              </Col>
              <Col md={4}>
                <div className="mb-2">
                  <strong>Code Reviews Today:</strong>
                  {status.usage?.codeReviewsLimit === -1 ? (
                    <span className="ms-2"><FaInfinity /> Unlimited</span>
                  ) : (
                    <>
                      <div className="d-flex align-items-center mt-1">
                        <ProgressBar 
                          now={(status.usage?.codeReviewsToday / status.usage?.codeReviewsLimit) * 100} 
                          className="flex-grow-1 me-2"
                          variant={status.usage?.codeReviewsToday >= status.usage?.codeReviewsLimit ? 'danger' : 'success'}
                        />
                        <span>{status.usage?.codeReviewsToday}/{status.usage?.codeReviewsLimit}</span>
                      </div>
                    </>
                  )}
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Plans Grid */}
      <Row>
        {plans.map((plan) => (
          <Col md={4} key={plan.id} className="mb-4">
            <Card 
              className={`h-100 glass-card shadow-lg ${
                plan.id === 'vip' ? 'border-warning' : 
                plan.id === 'pro' ? 'border-primary' : ''
              }`}
              style={{ 
                borderWidth: plan.id !== 'free' ? '3px' : '1px',
                transition: 'all 0.3s ease'
              }}
            >
              <Card.Header 
                className={`text-center py-3 ${
                  plan.id === 'vip' ? 'bg-warning text-dark' : 
                  plan.id === 'pro' ? 'text-white' : ''
                }`}
                style={
                  plan.id === 'pro' ? {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  } : {}
                }
              >
                <div className="mb-2">{getPlanBadge(plan.id)}</div>
                <h3 className="mb-0">{getPlanIcon(plan.id)} {plan.name}</h3>
              </Card.Header>
              <Card.Body className="d-flex flex-column">
                <div className="text-center mb-4">
                  <span className="display-4">${plan.price}</span>
                  <span className="text-muted">/month</span>
                </div>

                <ul className="list-unstyled flex-grow-1">
                  <li className="mb-2">
                    <FaCheck className="text-success me-2" />
                    {plan.scansPerMonth === -1 ? 'Unlimited scans' : `${plan.scansPerMonth} scans/month`}
                  </li>
                  <li className="mb-2">
                    <FaCheck className="text-success me-2" />
                    {plan.codeReviewsPerDay === -1 ? 'Unlimited code reviews' : `${plan.codeReviewsPerDay} code reviews/day`}
                  </li>
                  <li className="mb-2">
                    <FaCheck className="text-success me-2" />
                    {plan.toolsAvailable?.length} security tools
                  </li>
                  {plan.features?.map((feature, idx) => (
                    <li key={idx} className="mb-2">
                      <FaCheck className="text-success me-2" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  {status?.plan?.id === plan.id ? (
                    <Button 
                      variant="secondary" 
                      disabled 
                      className="w-100"
                      style={{ fontWeight: 600 }}
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      className={`w-100 ${
                        plan.id === 'vip' || plan.id === 'pro' 
                          ? 'btn-gradient-primary' 
                          : ''
                      }`}
                      variant={
                        plan.id === 'vip' ? 'warning' : 
                        plan.id === 'pro' ? 'primary' : 
                        'outline-secondary'
                      }
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={upgrading}
                      style={{ fontWeight: 600 }}
                    >
                      {upgrading ? (
                        <Spinner animation="border" size="sm" />
                      ) : status?.plan?.id === 'free' ? (
                        plan.id === 'free' ? 'Current Plan' : 'Upgrade'
                      ) : (
                        plan.price > (status?.plan?.price || 0) ? 'Upgrade' : 'Downgrade'
                      )}
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Cancel Subscription */}
      {status?.plan?.id !== 'free' && status?.status === 'active' && (
        <div className="text-center mt-4">
          <Button 
            variant="outline-danger" 
            onClick={handleCancel} 
            disabled={upgrading}
            style={{
              background: 'rgba(220, 53, 69, 0.1)',
              borderColor: '#dc3545',
              color: '#dc3545',
              fontWeight: 600,
              padding: '10px 30px',
              fontSize: '16px',
              transition: 'all 0.3s ease'
            }}
            className="cancel-subscription-btn"
          >
            Cancel Subscription
          </Button>
        </div>
      )}

      <style jsx>{`
        .cancel-subscription-btn:hover {
          background: #dc3545 !important;
          color: white !important;
          border-color: #dc3545 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
        }
      `}</style>
    </Container>
  );
};

export default SubscriptionPage;