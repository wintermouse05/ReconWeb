const { validationResult } = require('express-validator');
const Scan = require('../models/Scan');
const scanService = require('../services/scanService');

const createScan = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { url, tools = [], notes } = req.body;

    const sanitizedUrl = url.trim();

    const executedResults = await scanService.runScanBatch(sanitizedUrl, tools);

    const scan = await Scan.create({
      user: req.user.id,
      targetUrl: sanitizedUrl,
      notes: notes || '',
      results: executedResults,
    });

    res.status(201).json(scan);
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
