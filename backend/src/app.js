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
//
// Rejection must NOT throw. Browsers attach an `Origin` header to same-origin
// POST/PUT/DELETE requests too, so throwing here turned every login / contact /
// transfer submit on the live site into a 500 whenever CORS_ORIGIN did not
// exactly match the public origin. Answering with `cb(null, false)` simply
// omits the CORS response headers: same-origin calls (which is how the site
// talks to the API, through the nginx/Vite proxy) keep working, while genuine
// cross-origin reads are still blocked by the browser.
const warnedOrigins = new Set();

app.use(
  cors({
    origin(origin, cb) {
      // No Origin header: same-origin GET, server-to-server, curl, health checks.
      if (!origin) return cb(null, true);
      if (config.corsOrigins.includes(origin)) return cb(null, true);

      // Log each unknown origin once — this is almost always a CORS_ORIGIN typo.
      if (!warnedOrigins.has(origin)) {
        warnedOrigins.add(origin);
        // eslint-disable-next-line no-console
        console.warn(
          `[cors] Origin not in CORS_ORIGIN: ${origin} (allowed: ${config.corsOrigins.join(', ') || 'none'})`,
        );
      }
      return cb(null, false);
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
