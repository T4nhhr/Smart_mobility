const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { body, query, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { put, get, scan, update, remove, TABLES } = require('../services/dynamodb');

// GET /vehicles – List all vehicles (paginated)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, limit = 50, lastKey } = req.query;
    const params = {
      Limit: parseInt(limit),
      ...(status && {
        FilterExpression: '#s = :status',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':status': status },
      }),
      ...(lastKey && { ExclusiveStartKey: JSON.parse(Buffer.from(lastKey, 'base64').toString()) }),
    };

    const result = await scan(TABLES.VEHICLES, params);
    const vehicles = (result.Items || []).filter(v => !v.pk); // exclude user records

    res.json({
      vehicles,
      count: vehicles.length,
      nextKey: result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : null,
    });
  } catch (err) {
    console.error('[Vehicles GET]', err);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// GET /vehicles/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await get(TABLES.VEHICLES, { vehicleId: req.params.id });
    if (!result.Item) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(result.Item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

// POST /vehicles – Register new vehicle
router.post('/', authenticate, authorize('Admin', 'Operator'), [
  body('plateNumber').trim().notEmpty(),
  body('type').isIn(['bus', 'truck', 'van', 'motorcycle', 'car']),
  body('driverName').trim().notEmpty(),
  body('zone').optional().isString(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const vehicleId = uuidv4();
  const vehicle = {
    vehicleId,
    plateNumber: req.body.plateNumber,
    type: req.body.type,
    driverName: req.body.driverName,
    zone: req.body.zone || 'Downtown',
    status: 'active',
    lat: 10.7769 + (Math.random() - 0.5) * 0.1,
    lng: 106.7009 + (Math.random() - 0.5) * 0.1,
    speed: 0,
    heading: 0,
    fuelLevel: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: req.user.userId,
  };

  try {
    await put(TABLES.VEHICLES, vehicle);
    res.status(201).json({ message: 'Vehicle registered', vehicle });
  } catch (err) {
    console.error('[Vehicle POST]', err);
    res.status(500).json({ error: 'Failed to register vehicle' });
  }
});

// PUT /vehicles/:id – Update vehicle
router.put('/:id', authenticate, authorize('Admin', 'Operator'), async (req, res) => {
  try {
    const { plateNumber, type, driverName, zone, status } = req.body;
    const updateExpressions = [];
    const names = {};
    const values = { ':updatedAt': Date.now() };

    if (plateNumber) { updateExpressions.push('#pn = :pn'); names['#pn'] = 'plateNumber'; values[':pn'] = plateNumber; }
    if (type) { updateExpressions.push('#t = :t'); names['#t'] = 'type'; values[':t'] = type; }
    if (driverName) { updateExpressions.push('#dn = :dn'); names['#dn'] = 'driverName'; values[':dn'] = driverName; }
    if (zone) { updateExpressions.push('#z = :z'); names['#z'] = 'zone'; values[':z'] = zone; }
    if (status) { updateExpressions.push('#s = :s'); names['#s'] = 'status'; values[':s'] = status; }
    updateExpressions.push('updatedAt = :updatedAt');

    const result = await update(TABLES.VEHICLES, {
      Key: { vehicleId: req.params.id },
      UpdateExpression: 'SET ' + updateExpressions.join(', '),
      ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    });

    res.json({ message: 'Vehicle updated', vehicle: result.Attributes });
  } catch (err) {
    console.error('[Vehicle PUT]', err);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// DELETE /vehicles/:id – Deactivate vehicle
router.delete('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    await update(TABLES.VEHICLES, {
      Key: { vehicleId: req.params.id },
      UpdateExpression: 'SET #s = :s, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'deactivated', ':updatedAt': Date.now() },
    });
    res.json({ message: 'Vehicle deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to deactivate vehicle' });
  }
});

module.exports = router;
