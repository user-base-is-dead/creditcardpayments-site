'use strict';

const path = require('path');
const dotenv = require('dotenv');

// Load .env from the backend root (one level up from src/config).
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

function parseOrigins(raw) {
  if (!raw) return ['http://localhost:5173'];
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

const NODE_ENV = process.env.NODE_ENV || 'development';

const JWT_SECRET =
  process.env.JWT_SECRET || (NODE_ENV === 'production' ? '' : 'dev-only-change-me');

if (NODE_ENV === 'production' && (!JWT_SECRET || JWT_SECRET.length < 16)) {
  // Fail fast in production rather than signing tokens with a weak/empty secret.
  throw new Error('JWT_SECRET must be set to a strong value in production.');
}

const config = {
  env: NODE_ENV,
  isProd: NODE_ENV === 'production',
  port: Number(process.env.PORT) || 4000,
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN),
  jwt: {
    secret: JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || (NODE_ENV === 'production' ? '' : 'admin123'),
  },
};

if (config.isProd && !config.admin.password) {
  // Never allow a blank/default admin password in production.
  throw new Error('ADMIN_PASSWORD must be set to a strong value in production.');
}

module.exports = config;
