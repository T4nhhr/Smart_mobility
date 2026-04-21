const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { scan, TABLES } = require('../services/dynamodb');

// GET /analytics/summary – Platform-wide KPIs
router.get('/summary', authenticate, async (req, res) => {
  try {
    const [vehiclesRes, telemetryRes, alertsRes] = await Promise.all([
      scan(TABLES.VEHICLES),
      scan(TABLES.TELEMETRY, { Limit: 500 }),
      scan(TABLES.ALERTS),
    ]);

    const vehicles = (vehiclesRes.Items || []).filter(v => !v.pk);
    const telemetry = telemetryRes.Items || [];
    const alerts = alertsRes.Items || [];

    const activeVehicles = vehicles.filter(v => v.status === 'active').length;
    const avgSpeed = telemetry.length
      ? Math.round(telemetry.reduce((s, t) => s + (t.speed || 0), 0) / telemetry.length)
      : 0;
    const openAlerts = alerts.filter(a => a.status === 'open').length;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status === 'open').length;

    // Zone distribution
    const zoneCount = {};
    vehicles.forEach(v => {
      if (v.zone) zoneCount[v.zone] = (zoneCount[v.zone] || 0) + 1;
    });

    res.json({
      totalVehicles: vehicles.length,
      activeVehicles,
      avgSpeed,
      openAlerts,
      criticalAlerts,
      totalTelemetryRecords: telemetry.length,
      zoneDistribution: Object.entries(zoneCount).map(([zone, count]) => ({ zone, count })),
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('[Analytics Summary]', err);
    res.status(500).json({ error: 'Failed to compute summary' });
  }
});

// GET /analytics/congestion – Congestion index per zone
router.get('/congestion', authenticate, async (req, res) => {
  try {
    const telemetryRes = await scan(TABLES.TELEMETRY, { Limit: 1000 });
    const telemetry = telemetryRes.Items || [];

    const zoneData = {};
    telemetry.forEach(t => {
      const zone = t.zone || 'Unknown';
      if (!zoneData[zone]) zoneData[zone] = { speeds: [], count: 0 };
      zoneData[zone].speeds.push(t.speed || 0);
      zoneData[zone].count++;
    });

    const congestion = Object.entries(zoneData).map(([zone, data]) => {
      const avgSpeed = data.speeds.reduce((s, v) => s + v, 0) / data.speeds.length;
      const congestionIndex = Math.max(0, Math.min(100, 100 - avgSpeed * 1.5));
      return {
        zone,
        avgSpeed: Math.round(avgSpeed),
        congestionIndex: Math.round(congestionIndex),
        vehicleCount: data.count,
        level: congestionIndex > 70 ? 'high' : congestionIndex > 40 ? 'medium' : 'low',
      };
    });

    res.json({ congestion, timestamp: Date.now() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute congestion' });
  }
});

// GET /analytics/utilization – Fleet utilization metrics
router.get('/utilization', authenticate, async (req, res) => {
  try {
    const [vehiclesRes, telemetryRes] = await Promise.all([
      scan(TABLES.VEHICLES),
      scan(TABLES.TELEMETRY, { Limit: 1000 }),
    ]);

    const vehicles = (vehiclesRes.Items || []).filter(v => !v.pk);
    const telemetry = telemetryRes.Items || [];

    // Group telemetry by hour (last 24h)
    const now = Date.now();
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now - (23 - i) * 3600000);
      const label = `${hour.getHours().toString().padStart(2, '0')}:00`;
      const start = now - (23 - i) * 3600000;
      const end = start + 3600000;
      const records = telemetry.filter(t => t.timestamp >= start && t.timestamp < end);
      const uniqueVehicles = new Set(records.map(r => r.vehicleId)).size;
      return { hour: label, vehicleCount: uniqueVehicles, recordCount: records.length };
    });

    const utilizationRate = vehicles.length
      ? Math.round((vehicles.filter(v => v.status === 'active').length / vehicles.length) * 100)
      : 0;

    res.json({ utilizationRate, hourlyData, totalVehicles: vehicles.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute utilization' });
  }
});

// GET /analytics/speed-trends – Speed over time
router.get('/speed-trends', authenticate, async (req, res) => {
  try {
    const telemetryRes = await scan(TABLES.TELEMETRY, { Limit: 500 });
    const telemetry = (telemetryRes.Items || []).sort((a, b) => a.timestamp - b.timestamp);

    const now = Date.now();
    const trends = Array.from({ length: 12 }, (_, i) => {
      const start = now - (11 - i) * 300000; // 5 min intervals
      const end = start + 300000;
      const slice = telemetry.filter(t => t.timestamp >= start && t.timestamp < end);
      const avg = slice.length ? Math.round(slice.reduce((s, t) => s + (t.speed || 0), 0) / slice.length) : 0;
      return { time: new Date(start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), avgSpeed: avg, count: slice.length };
    });

    res.json({ trends });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute speed trends' });
  }
});

module.exports = router;
