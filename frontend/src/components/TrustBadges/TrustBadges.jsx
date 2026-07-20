import React from 'react';
import ScrollReveal from '../ScrollReveal/ScrollReveal';
import './TrustBadges.css';

export default function TrustBadges() {
  const badges = [
    {
      iconSrc: '/icons/trust-shield.svg',
      title: 'RBI Compliant',
      desc: 'Adheres strictly to merchant guidelines, KYC norms, and secure payment processing regulations.'
    },
    {
      iconSrc: '/icons/icon-lock.svg',
      title: '256-bit Encryption',
      desc: 'All connections run through state-of-the-art secure socket layers (SSL). We never store card details.'
    },
    {
      iconSrc: '/icons/icon-bolt.svg',
      title: 'Instant Settlements',
      desc: 'Connected to direct banking pipelines for instant IMPS, NEFT and UPI payouts inside 5 minutes.'
    },
    {
      iconSrc: '/icons/icon-chat.svg',
      title: '24/7 Priority Support',
      desc: 'Got a question? Connect with our dedicated support agents on WhatsApp or Email instantly.'
    }
  ];

  return (
    <section className="trust-badges-section">
      <div className="container">
        <div className="trust-grid stagger-parent">
          {badges.map((badge, idx) => (
            <ScrollReveal key={idx} delay={100 * (idx + 1)} animation="reveal-hidden">
              <div className="trust-card">
                <div className="trust-icon-wrapper">
                  <span className="trust-icon"><img src={badge.iconSrc} width="30" height="30" alt="" /></span>
                  <div className="trust-glow"></div>
                </div>
                <h4 className="trust-title">{badge.title}</h4>
                <p className="trust-desc">{badge.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
