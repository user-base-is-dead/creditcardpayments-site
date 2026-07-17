import React from 'react';
import ScrollReveal from '../ScrollReveal/ScrollReveal';
import './CTA.css';

export default function CTA() {
  return (
    <section className="cta-section">
      <div className="container">
        <ScrollReveal delay={100}>
          <div className="cta-card">
            <div className="cta-content">
              <span className="cta-label text-coral">Get Started Today</span>
              <h2 className="cta-title">
                Ready to Transfer Money<br />
                at the <span className="text-green">Lowest Rates?</span>
              </h2>
              <p className="cta-desc">
                Join thousands of happy customers who trust CreditCardPay for instant, secure credit card to bank transfers at just 0.85% flat fee.
              </p>
              <div className="cta-buttons">
                <a
                  href="https://wa.me/919999999999?text=Hello%20CreditCardPay,%20I%20want%20to%20exchange%20funds."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-lg"
                >
                  Start Transfer Now
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </a>
                <a
                  href="https://wa.me/919999999999?text=I%20have%20a%20question%20about%20CreditCardPay"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-lg"
                >
                  Chat with Us
                </a>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="cta-decor">
              <div className="cta-circle cta-circle-1"></div>
              <div className="cta-circle cta-circle-2"></div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
