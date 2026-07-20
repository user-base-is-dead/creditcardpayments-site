'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');

/** Sign a JWT for the given user id + phone. */
function signToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

/** Verify a JWT and return its decoded payload, or throw. */
function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

module.exports = { signToken, verifyToken };
