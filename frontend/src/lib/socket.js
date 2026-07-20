// Socket.io client helper for realtime transfer status.
//
// Connects to the same origin by default (Vite proxies /socket.io to the
// backend in dev). Set VITE_API_URL to target another host in production.

import { io } from 'socket.io-client';
import { getToken } from './api';

const SOCKET_URL = import.meta.env.VITE_API_URL || undefined;

let socket = null;

export function getSocket() {
  if (!socket) {
    const options = {
      autoConnect: true,
      // Re-read the token on every (re)connection attempt.
      auth: (cb) => {
        const token = getToken();
        cb(token ? { token } : {});
      },
    };
    socket = SOCKET_URL ? io(SOCKET_URL, options) : io(options);
  }
  return socket;
}

/**
 * Subscribe to realtime updates for a single transfer.
 * Returns an unsubscribe function that removes listeners and leaves the room.
 */
export function subscribeToTransfer(transferId, { onStatus, onCompleted } = {}) {
  const s = getSocket();

  const handleStatus = (payload) => {
    if (payload && payload.transferId === transferId && onStatus) onStatus(payload);
  };
  const handleCompleted = (payload) => {
    if (payload && payload.transferId === transferId && onCompleted) onCompleted(payload);
  };
  const emitSubscribe = () => s.emit('transfer:subscribe', { transferId });

  s.on('transfer:status', handleStatus);
  s.on('transfer:completed', handleCompleted);

  if (s.connected) emitSubscribe();
  s.on('connect', emitSubscribe); // re-subscribe after any reconnect

  return () => {
    s.off('transfer:status', handleStatus);
    s.off('transfer:completed', handleCompleted);
    s.off('connect', emitSubscribe);
    s.emit('transfer:unsubscribe', { transferId });
  };
}
