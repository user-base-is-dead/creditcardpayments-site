'use strict';

const { Server } = require('socket.io');
const config = require('../config/env');
const { verifyToken } = require('../lib/jwt');

let io = null;

/**
 * Attach a Socket.io server to the given HTTP server.
 *
 * Auth model:
 *  - A JWT may be provided via `socket.handshake.auth.token`.
 *  - If valid, the socket is associated with the user and joins room `user:<id>`.
 *  - Connections without a token are still allowed (anonymous), so the public
 *    money-transfer / swipe simulator can receive live status by subscribing to
 *    a specific transfer room.
 */
function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: config.corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Optional authentication — never rejects, just annotates the socket.
  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next();
    try {
      const decoded = verifyToken(token);
      socket.data.userId = decoded.sub;
      socket.data.phone = decoded.phone;
    } catch {
      // Ignore a bad/expired token; treat as anonymous rather than failing.
    }
    next();
  });

  io.on('connection', (socket) => {
    if (socket.data.userId) {
      socket.join(`user:${socket.data.userId}`);
    }

    // Client asks to receive live updates for a given transfer.
    socket.on('transfer:subscribe', (payload = {}) => {
      const transferId = String(payload.transferId || '').trim();
      if (transferId) socket.join(`transfer:${transferId}`);
    });

    socket.on('transfer:unsubscribe', (payload = {}) => {
      const transferId = String(payload.transferId || '').trim();
      if (transferId) socket.leave(`transfer:${transferId}`);
    });

    socket.on('disconnect', () => {
      /* rooms are cleaned up automatically by socket.io */
    });
  });

  return io;
}

function getIO() {
  return io;
}

/** Emit an event to everyone subscribed to a specific transfer. */
function emitToTransfer(transferId, event, payload) {
  if (io) io.to(`transfer:${transferId}`).emit(event, payload);
}

/** Emit an event to a specific authenticated user's room. */
function emitToUser(userId, event, payload) {
  if (io && userId) io.to(`user:${userId}`).emit(event, payload);
}

/**
 * Emit an event to the UNION of the given rooms in a single call.
 * Socket.io de-duplicates delivery, so a socket that belongs to more than one
 * of the rooms still receives the event exactly once.
 */
function emitToRooms(rooms, event, payload) {
  if (!io) return;
  const list = (Array.isArray(rooms) ? rooms : [rooms]).filter(Boolean);
  if (list.length === 0) return;
  let chain = io.to(list[0]);
  for (let i = 1; i < list.length; i += 1) chain = chain.to(list[i]);
  chain.emit(event, payload);
}

module.exports = { initSocket, getIO, emitToTransfer, emitToUser, emitToRooms };
