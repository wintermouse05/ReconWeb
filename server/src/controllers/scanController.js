const { validationResult } = require('express-validator');
const Scan = require('../models/Scan');
const scanService = require('../services/scanService');
const { generateScanPDF } = require('../services/pdfGenerator');
const subscriptionService = require('../services/subscriptionService');

const createScan = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { url, tools = [], notes } = req.body;

    // Check subscription limits
    const canScan = await subscriptionService.canPerformScan(req.user.id);
    if (!canScan.allowed) {
      return res.status(403).json({ message: canScan.reason });
    }

    // Check if all requested tools are available for user's plan
    for (const tool of tools) {
      const toolName = typeof tool.tool === 'string' ? tool.tool.toLowerCase() : '';
      const isAvailable = await subscriptionService.isToolAvailable(req.user.id, toolName);
      if (!isAvailable) {
        return res.status(403).json({ 
          message: `Tool "${toolName}" is not available in your current plan. Please upgrade to access this tool.` 
        });
      }
    }

    const sanitizedUrl = url.trim();

    // Tạo scan với status pending
    const scan = await Scan.create({
      user: req.user.id,
      targetUrl: sanitizedUrl,
      notes: notes || '',
      status: 'pending',
      progress: 0,
      results: tools.map(t => ({
        tool: typeof t.tool === 'string' ? t.tool.toLowerCase() : '',
        status: 'pending',
        options: t.options || {}
      }))
    });

    // Increment scan count
    await subscriptionService.incrementScanCount(req.user.id);

    // Trả về scan ID ngay lập tức
    res.status(201).json(scan);

    // Chạy scan trong background
    scanService.runScanBatchAsync(scan._id, sanitizedUrl, tools).catch(err => {
      console.error('Background scan error:', err);
    });

  } catch (error) {
    next(error);
  }
};

const listScans = async (req, res, next) => {
  try {
    const scans = await Scan.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ scans });
  } catch (error) {
    next(error);
  }
};

const getScanById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const scan = await Scan.findOne({ _id: req.params.id, user: req.user.id }).lean();

    if (!scan) {
      return res.status(404).json({ message: 'Scan not found' });
    }

    res.json({ scan });
  } catch (error) {
    next(error);
  }
};

const exportScan = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const scan = await Scan.findOne({ _id: req.params.id, user: req.user.id }).lean();

    if (!scan) {
      return res.status(404).json({ message: 'Scan not found' });
    }

    const format = (req.query.format || 'json').toLowerCase();

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=scan-${scan._id}.json`);
      return res.send(JSON.stringify(scan, null, 2));
    }

    if (format === 'pdf') {
      return generateScanPDF(scan, res);
    }

    if (format === 'txt') {
      const lines = [];
      lines.push(`Scan ID: ${scan._id}`);
      lines.push(`Target URL: ${scan.targetUrl}`);
      lines.push(`Created At: ${scan.createdAt}`);
      lines.push('');
      scan.results.forEach((result) => {
        lines.push(`Tool: ${result.tool}`);
        lines.push(`Status: ${result.status}`);
        lines.push(`Started: ${result.startedAt || 'N/A'}`);
        lines.push(`Finished: ${result.finishedAt || 'N/A'}`);
        lines.push('Options:');
        lines.push(JSON.stringify(result.options, null, 2));
        lines.push('Output:');
        lines.push(result.output || '');
        if (result.error) {
          lines.push('Error:');
          lines.push(result.error);
        }
        lines.push('');
        lines.push('---');
        lines.push('');
      });
      const payload = lines.join('\n');
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename=scan-${scan._id}.txt`);
      return res.send(payload);
    }

    return res.status(400).json({ message: 'Unsupported export format' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createScan,
  listScans,
  getScanById,
  exportScan,
};
