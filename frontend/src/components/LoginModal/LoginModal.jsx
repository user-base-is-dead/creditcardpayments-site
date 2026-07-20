import React, { useState } from 'react';
import { authApi, setSession } from '../../lib/api';
import './LoginModal.css';

const PHONE_REGEX = /^[6-9]\d{9}$/;
const NAME_REGEX = /^[a-zA-Z][a-zA-Z\s.'-]*$/;
const MIN_PASSWORD_LENGTH = 8;

export default function LoginModal({ onSuccess }) {
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (m) => { setMode(m); setError(''); };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((f) => ({ ...f, [name]: name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value }));
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((f) => ({ ...f, [name]: name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!PHONE_REGEX.test(loginForm.phone)) { setError('Enter a valid 10-digit mobile number.'); return; }
    if (loginForm.password.length < MIN_PASSWORD_LENGTH) { setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`); return; }
    setSubmitting(true);
    try {
      const { token, user } = await authApi.login({ phone: loginForm.phone, password: loginForm.password });
      setSession(token, user);
      onSuccess(user);
    } catch (err) { setError(err.message || 'Login failed.'); }
    finally { setSubmitting(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    const name = registerForm.name.trim();
    if (name.length < 2 || !NAME_REGEX.test(name)) { setError('Enter a valid full name.'); return; }
    if (!PHONE_REGEX.test(registerForm.phone)) { setError('Enter a valid 10-digit mobile number.'); return; }
    if (registerForm.password.length < MIN_PASSWORD_LENGTH) { setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`); return; }
    if (registerForm.password !== registerForm.confirmPassword) { setError('Passwords do not match.'); return; }
    setSubmitting(true);
    try {
      const { token, user } = await authApi.register({ name, phone: registerForm.phone, password: registerForm.password });
      setSession(token, user);
      onSuccess(user);
    } catch (err) { setError(err.message || 'Registration failed.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="login-modal-overlay">
      <div className="login-modal">
        <div className="login-modal-tabs">
          <button type="button" className={`lm-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')}>Login</button>
          <button type="button" className={`lm-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => switchMode('register')}>Register</button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="lm-form">
            <h2 className="lm-title">Login to continue</h2>
            <p className="lm-sub">Sign in with your mobile number to access Money Transfer.</p>
            <div className="lm-field">
              <label>Mobile Number</label>
              <input type="tel" name="phone" inputMode="numeric" maxLength={10} required value={loginForm.phone} onChange={handleLoginChange} placeholder="Enter your mobile number" autoComplete="tel" />
            </div>
            <div className="lm-field">
              <label>Password</label>
              <input type="password" name="password" required minLength={8} value={loginForm.password} onChange={handleLoginChange} placeholder="••••••••" autoComplete="current-password" />
            </div>
            {error && <p className="lm-error">{error}</p>}
            <button type="submit" className="lm-btn" disabled={submitting}>{submitting ? 'Signing in…' : 'Log In'}</button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="lm-form">
            <h2 className="lm-title">Create an account</h2>
            <p className="lm-sub">Register to start transferring money securely.</p>
            <div className="lm-field">
              <label>Full Name</label>
              <input type="text" name="name" required value={registerForm.name} onChange={handleRegisterChange} placeholder="Enter your full name" autoComplete="name" />
            </div>
            <div className="lm-field">
              <label>Mobile Number</label>
              <input type="tel" name="phone" inputMode="numeric" maxLength={10} required value={registerForm.phone} onChange={handleRegisterChange} placeholder="Enter your mobile number" autoComplete="tel" />
            </div>
            <div className="lm-field">
              <label>Password</label>
              <input type="password" name="password" required minLength={8} value={registerForm.password} onChange={handleRegisterChange} placeholder="At least 8 characters" autoComplete="new-password" />
            </div>
            <div className="lm-field">
              <label>Confirm Password</label>
              <input type="password" name="confirmPassword" required minLength={8} value={registerForm.confirmPassword} onChange={handleRegisterChange} placeholder="Re-enter password" autoComplete="new-password" />
            </div>
            {error && <p className="lm-error">{error}</p>}
            <button type="submit" className="lm-btn" disabled={submitting}>{submitting ? 'Creating…' : 'Create Account'}</button>
          </form>
        )}

        <p className="lm-trust"><img src="/icons/icon-lock.svg" width="12" height="12" alt="" style={{ verticalAlign: 'middle', marginRight: '4px' }} />Your details are protected with bank-grade encryption.</p>
      </div>
    </div>
  );
}
