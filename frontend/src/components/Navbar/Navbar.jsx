import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';

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

  const handleNavClick = (sectionId) => {
    setIsMobileMenuOpen(false);
    if (isHomePage) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/', { state: { scrollTo: sectionId } });
    }
  };

  useEffect(() => {
    if (isHomePage && location.state?.scrollTo) {
      const sectionId = location.state.scrollTo;
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      window.history.replaceState({}, document.title);
    }
  }, [location, isHomePage]);

  return (
    <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-pill">
        {/* Brand Logo */}
        <Link to="/" className="navbar-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="logo-icon-wrapper">
            <svg viewBox="0 0 32 32" className="logo-icon" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="url(#nav-logo-grad)" />
              <path d="M12 10L16 16L12 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 10L21 16L17 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
              <defs>
                <linearGradient id="nav-logo-grad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3b82f6" />
                  <stop offset="1" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="logo-text">
            CreditCard<span className="logo-accent">Pay</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="navbar-links">
          <button 
            onClick={() => isHomePage ? window.scrollTo({ top: 0, behavior: 'smooth' }) : navigate('/')} 
            className={`nav-link ${isHomePage ? 'active' : ''}`}
          >
            Home
          </button>
          <button onClick={() => handleNavClick('services')} className="nav-link">
            Money Transfer
          </button>
          <button onClick={() => handleNavClick('faq')} className="nav-link">
            Contact Us
          </button>
        </div>

        {/* Login Button */}
        <div className="navbar-actions">
          <a 
            href="https://wa.me/919999999999?text=Hello%20CreditCardPay,%20I%20want%20to%20exchange%20funds." 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-dark btn-nav-login"
          >
            Login
          </a>
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
        <button onClick={() => { isHomePage ? window.scrollTo({ top: 0, behavior: 'smooth' }) : navigate('/'); setIsMobileMenuOpen(false); }} className="mobile-link">Home</button>
        <button onClick={() => handleNavClick('services')} className="mobile-link">Money Transfer</button>
        <button onClick={() => handleNavClick('faq')} className="mobile-link">Contact Us</button>
        <div className="mobile-action">
          <a href="https://wa.me/919999999999?text=Hello%20CreditCardPay,%20I%20want%20to%20exchange%20funds." target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-pill w-full">
            Login
          </a>
        </div>
      </div>
    </nav>
  );
}
