import React, { useState } from 'react';
import ScrollReveal from '../ScrollReveal/ScrollReveal';
import './Hero.css';

export default function Hero() {
  const [amount, setAmount] = useState(10000);
  const feePercent = 0.85;
  const fee = Math.round(amount * feePercent) / 100;
  const received = amount - fee;

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setAmount(Number(val) || 0);
  };

  const handleWhatsAppClick = () => {
    window.open(
      `https://wa.me/919999999999?text=Hello%20CreditCardPay,%20I%20want%20to%20transfer%20₹${amount.toLocaleString('en-IN')}%20from%20my%20credit%20card.`,
      '_blank'
    );
  };

  return (
    <section className="hero">
      {/* Background glow effects */}
      <div className="hero-glow hero-glow-1"></div>
      <div className="hero-glow hero-glow-2"></div>

      <div className="container hero-grid">
        {/* Left — Content */}
        <div className="hero-content">
          <ScrollReveal delay={100}>
            <h1 className="hero-title">
              Credit Card To<br />
              Bank <span className="hero-title-highlight">Transfer</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p className="hero-subtitle">
              Transfer money from your credit card to any bank account instantly with the lowest fees in the industry. Safe, fast, and reliable.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="hero-features">
              <div className="hero-feature">
                <span className="feature-dot"></span>
                <span>Instant Settlement in 5 Minutes</span>
              </div>
              <div className="hero-feature">
                <span className="feature-dot"></span>
                <span>Lowest 0.85% Flat Fee</span>
              </div>
              <div className="hero-feature">
                <span className="feature-dot"></span>
                <span>100% Safe & Secure Transfers</span>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <button onClick={handleWhatsAppClick} className="btn btn-primary btn-lg hero-cta">
              Convert Now
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </ScrollReveal>
        </div>

        {/* Right — Calculator Widget */}
        <div className="hero-calculator-wrapper">
          <ScrollReveal delay={300}>
            <div className="hero-calculator">
              <div className="calc-header">
                <div className="calc-header-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <span className="calc-header-text">Quick Calculator</span>
              </div>

              <div className="calc-body">
                <div className="calc-field">
                  <label className="calc-label">You Send</label>
                  <div className="calc-input-wrapper">
                    <span className="calc-currency">₹</span>
                    <input
                      type="text"
                      className="calc-input"
                      value={amount.toLocaleString('en-IN')}
                      onChange={handleAmountChange}
                    />
                  </div>
                </div>

                <div className="calc-breakdown">
                  <div className="calc-row">
                    <span className="calc-row-label">Service Fee (0.85%)</span>
                    <span className="calc-row-value fee">- ₹{fee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="calc-divider"></div>
                  <div className="calc-row total">
                    <span className="calc-row-label">You Receive</span>
                    <span className="calc-row-value receive">₹{received.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button onClick={handleWhatsAppClick} className="btn btn-primary calc-submit">
                  Start Transfer
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>

              {/* Trust indicators */}
              <div className="calc-trust">
                <div className="trust-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span>256-bit Encrypted</span>
                </div>
                <div className="trust-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>RBI Compliant</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Scrolling credit card banner */}
      <div className="hero-cards-banner">
        <div className="cards-scroll">
          {[...Array(2)].map((_, setIdx) => (
            <div key={setIdx} className="cards-scroll-set">
              {['VISA', 'Mastercard', 'RuPay', 'Amex', 'HDFC', 'ICICI', 'SBI', 'Axis', 'Kotak', 'IndusInd'].map((name, i) => (
                <div key={i} className="card-brand-chip">
                  {name}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
