const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { put, get, TABLES } = require('../services/dynamodb');

const JWT_SECRET = process.env.JWT_SECRET || 'urbanmove-dev-secret';
const TOKEN_EXPIRY = '8h';

// In-memory user store for dev (replaced by Cognito in prod)
const DEMO_USERS = [
  { userId: 'admin-001', email: 'admin@urbanmove.io', password: 'Admin@123', role: 'Admin', name: 'System Admin' },
  { userId: 'op-001', email: 'operator@urbanmove.io', password: 'Operator@123', role: 'Operator', name: 'Fleet Operator' },
  { userId: 'viewer-001', email: 'viewer@urbanmove.io', password: 'Viewer@123', role: 'Viewer', name: 'Dashboard Viewer' },
];

const generateTokens = (user) => {
  const payload = { userId: user.userId, email: user.email, role: user.role, name: user.name };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  const refreshToken = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken, expiresIn: 28800 };
};

// POST /auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const user = DEMO_USERS.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const tokens = generateTokens(user);
  return res.json({
    message: 'Login successful',
    user: { userId: user.userId, email: user.email, name: user.name, role: user.role },
    ...tokens,
  });
});

// POST /auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().notEmpty(),
  body('role').optional().isIn(['Admin', 'Operator', 'Viewer']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password, name, role = 'Operator' } = req.body;
  const userId = uuidv4();

  const newUser = {
    userId,
    email,
    name,
    role,
    createdAt: Date.now(),
    status: 'active',
  };

  try {
    await put(TABLES.VEHICLES, { ...newUser, pk: `USER#${userId}` }); // Store in a shared table for demo
    const tokens = generateTokens({ ...newUser, password });
    return res.status(201).json({
      message: 'User registered successfully',
      user: { userId, email, name, role },
      ...tokens,
    });
  } catch (err) {
    console.error('[Register]', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const user = DEMO_USERS.find((u) => u.userId === decoded.userId) || { userId: decoded.userId, role: 'Operator', email: '', name: '' };
    const tokens = generateTokens(user);
    return res.json(tokens);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// GET /auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
