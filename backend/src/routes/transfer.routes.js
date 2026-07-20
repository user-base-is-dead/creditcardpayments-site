'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');

const { createTransfer, getTransfer, verifyOtp, getMyTransfers } = require('../controllers/transfer.controller');
const { optionalAuth, requireAuth } = require('../middleware/auth');

const router = express.Router();

const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many transfer attempts. Please try again shortly.' },
});

router.post('/', createLimiter, optionalAuth, createTransfer);
router.get('/my', requireAuth, getMyTransfers);
router.get('/:id', optionalAuth, getTransfer);
router.post('/:id/verify-otp', optionalAuth, verifyOtp);

module.exports = router;
