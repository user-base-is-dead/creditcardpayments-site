'use strict';

const http = require('http');

const app = require('./app');
const config = require('./config/env');
const { initSocket } = require('./realtime/socket');

const server = http.createServer(app);

// Attach realtime (Socket.io) to the same HTTP server.
initSocket(server);

// Only pass a bind address when HOST is explicitly set; otherwise call
// listen(port) exactly as before so an existing deployment is unaffected.
const listenArgs = config.host ? [config.port, config.host] : [config.port];

server.listen(...listenArgs, () => {
  const shown = config.host || 'localhost';
  // eslint-disable-next-line no-console
  console.log(`\n  CreditCardPay API listening on http://${shown}:${config.port}`);
  // eslint-disable-next-line no-console
  console.log(`  Environment : ${config.env}`);
  // eslint-disable-next-line no-console
  console.log(
    `  Reachable   : ${
      config.host === '127.0.0.1'
        ? 'this machine only (via the nginx proxy)'
        : `all interfaces — make sure the firewall blocks :${config.port}, or set HOST=127.0.0.1`
    }`,
  );
  // eslint-disable-next-line no-console
  console.log(`  CORS origins: ${config.corsOrigins.join(', ')}`);
  // eslint-disable-next-line no-console
  console.log(`  Socket.io   : ws://${shown}:${config.port} (path /socket.io)\n`);
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
