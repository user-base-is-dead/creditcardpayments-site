'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');

const { submitContact } = require('../controllers/contact.controller');

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages. Please try again shortly.' },
});

router.post('/', contactLimiter, submitContact);

module.exports = router;
