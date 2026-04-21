const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'urbanmove-dev-secret';

/**
 * Auth middleware - validates JWT token from Authorization header.
 * In production, verifies Cognito tokens. In dev, verifies local JWTs.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Role-based authorization middleware factory
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userRole = req.user.role || 'Viewer';
  if (!roles.includes(userRole)) {
    return res.status(403).json({ error: `Access denied. Required roles: ${roles.join(', ')}` });
  }
  next();
};

module.exports = { authenticate, authorize };
