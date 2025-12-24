const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const remediationService = require('../services/remediationService');
const Scan = require('../models/Scan');

// Get AI-powered remediation for a scan (VIP only)
router.get('/scan/:scanId', protect, async (req, res) => {
  try {
    const scan = await Scan.findOne({ _id: req.params.scanId, user: req.user.id });
    
    if (!scan) {
      return res.status(404).json({ message: 'Scan not found' });
    }

    if (!scan.findings || scan.findings.length === 0) {
      return res.json({
        message: 'No findings to remediate',
        scanId: scan._id,
        targetUrl: scan.targetUrl
      });
    }

    const remediation = await remediationService.generateRemediation(
      req.user.id,
      scan._id,
      scan.findings,
      scan.targetUrl
    );

    res.json(remediation);
  } catch (error) {
    const statusCode = error.message.includes('VIP plan') ? 403 : 500;
    res.status(statusCode).json({ message: error.message });
  }
});

// Get basic remediation for a scan (available for all plans)
router.get('/basic/:scanId', protect, async (req, res) => {
  try {
    const scan = await Scan.findOne({ _id: req.params.scanId, user: req.user.id });
    
    if (!scan) {
      return res.status(404).json({ message: 'Scan not found' });
    }

    const remediation = remediationService.getBasicRemediationForFindings(scan.findings);
    
    res.json({
      scanId: scan._id,
      targetUrl: scan.targetUrl,
      ...remediation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get quick tips by severity
router.get('/tips/:severity', (req, res) => {
  const { severity } = req.params;
  const validSeverities = ['critical', 'high', 'medium', 'low'];
  
  if (!validSeverities.includes(severity.toLowerCase())) {
    return res.status(400).json({ message: 'Invalid severity level' });
  }

  const tips = remediationService.getQuickTips(severity.toLowerCase());
  res.json({ severity, tips });
});

module.exports = router;
