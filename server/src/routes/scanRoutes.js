const { Router } = require('express');
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const scanController = require('../controllers/scanController');
const scanService = require('../services/scanService');

const router = Router();

const supportedTools = scanService.getSupportedTools();

// API để lấy danh sách tool đã cài đặt (không cần auth)
router.get('/tools/installed', (req, res) => {
  const installed = scanService.getInstalledTools();
  const all = scanService.getSupportedTools();
  res.json({
    installed,
    all,
    notInstalled: all.filter(t => !installed.includes(t))
  });
});

router.use(authMiddleware);

router.post(
  '/',
  [
    body('url').isURL({ require_protocol: true }).withMessage('A valid URL with protocol is required'),
    body('notes').optional().isString().isLength({ max: 500 }).withMessage('Notes must be 500 characters or less'),
    body('tools').isArray({ min: 1 }).withMessage('At least one tool must be selected'),
    body('tools.*.tool')
      .isIn(supportedTools)
      .withMessage(`Tool must be one of: ${supportedTools.join(', ')}`),
    body('tools.*.options').optional().isObject().withMessage('Options must be an object'),
  ],
  scanController.createScan
);

router.get('/', scanController.listScans);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid scan id')],
  scanController.getScanById
);

router.get(
  '/:id/export',
  [
    param('id').isMongoId().withMessage('Invalid scan id'),
    query('format').optional().isIn(['json', 'txt']).withMessage('Format must be json or txt'),
  ],
  scanController.exportScan
);

module.exports = router;
