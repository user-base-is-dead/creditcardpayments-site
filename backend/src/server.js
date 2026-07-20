'use strict';

const http = require('http');

const app = require('./app');
const config = require('./config/env');
const { initSocket } = require('./realtime/socket');

const server = http.createServer(app);

// Attach realtime (Socket.io) to the same HTTP server.
initSocket(server);

server.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`\n  CreditCardPay API listening on http://localhost:${config.port}`);
  // eslint-disable-next-line no-console
  console.log(`  Environment : ${config.env}`);
  // eslint-disable-next-line no-console
  console.log(`  CORS origins: ${config.corsOrigins.join(', ')}`);
  // eslint-disable-next-line no-console
  console.log(`  Socket.io   : ws://localhost:${config.port} (path /socket.io)\n`);
});

// Graceful shutdown.
function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received — shutting down.`);
  server.close(() => process.exit(0));
  // Force-exit if connections linger.
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = server;
