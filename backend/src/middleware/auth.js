'use strict';

const { verifyToken } = require('../lib/jwt');
const { unauthorized } = require('../lib/errors');
const { collection } = require('../lib/store');

/**
 * Express middleware: require a valid Bearer JWT.
 * On success attaches `req.user` = { id, phone, name }.
 */
function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw unauthorized('Missing or malformed Authorization header.');
    }

    const decoded = verifyToken(token);
    const user = collection('users').find((u) => u.id === decoded.sub);
    if (!user) throw unauthorized('Account no longer exists.');

    req.user = { id: user.id, phone: user.phone, name: user.name };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(unauthorized('Session expired.'));
    if (err.name === 'JsonWebTokenError') return next(unauthorized('Invalid token.'));
    next(err);
  }
}

/**
 * Express middleware: attach `req.user` if a valid Bearer JWT is present,
 * but never reject. Used for endpoints that work anonymously yet want to
 * link the record to a user when signed in (e.g. money transfers).
 */
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next();
  try {
    const decoded = verifyToken(token);
    const user = collection('users').find((u) => u.id === decoded.sub);
    if (user) req.user = { id: user.id, phone: user.phone, name: user.name };
  } catch {
    /* ignore invalid/expired token — proceed as anonymous */
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
