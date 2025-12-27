// server/src/routes/authRoutes.js
const { Router } = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/[a-z]/i)
      .withMessage('Password must contain a letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain a number'),
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  authController.login
);

router.get('/me', authMiddleware, authController.me);

// New routes
router.put(
  '/update-profile',
  authMiddleware,
  [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').optional().isEmail().withMessage('Invalid email address').normalizeEmail(),
  ],
  authController.updateProfile
);

router.post(
  '/change-password',
  authMiddleware,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/[a-z]/i)
      .withMessage('Password must contain a letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain a number'),
  ],
  authController.changePassword
);

router.put('/update-notifications', authMiddleware, authController.updateNotifications);

module.exports = router;