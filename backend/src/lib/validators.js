'use strict';

// Keep these in sync with the regexes used by the React frontend so the
// client- and server-side validation agree.
const PHONE_REGEX = /^[6-9]\d{9}$/; // Indian 10-digit mobile
const NAME_REGEX = /^[a-zA-Z][a-zA-Z\s.'-]*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UPI_ID_REGEX = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_NUMBER_REGEX = /^\d{9,18}$/;

const MIN_PASSWORD_LENGTH = 8;

/** Normalize a phone value to digits only. */
function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

module.exports = {
  PHONE_REGEX,
  NAME_REGEX,
  EMAIL_REGEX,
  UPI_ID_REGEX,
  IFSC_REGEX,
  ACCOUNT_NUMBER_REGEX,
  MIN_PASSWORD_LENGTH,
  normalizePhone,
  isNonEmptyString,
};
