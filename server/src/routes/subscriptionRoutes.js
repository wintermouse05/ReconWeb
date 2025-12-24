const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const subscriptionService = require('../services/subscriptionService');

// Get all available plans
router.get('/plans', (req, res) => {
  try {
    const plans = subscriptionService.getAllPlans();
    res.json({ plans });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user's subscription status
router.get('/status', protect, async (req, res) => {
  try {
    const status = await subscriptionService.getSubscriptionStatus(req.user.id);
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upgrade subscription
router.post('/upgrade', protect, async (req, res) => {
  try {
    const { plan, paymentToken, autoRenew } = req.body;
    
    if (!plan) {
      return res.status(400).json({ message: 'Plan is required' });
    }

    // In production, you would validate payment token with payment provider (Stripe, etc.)
    // For demo purposes, we'll simulate successful payment
    const paymentDetails = {
      autoRenew: autoRenew || false,
      paymentToken
    };

    const result = await subscriptionService.upgradeSubscription(
      req.user.id, 
      plan, 
      paymentDetails
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Cancel subscription
router.post('/cancel', protect, async (req, res) => {
  try {
    const result = await subscriptionService.cancelSubscription(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Check if user can perform a scan
router.get('/can-scan', protect, async (req, res) => {
  try {
    const result = await subscriptionService.canPerformScan(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check if user can perform code review
router.get('/can-review', protect, async (req, res) => {
  try {
    const result = await subscriptionService.canPerformCodeReview(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check if a tool is available for user's plan
router.get('/tool-available/:toolName', protect, async (req, res) => {
  try {
    const available = await subscriptionService.isToolAvailable(
      req.user.id, 
      req.params.toolName
    );
    res.json({ available });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
