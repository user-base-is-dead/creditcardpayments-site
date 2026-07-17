import React, { useState } from 'react';
import ScrollReveal from '../ScrollReveal/ScrollReveal';
import './HowItWorks.css';

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      number: '01',
      title: 'Login Securely',
      desc: 'Enter your phone number and verify via OTP to safely access your account.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      ),
      visual: {
        title: 'Secure Authentication',
        fields: [
          { icon: '📱', placeholder: '+91 98765 43210' },
          { icon: '🔒', placeholder: '••••••' }
        ],
        button: 'Verify OTP'
      }
    },
    {
      number: '02',
      title: 'Add Bank & Amount',
      desc: 'Enter the recipient\'s bank account details and the exact amount. Charges will be calculated instantly.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M2 8h20" />
        </svg>
      ),
      visual: {
        title: 'Bank Details',
        fields: [
          { icon: '🏦', placeholder: 'HDFC Bank - XXXX1234' },
          { icon: '💰', placeholder: '₹ 25,000' }
        ],
        button: 'Calculate Fee'
      }
    },
    {
      number: '03',
      title: 'Enter Card Details',
      desc: 'Securely input your credit card information to process the payment.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
      visual: {
        title: 'Card Payment',
        fields: [
          { icon: '💳', placeholder: '4242 •••• •••• 9876' },
          { icon: '📅', placeholder: '12/28  •  CVV ***' }
        ],
        button: 'Pay Securely'
      }
    },
    {
      number: '04',
      title: 'Instant Transfer',
      desc: 'Your money is transferred instantly! Receive funds in your bank account within 5 minutes.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
      visual: {
        title: 'Transfer Complete!',
        fields: [
          { icon: '✅', placeholder: '₹24,787.50 Credited' },
          { icon: '⚡', placeholder: 'Settled in 2 mins 14 sec' }
        ],
        button: 'View Receipt'
      }
    }
  ];

  return (
    <section className="how-it-works" id="how-it-works">
      <div className="container">
        {/* Header */}
        <div className="how-header text-center">
          <ScrollReveal delay={100}>
            <span className="section-badge">PROCESS</span>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <h2 className="section-title">
              Your Financial Freedom<br />
              <span className="highlight">in 4 Simple Steps</span>
            </h2>
          </ScrollReveal>
        </div>

        {/* Steps + Visual */}
        <div className="how-grid">
          {/* Left — Steps List */}
          <div className="steps-list">
            {steps.map((step, idx) => (
              <ScrollReveal key={step.number} delay={100 * (idx + 1)}>
                <button
                  className={`step-item ${activeStep === idx ? 'active' : ''}`}
                  onClick={() => setActiveStep(idx)}
                >
                  <div className="step-icon-box">
                    {step.icon}
                  </div>
                  <div className="step-text">
                    <h4 className="step-title">{step.title}</h4>
                    <p className="step-desc">{step.desc}</p>
                  </div>
                  {activeStep === idx && <div className="step-progress"></div>}
                </button>
              </ScrollReveal>
            ))}
          </div>

          {/* Right — Visual Preview */}
          <div className="steps-visual">
            <ScrollReveal delay={200}>
              <div className="visual-card">
                <div className="visual-card-icon">
                  {steps[activeStep].icon}
                </div>
                <h3 className="visual-card-title">{steps[activeStep].visual.title}</h3>
                <div className="visual-fields">
                  {steps[activeStep].visual.fields.map((field, i) => (
                    <div key={i} className="visual-field">
                      <span className="visual-field-icon">{field.icon}</span>
                      <span className="visual-field-text">{field.placeholder}</span>
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary visual-btn">
                  {steps[activeStep].visual.button}
                </button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
