import React from 'react';
import ScrollReveal from '../ScrollReveal/ScrollReveal';
import './Services.css';

export default function Services() {
  const features = [
    {
      id: 'send-money',
      emoji: '💸',
      title: 'Send Money',
      description: 'Transfer funds from your card to any bank account globally with just a few clicks.',
      color: '#f97316'
    },
    {
      id: 'interest-money',
      emoji: '💡',
      title: 'Interest Money',
      description: 'Save on interest by moving high-cost debt to lower-interest options via direct transfer.',
      color: '#eab308'
    },
    {
      id: 'bank-transfer',
      emoji: '🏦',
      title: 'Bank Transfer',
      description: 'The core of our service: seamless, instant credit-to-bank transactions.',
      color: '#3b82f6'
    },
    {
      id: 'invest-money',
      emoji: '❤️',
      title: 'Invest Money',
      description: 'Fund your investment accounts directly from your credit card with our secure gateway.',
      color: '#ef4444'
    }
  ];

  return (
    <section className="services-section" id="services">
      <div className="container">
        {/* Header */}
        <div className="services-header text-center">
          <ScrollReveal delay={100}>
            <span className="section-badge section-badge-green">KEY FEATURES</span>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <h2 className="section-title">
              How We Support You
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <p className="section-desc">
              We are here to ensure your transfers go smoothly 24/7 with our dedicated support team.
            </p>
          </ScrollReveal>
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          {features.map((feature, idx) => (
            <ScrollReveal key={feature.id} delay={100 * (idx + 1)}>
              <div className="feature-card card">
                <div className="feature-emoji-box" style={{ backgroundColor: `${feature.color}15` }}>
                  <span className="feature-emoji">{feature.emoji}</span>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.description}</p>
                <button className="feature-link" style={{ color: feature.color }}>
                  View Details
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
