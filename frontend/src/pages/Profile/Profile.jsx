import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUser, isAuthenticated, transferApi, clearSession } from '../../lib/api';
import './Profile.css';

function formatINR(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(n) || 0);
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

const STATUS_LABEL = {
  pending: 'Pending',
  otp_pending: 'Awaiting OTP',
  processing: 'Processing',
  completed: 'Completed',
  rejected: 'Card Declined',
};

export default function Profile() {
  const navigate = useNavigate();
  const user = getUser();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    let active = true;
    (async () => {
      try {
        const data = await transferApi.my();
        if (active) setTransfers(data.transfers || []);
      } catch (err) {
        if (active) setError(err.message || 'Could not load your transactions.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [navigate]);

  const handleLogout = () => {
    clearSession();
    window.location.href = '/';
  };

  if (!user) return null;

  return (
    <div className="profile-page">
      <div className="container profile-container">
        {/* Profile header card */}
        <div className="profile-card card">
          <div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div className="profile-info">
            <h1 className="profile-name">{user.name}</h1>
            <p className="profile-phone">+91 {user.phone}</p>
          </div>
          <button type="button" className="btn btn-secondary profile-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* Transactions */}
        <div className="profile-transactions">
          <div className="profile-tx-head">
            <h2 className="profile-tx-title">Transaction History</h2>
            <Link to="/money-transfer" className="btn btn-primary btn-sm">New Transfer</Link>
          </div>

          {loading ? (
            <p className="profile-empty">Loading your transactions…</p>
          ) : error ? (
            <p className="profile-error">{error}</p>
          ) : transfers.length === 0 ? (
            <div className="profile-empty-box">
              <p>You haven't made any transfers yet.</p>
              <Link to="/money-transfer" className="btn btn-primary">Start a Transfer</Link>
            </div>
          ) : (
            <div className="profile-tx-list">
              {transfers.map((t) => (
                <div key={t.transferId} className="profile-tx card">
                  <div className="profile-tx-main">
                    <span className="profile-tx-ref">#{t.referenceId}</span>
                    <span className="profile-tx-meta">
                      {t.transferType === 'cc-upi' ? 'Credit Card → UPI' : 'Credit Card → Bank'} · {formatDate(t.createdAt)}
                    </span>
                  </div>
                  <div className="profile-tx-amounts">
                    <span className="profile-tx-amount">{formatINR(t.amount)}</span>
                    <span className={`profile-tx-status status-${t.status}`}>
                      {STATUS_LABEL[t.status] || t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
