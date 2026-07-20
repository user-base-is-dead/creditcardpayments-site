'use strict';

const crypto = require('crypto');

const config = require('../config/env');
const { collection } = require('../lib/store');
const { signToken } = require('../lib/jwt');
const { badRequest, unauthorized, notFound } = require('../lib/errors');
const { emitToRooms } = require('../realtime/socket');

const users = () => collection('users');
const transfers = () => collection('transfers');
const contacts = () => collection('contact_messages');

/** Constant-time compare to avoid trivial timing leaks on credentials. */
function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Strip secrets before returning a user to the admin UI. */
function publicUser(u) {
  return { id: u.id, name: u.name, phone: u.phone, createdAt: u.createdAt };
}

function byNewest(a, b) {
  return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
}

/**
 * POST /api/admin/login  Body: { username, password }
 * Validates against env credentials and issues an admin-role JWT.
 */
async function login(req, res, next) {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    if (!username || !password) throw badRequest('Enter username and password.');

    const okUser = safeEqual(username, config.admin.username);
    const okPass = Boolean(config.admin.password) && safeEqual(password, config.admin.password);
    if (!okUser || !okPass) throw unauthorized('Invalid admin credentials.');

    const token = signToken({ sub: 'admin', role: 'admin', username });
    res.json({ token, admin: { username } });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/stats — aggregate counts and volumes. */
function stats(_req, res) {
  const allTransfers = transfers().all();
  const round2 = (n) => Math.round(n * 100) / 100;
  const totalVolume = allTransfers.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalFees = allTransfers.reduce((s, t) => s + (Number(t.fee) || 0), 0);
  const completedTransfers = allTransfers.filter((t) => t.status === 'completed').length;

  res.json({
    users: users().all().length,
    transfers: allTransfers.length,
    completedTransfers,
    contacts: contacts().all().length,
    totalVolume: round2(totalVolume),
    totalFees: round2(totalFees),
  });
}

/** GET /api/admin/users */
function listUsers(_req, res) {
  res.json({ users: users().all().map(publicUser).sort(byNewest) });
}

/** GET /api/admin/transfers */
function listTransfers(_req, res) {
  res.json({ transfers: transfers().all().sort(byNewest) });
}

/** GET /api/admin/contacts */
function listContacts(_req, res) {
  res.json({ contacts: contacts().all().sort(byNewest) });
}

/** Notify the waiting client (and any subscribed sockets) of the decision. */
function notifyDecision(transfer, status, extra = {}) {
  const rooms = [`transfer:${transfer.id}`];
  if (transfer.userId) rooms.push(`user:${transfer.userId}`);
  emitToRooms(rooms, 'transfer:decision', {
    transferId: transfer.id,
    referenceId: transfer.referenceId,
    status,
    ...extra,
  });
}

/** POST /api/admin/transfers/:id/approve — move to otp_pending (bank sends 3D OTP to user). */
async function approveTransfer(req, res, next) {
  try {
    const t = transfers().find((x) => x.id === req.params.id);
    if (!t) throw notFound('Transfer not found.');
    if (t.status !== 'pending') throw badRequest('Only pending transfers can be approved.');

    const now = new Date().toISOString();
    const updated = await transfers().update(t.id, {
      status: 'otp_pending',
      stepKey: 'otp_pending',
      approvedBy: req.admin.username,
      approvedAt: now,
    });
    notifyDecision(updated, 'otp_pending');
    res.json({ transfer: updated });
  } catch (err) {
    next(err);
  }
}

/** POST /api/admin/transfers/:id/reject — decline a pending transfer. Body: { reason? } */
async function rejectTransfer(req, res, next) {
  try {
    const t = transfers().find((x) => x.id === req.params.id);
    if (!t) throw notFound('Transfer not found.');
    const reason =
      String((req.body && req.body.reason) || '').trim().slice(0, 300) || 'Declined by admin.';
    const updated = await transfers().update(t.id, {
      status: 'rejected',
      stepKey: 'rejected',
      rejectedBy: req.admin.username,
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason,
    });
    notifyDecision(updated, 'rejected', { reason });
    res.json({ transfer: updated });
  } catch (err) {
    next(err);
  }
}

/** POST /api/admin/transfers/:id/complete — mark a processing transfer as completed. */
async function completeTransfer(req, res, next) {
  try {
    const t = transfers().find((x) => x.id === req.params.id);
    if (!t) throw notFound('Transfer not found.');
    const now = new Date().toISOString();
    const updated = await transfers().update(t.id, {
      status: 'completed',
      stepKey: 'completed',
      completedBy: req.admin.username,
      completedAt: now,
    });
    notifyDecision(updated, 'completed');
    res.json({ transfer: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  stats,
  listUsers,
  listTransfers,
  listContacts,
  approveTransfer,
  rejectTransfer,
  completeTransfer,
};
