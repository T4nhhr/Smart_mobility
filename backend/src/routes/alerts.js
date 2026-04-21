const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { put, scan, update, TABLES } = require('../services/dynamodb');

// GET /alerts – List alerts
router.get('/', authenticate, async (req, res) => {
  try {
    const { severity, status, vehicleId, limit = 100 } = req.query;
    const filterExprs = [];
    const names = {};
    const values = {};

    if (severity) { filterExprs.push('#sev = :sev'); names['#sev'] = 'severity'; values[':sev'] = severity; }
    if (status) { filterExprs.push('#st = :st'); names['#st'] = 'status'; values[':st'] = status; }
    if (vehicleId) { filterExprs.push('vehicleId = :vid'); values[':vid'] = vehicleId; }

    const params = {
      Limit: parseInt(limit),
      ...(filterExprs.length && {
        FilterExpression: filterExprs.join(' AND '),
        ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
        ExpressionAttributeValues: values,
      }),
    };

    const result = await scan(TABLES.ALERTS, params);
    const alerts = (result.Items || []).sort((a, b) => b.createdAt - a.createdAt);
    res.json({ alerts, count: alerts.length });
  } catch (err) {
    console.error('[Alerts GET]', err);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// POST /alerts – Create alert
router.post('/', [
  body('vehicleId').notEmpty(),
  body('type').isIn(['speeding', 'geofence', 'fuel_low', 'engine_fault', 'offline', 'congestion', 'accident']),
  body('severity').isIn(['low', 'medium', 'high', 'critical']),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const alert = {
    alertId: uuidv4(),
    vehicleId: req.body.vehicleId,
    type: req.body.type,
    severity: req.body.severity,
    message: req.body.message,
    lat: req.body.lat,
    lng: req.body.lng,
    zone: req.body.zone,
    status: 'open',
    createdAt: Date.now(),
  };

  try {
    await put(TABLES.ALERTS, alert);
    res.status(201).json({ message: 'Alert created', alert });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// PUT /alerts/:id/acknowledge
router.put('/:id/acknowledge', authenticate, async (req, res) => {
  try {
    const result = await update(TABLES.ALERTS, {
      Key: { alertId: req.params.id },
      UpdateExpression: 'SET #st = :st, acknowledgedAt = :aat, acknowledgedBy = :aby',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: {
        ':st': 'acknowledged',
        ':aat': Date.now(),
        ':aby': req.user.userId,
      },
      ReturnValues: 'ALL_NEW',
    });
    res.json({ message: 'Alert acknowledged', alert: result.Attributes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// PUT /alerts/:id/resolve
router.put('/:id/resolve', authenticate, async (req, res) => {
  try {
    const result = await update(TABLES.ALERTS, {
      Key: { alertId: req.params.id },
      UpdateExpression: 'SET #st = :st, resolvedAt = :rat, resolvedBy = :rby',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: {
        ':st': 'resolved',
        ':rat': Date.now(),
        ':rby': req.user.userId,
      },
      ReturnValues: 'ALL_NEW',
    });
    res.json({ message: 'Alert resolved', alert: result.Attributes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

module.exports = router;
