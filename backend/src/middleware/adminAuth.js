'use strict';

const { verifyToken } = require('../lib/jwt');
const { unauthorized } = require('../lib/errors');

/**
 * Express middleware: require a valid admin JWT (role === 'admin').
 * Admin tokens are issued only by POST /api/admin/login.
 */
function requireAdmin(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(unauthorized('Admin authentication required.'));
  }
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') {
      return next(unauthorized('Admin access only.'));
    }
    req.admin = { username: decoded.username || 'admin' };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(unauthorized('Admin session expired.'));
    return next(unauthorized('Invalid admin token.'));
  }
}

module.exports = { requireAdmin };
