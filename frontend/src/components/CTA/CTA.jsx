import React from 'react';
import { Link } from 'react-router-dom';
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
                <Link to="/money-transfer" className="btn btn-primary btn-lg">
                  Start Transfer Now
                  <img src="/icons/arrow-right-white.svg" width="18" height="18" alt="" />
                </Link>
                <Link to="/contact" className="btn btn-secondary btn-lg">
                  Contact Us
                </Link>
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
