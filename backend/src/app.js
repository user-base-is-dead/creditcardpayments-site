'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const config = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const contactRoutes = require('./routes/contact.routes');
const transferRoutes = require('./routes/transfer.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Behind a proxy in prod (needed for correct rate-limit IP + secure cookies).
app.set('trust proxy', 1);

// Security headers.
app.use(helmet());

// CORS — only allow the configured frontend origin(s).
app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin / server-to-server / curl (no Origin header).
      if (!origin) return cb(null, true);
      if (config.corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
  }),
);

// Body parsing with a sane size cap.
app.use(express.json({ limit: '100kb' }));

// Request logging (concise in dev).
if (!config.isProd) app.use(morgan('dev'));

// Health check.
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), env: config.env });
});

// Feature routes.
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/admin', adminRoutes);

// 404 + centralized error handling (must be last).
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
