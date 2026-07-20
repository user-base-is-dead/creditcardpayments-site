'use strict';

/*
 * Smoke test for the CreditCardPay backend.
 * Assumes the server is running on http://localhost:4000.
 * Exits non-zero if any check fails.
 */

const { io } = require('socket.io-client');

const BASE = process.env.BASE || 'http://localhost:4000';
let passed = 0;
let failed = 0;

function check(name, cond, extra = '') {
  if (cond) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name} ${extra}`);
  }
}

async function json(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, data };
}

function randomPhone() {
  // Valid Indian mobile: starts 6-9, total 10 digits.
  let n = '9';
  for (let i = 0; i < 9; i += 1) n += Math.floor(Math.random() * 10);
  return n;
}

async function testTransferApproval(token, adminToken) {
  // Create a transfer — should be stored as "pending" (awaits manual approval).
  const created = await json(
    'POST',
    '/api/transfers',
    {
      transferType: 'cc-bank',
      amount: 25000,
      sender: { fullName: 'Test User', phone: randomPhone(), email: 'test@example.com' },
      recipient: {
        bankName: 'HDFC Bank',
        recipientName: 'Jane Doe',
        ifsc: 'HDFC0001234',
        accountNumber: '123456789012',
        accountType: 'savings',
      },
      card: { brand: 'visa', last4: '4242' },
    },
    token,
  );
  check('POST /api/transfers -> 201', created.status === 201, `(got ${created.status}: ${JSON.stringify(created.data)})`);
  check('new transfer status is pending', created.data && created.data.status === 'pending', `(got ${created.data && created.data.status})`);
  check('POST /api/transfers returns referenceId', created.data && typeof created.data.referenceId === 'string');
  check('POST /api/transfers fee = 0.85%', created.data && Math.abs(created.data.fee - 25000 * 0.0085) < 0.01, `(got ${created.data && created.data.fee})`);
  const id = created.data && created.data.transferId;

  // Status stays pending before approval.
  {
    const { data } = await json('GET', `/api/transfers/${id}`);
    check('transfer status pending before approval', data && data.status === 'pending', `(got ${data && data.status})`);
  }

  // Approve requires an admin token (user token must be rejected).
  {
    const { status } = await json('POST', `/api/admin/transfers/${id}/approve`, {}, token);
    check('approve with user token -> 401', status === 401, `(got ${status})`);
  }

  // Admin approves -> completed.
  {
    const { status } = await json('POST', `/api/admin/transfers/${id}/approve`, {}, adminToken);
    check('admin approve -> 200', status === 200, `(got ${status})`);
    const { data } = await json('GET', `/api/transfers/${id}`);
    check('transfer completed after approval', data && data.status === 'completed', `(got ${data && data.status})`);
  }

  // A second transfer -> admin rejects -> rejected + reason.
  {
    const c2 = await json(
      'POST',
      '/api/transfers',
      {
        transferType: 'cc-upi',
        amount: 15000,
        sender: { fullName: 'Test User', phone: randomPhone(), email: 'test@example.com' },
        recipient: { upiId: 'jane@okhdfc', recipientName: 'Jane Doe' },
        card: { brand: 'rupay', last4: '1111' },
      },
      token,
    );
    const id2 = c2.data && c2.data.transferId;
    const { status } = await json('POST', `/api/admin/transfers/${id2}/reject`, { reason: 'Test decline' }, adminToken);
    check('admin reject -> 200', status === 200, `(got ${status})`);
    const { data } = await json('GET', `/api/transfers/${id2}`);
    check('transfer rejected after reject', data && data.status === 'rejected', `(got ${data && data.status})`);
    check('rejected transfer carries reason', data && data.rejectionReason === 'Test decline', `(got ${data && data.rejectionReason})`);
  }
}

async function main() {
  console.log(`\nSmoke testing ${BASE}\n`);

  // Health
  {
    const { status, data } = await json('GET', '/api/health');
    check('GET /api/health -> 200', status === 200, `(got ${status})`);
    check('health status ok', data && data.status === 'ok');
  }

  const phone = randomPhone();
  const password = 'supersecret1';
  let token = null;

  // Register (phone-based, no OTP)
  {
    const { status, data } = await json('POST', '/api/auth/register', {
      name: 'Aarav Sharma',
      phone,
      password,
    });
    check('POST /api/auth/register -> 201', status === 201, `(got ${status}: ${JSON.stringify(data)})`);
    check('register returns token', data && typeof data.token === 'string');
    check('register user has phone, no passwordHash', data && data.user && data.user.phone === phone && !('passwordHash' in data.user));
    token = data && data.token;
  }

  // Duplicate register -> 409
  {
    const { status } = await json('POST', '/api/auth/register', { name: 'Dup', phone, password });
    check('POST /api/auth/register duplicate -> 409', status === 409, `(got ${status})`);
  }

  // Register validation: bad phone -> 400
  {
    const { status, data } = await json('POST', '/api/auth/register', { name: 'X', phone: '12345', password: 'short' });
    check('register bad input -> 400', status === 400, `(got ${status})`);
    check('register 400 has field details', data && data.details && (data.details.phone || data.details.password || data.details.name));
  }

  // Login (phone-based, no OTP)
  {
    const { status, data } = await json('POST', '/api/auth/login', { phone, password });
    check('POST /api/auth/login -> 200', status === 200, `(got ${status}: ${JSON.stringify(data)})`);
    check('login returns token', data && typeof data.token === 'string');
    token = (data && data.token) || token;
  }

  // Login wrong password -> 401
  {
    const { status } = await json('POST', '/api/auth/login', { phone, password: 'wrongpass1' });
    check('login wrong password -> 401', status === 401, `(got ${status})`);
  }

  // /me with token
  {
    const { status, data } = await json('GET', '/api/auth/me', null, token);
    check('GET /api/auth/me -> 200', status === 200, `(got ${status})`);
    check('/me returns correct phone', data && data.user && data.user.phone === phone);
  }

  // /me without token -> 401
  {
    const { status } = await json('GET', '/api/auth/me');
    check('GET /api/auth/me (no token) -> 401', status === 401, `(got ${status})`);
  }

  // Contact
  {
    const { status, data } = await json('POST', '/api/contact', {
      name: 'Aarav Sharma',
      email: 'aarav@example.com',
      subject: 'Question about fees',
      message: 'How long does a transfer take to settle?',
    });
    check('POST /api/contact -> 201', status === 201, `(got ${status})`);
    check('contact returns ok', data && data.ok === true);
  }

  // PCI guard: sending CVV must be rejected
  {
    const { status } = await json('POST', '/api/transfers', {
      transferType: 'cc-bank',
      amount: 25000,
      sender: { fullName: 'Test User', phone: randomPhone(), email: 'test@example.com' },
      recipient: { bankName: 'HDFC', recipientName: 'Jane Doe', ifsc: 'HDFC0001234', accountNumber: '123456789012' },
      card: { number: '4242424242424242', cvv: '123' },
    });
    check('POST /api/transfers with raw PAN/CVV -> 400 (PCI guard)', status === 400, `(got ${status})`);
  }

  // Transfer below minimum -> 400
  {
    const { status } = await json('POST', '/api/transfers', {
      transferType: 'cc-upi',
      amount: 500,
      sender: { fullName: 'Test User', phone: randomPhone(), email: 'test@example.com' },
      recipient: { upiId: 'jane@okhdfc', recipientName: 'Jane Doe' },
    });
    check('POST /api/transfers below min -> 400', status === 400, `(got ${status})`);
  }

  // Admin: auth-gated endpoints
  {
    const { status } = await json('GET', '/api/admin/stats');
    check('GET /api/admin/stats without token -> 401', status === 401, `(got ${status})`);
  }
  {
    const { status } = await json('GET', '/api/admin/stats', null, token);
    check('user token cannot access admin -> 401', status === 401, `(got ${status})`);
  }
  let adminToken = null;
  {
    const { status, data } = await json('POST', '/api/admin/login', { username: 'admin', password: 'admin123' });
    check('POST /api/admin/login -> 200', status === 200, `(got ${status}: ${JSON.stringify(data)})`);
    check('admin login returns token', data && typeof data.token === 'string');
    adminToken = data && data.token;
  }
  {
    const { status } = await json('POST', '/api/admin/login', { username: 'admin', password: 'wrongpass' });
    check('admin login wrong password -> 401', status === 401, `(got ${status})`);
  }
  {
    const { status, data } = await json('GET', '/api/admin/stats', null, adminToken);
    check('GET /api/admin/stats with admin token -> 200', status === 200, `(got ${status})`);
    check('admin stats has numeric counts', data && typeof data.users === 'number' && typeof data.transfers === 'number');
  }
  {
    const { status, data } = await json('GET', '/api/admin/users', null, adminToken);
    check('GET /api/admin/users -> 200', status === 200, `(got ${status})`);
    check('admin users is an array', data && Array.isArray(data.users));
  }
  {
    const { status, data } = await json('GET', '/api/admin/contacts', null, adminToken);
    check('GET /api/admin/contacts -> 200', status === 200, `(got ${status})`);
    check('admin contacts is an array', data && Array.isArray(data.contacts));
  }

  // Manual approval transfer flow (create -> pending -> admin approve/reject)
  await testTransferApproval(token, adminToken);

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
