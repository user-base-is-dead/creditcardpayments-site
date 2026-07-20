'use strict';

const crypto = require('crypto');

const { collection } = require('../lib/store');
const { badRequest } = require('../lib/errors');
const { NAME_REGEX, EMAIL_REGEX } = require('../lib/validators');

const messages = () => collection('contact_messages');

/**
 * POST /api/contact
 * Body: { name, email, subject, message }
 */
async function submitContact(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim();
    const subject = String(req.body.subject || '').trim();
    const message = String(req.body.message || '').trim();

    const fieldErrors = {};
    if (name.length < 2 || !NAME_REGEX.test(name)) fieldErrors.name = 'Enter a valid name.';
    if (!EMAIL_REGEX.test(email)) fieldErrors.email = 'Enter a valid email address.';
    if (subject.length < 2) fieldErrors.subject = 'Enter a subject.';
    if (message.length < 5) fieldErrors.message = 'Enter a message (min. 5 characters).';

    if (Object.keys(fieldErrors).length > 0) {
      throw badRequest('Please fix the highlighted fields.', fieldErrors);
    }

    const record = {
      id: crypto.randomUUID(),
      name,
      email,
      subject,
      // Cap stored message length defensively.
      message: message.slice(0, 5000),
      createdAt: new Date().toISOString(),
    };
    await messages().insert(record);

    res.status(201).json({ ok: true, id: record.id });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitContact };
