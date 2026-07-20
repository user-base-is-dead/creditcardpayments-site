'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const config = require('../config/env');
const { collection } = require('../lib/store');
const { signToken } = require('../lib/jwt');
const { badRequest, conflict, unauthorized } = require('../lib/errors');
const {
  PHONE_REGEX,
  NAME_REGEX,
  MIN_PASSWORD_LENGTH,
  normalizePhone,
} = require('../lib/validators');

const users = () => collection('users');

/** Strip secrets before sending a user object to the client. */
function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    createdAt: user.createdAt,
  };
}

/**
 * POST /api/auth/register
 * Body: { name, phone, password }
 * Phone-based signup — no OTP step.
 */
async function register(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();
    const phone = normalizePhone(req.body.phone);
    const password = String(req.body.password || '');

    const fieldErrors = {};
    if (name.length < 2 || !NAME_REGEX.test(name)) {
      fieldErrors.name = 'Enter a valid full name (letters only, min. 2 characters).';
    }
    if (!PHONE_REGEX.test(phone)) {
      fieldErrors.phone = 'Enter a valid 10-digit mobile number starting with 6-9.';
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      fieldErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (Object.keys(fieldErrors).length > 0) {
      throw badRequest('Please fix the highlighted fields.', fieldErrors);
    }

    if (users().find((u) => u.phone === phone)) {
      throw conflict('An account with this mobile number already exists.');
    }

    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
    const now = new Date().toISOString();
    const user = {
      id: crypto.randomUUID(),
      name,
      phone,
      passwordHash,
      createdAt: now,
    };
    await users().insert(user);

    const token = signToken({ sub: user.id, phone: user.phone });
    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Body: { phone, password }
 * Phone-based login — no OTP step.
 */
async function login(req, res, next) {
  try {
    const phone = normalizePhone(req.body.phone);
    const password = String(req.body.password || '');

    if (!PHONE_REGEX.test(phone) || password.length === 0) {
      throw badRequest('Enter your mobile number and password.');
    }

    const user = users().find((u) => u.phone === phone);
    // Always run a compare to reduce user-enumeration timing differences.
    const hash = user ? user.passwordHash : '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidin';
    const ok = await bcrypt.compare(password, hash);

    if (!user || !ok) {
      throw unauthorized('Invalid mobile number or password.');
    }

    const token = signToken({ sub: user.id, phone: user.phone });
    res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me  (requires auth)
 * Returns the current user's public profile.
 */
async function me(req, res, next) {
  try {
    const user = users().find((u) => u.id === req.user.id);
    if (!user) throw unauthorized('Account no longer exists.');
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
