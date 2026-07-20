import React from 'react';
import { Link } from 'react-router-dom';
import { CONTACT_PHONE_DISPLAY } from '../../config';
import './Footer.css';

export default function Footer() {
  const handleNavClick = (sectionId) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Column 1: Brand */}
          <div className="footer-col footer-brand">
            <Link to="/" className="footer-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="footer-logo-icon">
                <img src="/icons/logo.svg" width="32" height="32" alt="CreditCardPay logo" />
              </div>
              <span className="footer-logo-text">
                CreditCard<span className="footer-logo-accent">Pay</span>
              </span>
            </Link>
            <p className="footer-desc">
              Your trusted partner for secure credit card to bank transfers. Licensed and regulated. Minimum transfer ₹10,000.
            </p>
            <div className="footer-socials">
              <span className="social-label">Follow Us:</span>
              <a href="#" className="social-btn" aria-label="Facebook">
                <img src="/icons/social-facebook.svg" width="18" height="18" alt="" />
              </a>
              <a href="#" className="social-btn" aria-label="Instagram">
                <img src="/icons/social-instagram.svg" width="18" height="18" alt="" />
              </a>
              <a href="#" className="social-btn" aria-label="Twitter">
                <img src="/icons/social-twitter.svg" width="18" height="18" alt="" />
              </a>
              <a href="#" className="social-btn" aria-label="LinkedIn">
                <img src="/icons/social-linkedin.svg" width="18" height="18" alt="" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Link */}
          <div className="footer-col">
            <h4 className="footer-heading">Quick Link</h4>
            <ul className="footer-links">
              <li><Link to="/money-transfer">Money Transfer</Link></li>
              <li><Link to="/calculator">Fee Calculator</Link></li>
              <li><button onClick={() => handleNavClick('how-it-works')}>How It Works</button></li>
            </ul>
          </div>

          {/* Column 3: Help Center */}
          <div className="footer-col">
            <h4 className="footer-heading">Help Center</h4>
            <ul className="footer-links">
              <li><Link to="/contact">Contact Us</Link></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms & Conditions</a></li>
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div className="footer-col">
            <h4 className="footer-heading">Contact Info</h4>
            <ul className="footer-contact">
              <li>
                <span className="contact-icon"><img src="/icons/icon-phone.svg" width="16" height="16" alt="" /></span>
                <div>
                  <span className="contact-label">Call Us:</span>
                  <span className="contact-value">{CONTACT_PHONE_DISPLAY || 'Available on request'}</span>
                </div>
              </li>
              <li>
                <span className="contact-icon"><img src="/icons/icon-pin.svg" width="16" height="16" alt="" /></span>
                <div>
                  <span className="contact-label">Address:</span>
                  <span className="contact-value">India</span>
                </div>
              </li>
              <li>
                <span className="contact-icon"><img src="/icons/icon-mail.svg" width="16" height="16" alt="" /></span>
                <div>
                  <span className="contact-label">Mail Us:</span>
                  <span className="contact-value">support@creditcardpay.com</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {new Date().getFullYear()} CreditCardPay is Proudly Owned by <span className="text-green">CreditCardPay</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
