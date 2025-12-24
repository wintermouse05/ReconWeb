const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const codeReviewService = require('../services/codeReviewService');

// Submit code for security review
router.post('/review', protect, async (req, res) => {
  try {
    const { code, language, title } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Code is required' });
    }
    
    if (!language) {
      return res.status(400).json({ message: 'Language is required' });
    }

    if (code.length > 50000) {
      return res.status(400).json({ message: 'Code exceeds maximum length (50,000 characters)' });
    }

    const review = await codeReviewService.reviewCode(
      req.user.id, 
      code, 
      language, 
      title
    );

    res.status(201).json(review);
  } catch (error) {
    console.error('Code review error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get code review history
router.get('/history', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await codeReviewService.getReviewHistory(req.user.id, page, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get review statistics
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = await codeReviewService.getReviewStats(req.user.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific code review
router.get('/:id', protect, async (req, res) => {
  try {
    const review = await codeReviewService.getReviewById(req.user.id, req.params.id);
    res.json(review);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Delete a code review
router.delete('/:id', protect, async (req, res) => {
  try {
    await codeReviewService.deleteReview(req.user.id, req.params.id);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

module.exports = router;
