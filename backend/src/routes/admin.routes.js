'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');

const {
  login,
  stats,
  listUsers,
  listTransfers,
  listContacts,
  approveTransfer,
  rejectTransfer,
  completeTransfer,
} = require('../controllers/admin.controller');
const { requireAdmin } = require('../middleware/adminAuth');

const router = express.Router();

// Throttle admin login to slow brute-force attempts.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many admin login attempts. Please try again later.' },
});

router.post('/login', loginLimiter, login);

// Everything below requires a valid admin token.
router.get('/stats', requireAdmin, stats);
router.get('/users', requireAdmin, listUsers);
router.get('/transfers', requireAdmin, listTransfers);
router.get('/contacts', requireAdmin, listContacts);
router.post('/transfers/:id/approve', requireAdmin, approveTransfer);
router.post('/transfers/:id/reject', requireAdmin, rejectTransfer);
router.post('/transfers/:id/complete', requireAdmin, completeTransfer);

module.exports = router;
