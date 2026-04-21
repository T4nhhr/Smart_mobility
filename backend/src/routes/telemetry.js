const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { put, query: dbQuery, update, TABLES } = require('../services/dynamodb');
const { publishTelemetry } = require('../services/kinesis');

// POST /telemetry – Ingest telemetry event
router.post('/', async (req, res) => {
  // Telemetry ingestion doesn't require auth (vehicle devices use API keys in prod)
  const { vehicleId, lat, lng, speed, heading, fuelLevel, zone, timestamp } = req.body;

  if (!vehicleId || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'vehicleId, lat, and lng are required' });
  }

  const record = {
    vehicleId,
    timestamp: timestamp || Date.now(),
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    speed: parseFloat(speed) || 0,
    heading: parseFloat(heading) || 0,
    fuelLevel: parseFloat(fuelLevel) || 100,
    zone: zone || 'Unknown',
    recordId: uuidv4(),
  };

  try {
    // Write to DynamoDB
    await put(TABLES.TELEMETRY, record);

    // Also publish to Kinesis for stream processing
    await publishTelemetry(vehicleId, record);

    // Update vehicle's last known position
    await update(TABLES.VEHICLES, {
      Key: { vehicleId },
      UpdateExpression: 'SET lat = :lat, lng = :lng, speed = :speed, heading = :heading, fuelLevel = :fl, updatedAt = :ua',
      ExpressionAttributeValues: {
        ':lat': record.lat,
        ':lng': record.lng,
        ':speed': record.speed,
        ':heading': record.heading,
        ':fl': record.fuelLevel,
        ':ua': Date.now(),
      },
    }).catch(() => {}); // Best-effort vehicle update

    res.status(202).json({ message: 'Telemetry accepted', recordId: record.recordId });
  } catch (err) {
    console.error('[Telemetry POST]', err);
    res.status(500).json({ error: 'Failed to ingest telemetry' });
  }
});

// GET /telemetry/:vehicleId – Query telemetry history
router.get('/:vehicleId', authenticate, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { from, to, limit = 100 } = req.query;

    const params = {
      KeyConditionExpression: 'vehicleId = :vid' + (from || to ? ' AND #ts BETWEEN :from AND :to' : ''),
      ExpressionAttributeValues: {
        ':vid': vehicleId,
        ...(from && to && {
          ':from': parseInt(from),
          ':to': parseInt(to),
        }),
      },
      ...(from || to ? { ExpressionAttributeNames: { '#ts': 'timestamp' } } : {}),
      ScanIndexForward: false,
      Limit: Math.min(parseInt(limit), 500),
    };

    const result = await dbQuery(TABLES.TELEMETRY, params);
    res.json({ vehicleId, records: result.Items || [], count: result.Count });
  } catch (err) {
    console.error('[Telemetry GET]', err);
    res.status(500).json({ error: 'Failed to fetch telemetry' });
  }
});

// GET /telemetry – Latest telemetry for all vehicles (dashboard)
router.get('/', authenticate, async (req, res) => {
  try {
    const { limit = 200 } = req.query;
    const { scan } = require('../services/dynamodb');
    const result = await scan(TABLES.TELEMETRY, {
      Limit: parseInt(limit),
    });
    res.json({ records: result.Items || [], count: result.Count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch telemetry' });
  }
});

module.exports = router;
