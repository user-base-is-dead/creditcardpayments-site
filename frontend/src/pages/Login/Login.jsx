import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal';
import { authApi, setSession } from '../../lib/api';
import './Login.css';

// Keep these in sync with the backend validators.
const PHONE_REGEX = /^[6-9]\d{9}$/;
const NAME_REGEX = /^[a-zA-Z][a-zA-Z\s.'-]*$/;
const MIN_PASSWORD_LENGTH = 8;

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (next) => {
    setMode(next);
    setError('');
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    const next = name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setLoginForm((f) => ({ ...f, [name]: next }));
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    const next = name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setRegisterForm((f) => ({ ...f, [name]: next }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!PHONE_REGEX.test(loginForm.phone)) {
      setError('Enter a valid 10-digit mobile number starting with 6-9.');
      return;
    }
    if (loginForm.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setSubmitting(true);
    try {
      const { token, user } = await authApi.login({
        phone: loginForm.phone,
        password: loginForm.password,
      });
      setSession(token, user);
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const name = registerForm.name.trim();
    if (name.length < 2 || !NAME_REGEX.test(name)) {
      setError('Enter a valid full name (letters only, min. 2 characters).');
      return;
    }
    if (!PHONE_REGEX.test(registerForm.phone)) {
      setError('Enter a valid 10-digit mobile number starting with 6-9.');
      return;
    }
    if (registerForm.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const { token, user } = await authApi.register({
        name,
        phone: registerForm.phone,
        password: registerForm.password,
      });
      setSession(token, user);
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="container login-container">
        <ScrollReveal delay={100}>
          <div className="login-card card">
            <div className="login-tabs">
              <button
                type="button"
                className={`login-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => switchMode('login')}
              >
                Login
              </button>
              <button
                type="button"
                className={`login-tab ${mode === 'register' ? 'active' : ''}`}
                onClick={() => switchMode('register')}
              >
                Register
              </button>
            </div>

            {mode === 'login' ? (
              <form className="login-form" onSubmit={handleLoginSubmit}>
                <h2 className="login-title">Welcome back</h2>
                <p className="login-subtitle">Login with your mobile number to manage your transfers.</p>

                <div className="input-group">
                  <label htmlFor="login-phone">Mobile Number</label>
                  <input
                    id="login-phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    required
                    value={loginForm.phone}
                    onChange={handleLoginChange}
                    placeholder="Enter your mobile number"
                    autoComplete="tel"
                    maxLength={10}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="login-password">Password</label>
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>

                {error && <p className="login-error">{error}</p>}

                <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                  {submitting ? 'Logging in…' : 'Log In'}
                </button>
              </form>
            ) : (
              <form className="login-form" onSubmit={handleRegisterSubmit}>
                <h2 className="login-title">Create your account</h2>
                <p className="login-subtitle">Register with your mobile number to get started.</p>

                <div className="input-group">
                  <label htmlFor="register-name">Full Name</label>
                  <input
                    id="register-name"
                    name="name"
                    type="text"
                    required
                    value={registerForm.name}
                    onChange={handleRegisterChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="register-phone">Mobile Number</label>
                  <input
                    id="register-phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    required
                    value={registerForm.phone}
                    onChange={handleRegisterChange}
                    placeholder="Enter your mobile number"
                    autoComplete="tel"
                    maxLength={10}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="register-password">Password</label>
                  <input
                    id="register-password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="register-confirm">Confirm Password</label>
                  <input
                    id="register-confirm"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterChange}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                  />
                </div>

                {error && <p className="login-error">{error}</p>}

                <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                  {submitting ? 'Creating account…' : 'Create Account'}
                </button>
              </form>
            )}

            <p className="login-trust"><img src="/icons/icon-lock.svg" width="12" height="12" alt="" style={{ verticalAlign: 'middle', marginRight: '4px' }} />Your details are protected with bank-grade encryption.</p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
