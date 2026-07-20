import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getUser, clearSession } from '../../lib/api';
import './Navbar.css';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const user = getUser();

  const handleLogout = () => {
    clearSession();
    window.location.href = '/';
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-pill">
        {/* Brand Logo */}
        <Link to="/" className="navbar-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="logo-icon-wrapper">
            <img src="/icons/logo.svg" className="logo-icon" width="32" height="32" alt="CreditCardPay logo" />
          </div>
          <span className="logo-text">
            CreditCard<span className="logo-accent">Pay</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="navbar-links">
          <Link
            to="/"
            onClick={() => isHomePage && window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`nav-link ${isHomePage ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link
            to="/money-transfer"
            className={`nav-link ${location.pathname === '/money-transfer' ? 'active' : ''}`}
          >
            Money Transfer
          </Link>
          <Link
            to="/contact"
            className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}
          >
            Contact Us
          </Link>
          <Link
            to="/docs"
            className={`nav-link ${location.pathname === '/docs' ? 'active' : ''}`}
          >
            Docs
          </Link>
        </div>

        {/* Auth */}
        <div className="navbar-actions">
          {user ? (
            <div className="nav-user">
              <Link to="/profile" className="nav-user-link" title="View profile">
                <div className="nav-avatar">{user.name.charAt(0).toUpperCase()}</div>
                <span className="nav-user-name">{user.name}</span>
              </Link>
              <button type="button" className="nav-logout-btn" onClick={handleLogout} title="Logout">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-dark btn-nav-login">
              Login
            </Link>
          )}
        </div>

        {/* Hamburger */}
        <button 
          className={`navbar-toggle ${isMobileMenuOpen ? 'is-active' : ''}`} 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={`navbar-mobile ${isMobileMenuOpen ? 'open' : ''}`}>
        <Link to="/" onClick={() => isHomePage && window.scrollTo({ top: 0, behavior: 'smooth' })} className="mobile-link">Home</Link>
        <Link to="/money-transfer" className="mobile-link">Money Transfer</Link>
        <Link to="/contact" className="mobile-link">Contact Us</Link>
        <Link to="/docs" className="mobile-link">Docs</Link>
        <div className="mobile-action">
          {user ? (
            <>
              <Link to="/profile" className="btn btn-secondary btn-pill w-full" style={{ marginBottom: '0.5rem' }}>
                My Profile
              </Link>
              <button type="button" className="btn btn-primary btn-pill w-full" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-pill w-full">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
