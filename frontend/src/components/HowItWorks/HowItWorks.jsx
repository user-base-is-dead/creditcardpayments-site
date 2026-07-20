import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScrollReveal from '../ScrollReveal/ScrollReveal';
import './HowItWorks.css';

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();

  const steps = [
    {
      number: '01',
      title: 'Login Securely',
      desc: 'Enter your phone number and verify via OTP to safely access your account.',
      iconSrc: '/icons/step-login.svg',
      visual: {
        title: 'Secure Authentication',
        fields: [
          { iconSrc: '/icons/step-login.svg', placeholder: 'Mobile number' },
          { iconSrc: '/icons/icon-lock.svg', placeholder: '••••••' }
        ],
        button: 'Verify OTP'
      }
    },
    {
      number: '02',
      title: 'Add Bank & Amount',
      desc: 'Enter the recipient\'s bank account details and the exact amount. Charges will be calculated instantly.',
      iconSrc: '/icons/step-bank.svg',
      visual: {
        title: 'Bank Details',
        fields: [
          { iconSrc: '/icons/icon-bank.svg', placeholder: 'HDFC Bank - XXXX1234' },
          { iconSrc: '/icons/icon-money.svg', placeholder: '₹ 25,000' }
        ],
        button: 'Calculate Fee'
      }
    },
    {
      number: '03',
      title: 'Enter Card Details',
      desc: 'Securely input your credit card information to process the payment.',
      iconSrc: '/icons/step-card.svg',
      visual: {
        title: 'Card Payment',
        fields: [
          { iconSrc: '/icons/step-card.svg', placeholder: '4242 •••• •••• 9876' },
          { iconSrc: '/icons/icon-calendar.svg', placeholder: '12/28  •  CVV ***' }
        ],
        button: 'Pay Securely'
      }
    },
    {
      number: '04',
      title: 'Instant Transfer',
      desc: 'Your money is transferred instantly! Receive funds in your bank account within 5 minutes.',
      iconSrc: '/icons/step-transfer.svg',
      visual: {
        title: 'Transfer Complete!',
        fields: [
          { iconSrc: '/icons/trust-check.svg', placeholder: '₹24,787.50 Credited' },
          { iconSrc: '/icons/icon-bolt.svg', placeholder: 'Settled in 2 mins 14 sec' }
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
                  onMouseEnter={() => setActiveStep(idx)}
                  onClick={() => navigate(idx === 0 ? '/login' : '/money-transfer')}
                >
                  <div className="step-icon-box">
                    <img src={step.iconSrc} width="22" height="22" alt="" />
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
                  <img src={steps[activeStep].iconSrc} width="22" height="22" alt="" />
                </div>
                <h3 className="visual-card-title">{steps[activeStep].visual.title}</h3>
                <div className="visual-fields">
                  {steps[activeStep].visual.fields.map((field, i) => (
                    <div key={i} className="visual-field">
                      <span className="visual-field-icon"><img src={field.iconSrc} width="18" height="18" alt="" /></span>
                      <span className="visual-field-text">{field.placeholder}</span>
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-primary visual-btn"
                  onClick={() => navigate(activeStep === 0 ? '/login' : '/money-transfer')}
                >
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
