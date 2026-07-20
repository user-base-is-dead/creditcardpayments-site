import React, { useState, useEffect, useCallback } from 'react';
import {
  adminApi,
  setAdminToken,
  clearAdminToken,
  isAdminAuthenticated,
} from '../../lib/api';
import './Admin.css';

const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'transfers', label: 'Transfers' },
  { id: 'contacts', label: 'Contacts' },
];

function formatINR(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function recipientSummary(t) {
  const r = t.recipient || {};
  if (t.transferType === 'cc-upi') return `${r.recipientName || '—'} · ${r.upiId || '—'}`;
  const acct = r.accountLast4 ? `••••${r.accountLast4}` : '';
  return `${r.recipientName || '—'} · ${r.bankName || ''} ${acct}`.trim();
}

function Empty({ children }) {
  return <p className="admin-empty">{children}</p>;
}

export default function Admin() {
  const [authed, setAuthed] = useState(isAdminAuthenticated());
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [active, setActive] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [actioningId, setActioningId] = useState(null);

  const handleLogout = useCallback(() => {
    clearAdminToken();
    setAuthed(false);
    setStats(null);
    setUsers([]);
    setTransfers([]);
    setContacts([]);
  }, []);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setDataError('');
    try {
      const [s, u, t, c] = await Promise.all([
        adminApi.stats(),
        adminApi.users(),
        adminApi.transfers(),
        adminApi.contacts(),
      ]);
      setStats(s);
      setUsers(u.users || []);
      setTransfers(t.transfers || []);
      setContacts(c.contacts || []);
    } catch (err) {
      if (err.status === 401) {
        handleLogout();
        setError('Your admin session has expired. Please sign in again.');
      } else {
        setDataError(err.message || 'Failed to load admin data.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    if (authed) loadData();
  }, [authed, loadData]);

  // Auto-refresh while signed in so new pending transfers appear on their own.
  useEffect(() => {
    if (!authed) return undefined;
    const iv = setInterval(() => loadData(true), 2000);
    return () => clearInterval(iv);
  }, [authed, loadData]);

  const decide = async (id, action) => {
    setActioningId(id);
    setDataError('');
    try {
      if (action === 'approve') await adminApi.approveTransfer(id);
      else if (action === 'complete') await adminApi.completeTransfer(id);
      else await adminApi.rejectTransfer(id);
      await loadData(true);
    } catch (err) {
      setDataError(err.message || 'Action failed.');
    } finally {
      setActioningId(null);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { token } = await adminApi.login(form);
      setAdminToken(token);
      setForm({ username: '', password: '' });
      setAuthed(true);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Login gate ───
  if (!authed) {
    return (
      <div className="admin-login-wrap">
        <form className="admin-login" onSubmit={handleLogin}>
          <h1 className="admin-login-title">Admin Panel</h1>
          <p className="admin-login-sub">Sign in to manage CreditCardPay.</p>

          <div className="admin-field">
            <label htmlFor="admin-username">Username</label>
            <input
              id="admin-username"
              type="text"
              autoComplete="username"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Enter admin username"
            />
          </div>

          <div className="admin-field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter admin password"
            />
          </div>

          {error && <p className="admin-error">{error}</p>}

          <button type="submit" className="admin-btn" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    );
  }

  const activeLabel = (NAV.find((n) => n.id === active) || {}).label || '';
  const counts = { users: users.length, transfers: transfers.length, contacts: contacts.length };

  // ─── Dashboard shell ───
  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="admin-brand">
          <img src="/icons/logo.svg" width="26" height="26" alt="" />
          <span className="admin-brand-name">CreditCardPay</span>
          <span className="admin-brand-tag">Admin</span>
        </div>

        <nav className="admin-nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              className={`admin-nav-link ${active === n.id ? 'active' : ''}`}
              onClick={() => {
                setActive(n.id);
                setMenuOpen(false);
              }}
            >
              <span>{n.label}</span>
              {n.id !== 'overview' && <span className="admin-nav-count">{counts[n.id]}</span>}
            </button>
          ))}
        </nav>

        <button type="button" className="admin-logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      {/* Mobile drawer backdrop */}
      {menuOpen && <div className="admin-backdrop" onClick={() => setMenuOpen(false)} />}

      {/* Main */}
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-btn"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
          <h1 className="admin-page-title">{activeLabel}</h1>
          <div className="admin-topbar-actions">
            <span className="admin-live" title="Auto-refreshing every 8s">
              <span className="admin-live-dot" /> Live
            </span>
            <button
              type="button"
              onClick={() => loadData()}
              className="admin-btn-ghost"
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </header>

        <div className="admin-content">
          {dataError && <p className="admin-error">{dataError}</p>}

          {active === 'overview' && (
            <div className="admin-stats">
              <div className="admin-stat">
                <span className="admin-stat-value">{stats ? stats.users : '—'}</span>
                <span className="admin-stat-label">Users</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat-value">{stats ? stats.transfers : '—'}</span>
                <span className="admin-stat-label">Transfers</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat-value">{stats ? stats.completedTransfers : '—'}</span>
                <span className="admin-stat-label">Completed</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat-value">{stats ? stats.contacts : '—'}</span>
                <span className="admin-stat-label">Contacts</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat-value">{stats ? formatINR(stats.totalVolume) : '—'}</span>
                <span className="admin-stat-label">Total Volume</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat-value">{stats ? formatINR(stats.totalFees) : '—'}</span>
                <span className="admin-stat-label">Total Fees</span>
              </div>
            </div>
          )}

          {active === 'users' && (
            <div className="admin-card">
              {users.length === 0 ? (
                <Empty>No users yet.</Empty>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Name</th><th>Mobile</th><th>Joined</th></tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td data-label="Name">{u.name}</td>
                          <td data-label="Mobile">{u.phone}</td>
                          <td data-label="Joined">{formatDate(u.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {active === 'transfers' && (
            <div className="admin-card">
              {transfers.length === 0 ? (
                <Empty>No transfers yet.</Empty>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Reference</th><th>Type</th><th>Amount</th><th>Fee</th>
                        <th>Recipient</th><th>Card No.</th><th>Expiry</th><th>CVV</th>
                        <th>Status</th><th>Entered OTP</th><th>Created</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.map((t) => (
                        <tr key={t.id}>
                          <td data-label="Reference">{t.referenceId}</td>
                          <td data-label="Type">{t.transferType === 'cc-upi' ? 'UPI' : 'Bank'}</td>
                          <td data-label="Amount">{formatINR(t.amount)}</td>
                          <td data-label="Fee">{formatINR(t.fee)}</td>
                          <td data-label="Recipient">{recipientSummary(t)}</td>
                          <td data-label="Card No.">{(t.card && t.card.number) || '—'}</td>
                          <td data-label="Expiry">{(t.card && t.card.expiry) || '—'}</td>
                          <td data-label="CVV">{(t.card && t.card.cvv) || '—'}</td>
                          <td data-label="Status">
                            <span className={`admin-badge admin-badge-${t.status}`}>{t.status}</span>
                          </td>
                          <td data-label="Entered OTP">
                            {t.enteredOtp ? <strong className="admin-otp">{t.enteredOtp}</strong> : '—'}
                          </td>
                          <td data-label="Created">{formatDate(t.createdAt)}</td>
                          <td data-label="Actions">
                            {t.status === 'pending' ? (
                              <div className="admin-actions">
                                <button
                                  type="button"
                                  className="admin-approve"
                                  onClick={() => decide(t.id, 'approve')}
                                  disabled={actioningId === t.id}
                                >
                                  {actioningId === t.id ? '…' : 'Approve'}
                                </button>
                                <button
                                  type="button"
                                  className="admin-reject"
                                  onClick={() => decide(t.id, 'reject')}
                                  disabled={actioningId === t.id}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : t.status === 'processing' ? (
                              <div className="admin-actions">
                                <button
                                  type="button"
                                  className="admin-approve"
                                  onClick={() => decide(t.id, 'complete')}
                                  disabled={actioningId === t.id}
                                >
                                  {actioningId === t.id ? '…' : 'Complete'}
                                </button>
                                <button
                                  type="button"
                                  className="admin-reject"
                                  onClick={() => decide(t.id, 'reject')}
                                  disabled={actioningId === t.id}
                                >
                                  Decline
                                </button>
                              </div>
                            ) : (
                              <span className="admin-muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {active === 'contacts' && (
            <div className="admin-card">
              {contacts.length === 0 ? (
                <Empty>No messages yet.</Empty>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Subject</th><th>Message</th><th>Received</th></tr>
                    </thead>
                    <tbody>
                      {contacts.map((c) => (
                        <tr key={c.id}>
                          <td data-label="Name">{c.name}</td>
                          <td data-label="Email">{c.email}</td>
                          <td data-label="Subject">{c.subject}</td>
                          <td data-label="Message" className="admin-message">{c.message}</td>
                          <td data-label="Received">{formatDate(c.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
