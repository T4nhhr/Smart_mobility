const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const { put, get, scan, TABLES } = require('../services/dynamodb');

// Ho Chi Minh City zones and their coordinates
const ZONES = {
  Downtown: { lat: 10.7769, lng: 106.7009, congestion: 'high' },
  'District 2': { lat: 10.8007, lng: 106.7323, congestion: 'medium' },
  'District 7': { lat: 10.7331, lng: 106.7233, congestion: 'low' },
  'Binh Thanh': { lat: 10.8120, lng: 106.7111, congestion: 'medium' },
  'Tan Binh': { lat: 10.8014, lng: 106.6521, congestion: 'high' },
};

const getDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// GET /routes/recommend – Route recommendations
router.get('/recommend', authenticate, async (req, res) => {
  const { originLat, originLng, destLat, destLng } = req.query;

  if (!originLat || !originLng || !destLat || !destLng) {
    return res.status(400).json({ error: 'originLat, originLng, destLat, destLng required' });
  }

  const oLat = parseFloat(originLat), oLng = parseFloat(originLng);
  const dLat = parseFloat(destLat), dLng = parseFloat(destLng);
  const directDistance = getDistance(oLat, oLng, dLat, dLng);

  // Simulated route recommendations
  const routes = [
    {
      routeId: uuidv4(),
      name: 'Fastest Route',
      distance: directDistance * 1.1,
      estimatedTime: Math.round(directDistance * 1.1 * 3), // ~3 min/km
      congestionLevel: 'medium',
      toll: false,
      waypoints: [
        { lat: oLat, lng: oLng },
        { lat: (oLat + dLat) / 2 + 0.005, lng: (oLng + dLng) / 2 },
        { lat: dLat, lng: dLng },
      ],
    },
    {
      routeId: uuidv4(),
      name: 'Eco Route',
      distance: directDistance * 1.3,
      estimatedTime: Math.round(directDistance * 1.3 * 4),
      congestionLevel: 'low',
      toll: false,
      waypoints: [
        { lat: oLat, lng: oLng },
        { lat: (oLat + dLat) / 2 - 0.005, lng: (oLng + dLng) / 2 - 0.003 },
        { lat: dLat, lng: dLng },
      ],
    },
    {
      routeId: uuidv4(),
      name: 'Highway Route',
      distance: directDistance * 1.2,
      estimatedTime: Math.round(directDistance * 1.2 * 2),
      congestionLevel: 'low',
      toll: true,
      tollCost: 5000,
      waypoints: [
        { lat: oLat, lng: oLng },
        { lat: (oLat + dLat) / 2, lng: (oLng + dLng) / 2 + 0.005 },
        { lat: dLat, lng: dLng },
      ],
    },
  ];

  res.json({ origin: { lat: oLat, lng: oLng }, destination: { lat: dLat, lng: dLng }, routes });
});

// POST /routes/calculate – Save a planned route
router.post('/calculate', authenticate, async (req, res) => {
  const { vehicleId, origin, destination, selectedRouteId, routeData } = req.body;
  if (!vehicleId || !origin || !destination) {
    return res.status(400).json({ error: 'vehicleId, origin, destination required' });
  }

  const route = {
    routeId: uuidv4(),
    vehicleId,
    origin,
    destination,
    selectedRouteId,
    routeData,
    status: 'planned',
    createdAt: Date.now(),
    createdBy: req.user.userId,
  };

  try {
    await put(TABLES.ROUTES, route);
    res.status(201).json({ message: 'Route saved', route });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save route' });
  }
});

// GET /routes – List saved routes
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await scan(TABLES.ROUTES, { Limit: 100 });
    res.json({ routes: result.Items || [], count: result.Count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

module.exports = router;
