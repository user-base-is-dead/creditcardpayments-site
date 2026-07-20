import React, { useState } from 'react';
import ScrollReveal from '../ScrollReveal/ScrollReveal';
import './FAQ.css';

export default function FAQ() {
  const faqs = [
    {
      question: 'How does the credit card to bank transfer work?',
      answer: 'Simply enter your transfer amount, provide bank details, and complete the payment via your credit card. The funds are settled directly to the recipient\'s bank account within 5 minutes via IMPS/NEFT.'
    },
    {
      question: 'Why is the service charge only 0.85%?',
      answer: 'We utilize API-based bulk merchant settlement routes. By processing high volumes directly with digital bank settlement partners, we eliminate multiple intermediate margins (which typically cost 2-4%) and pass the savings to you.'
    },
    {
      question: 'Which credit cards and bank accounts are supported?',
      answer: 'We support all major credit cards including VISA, Mastercard, RuPay, and American Express from any Indian bank. Transfers can be made to any bank account in India via IMPS, NEFT, or UPI.'
    },
    {
      question: 'What happens if my transaction fails?',
      answer: 'In the rare event of a failed transaction, the full amount is automatically refunded to your credit card within 24-48 hours. Our support team is available 24/7 on WhatsApp to assist you.'
    },
    {
      question: 'Is there any limit on the amount I can transfer?',
      answer: 'The minimum transfer amount is ₹10,000 and the maximum is ₹5,00,000 per transaction. Daily limits may vary based on your credit card limit and bank policies.'
    },
    {
      question: 'Is this service safe and RBI compliant?',
      answer: 'Absolutely. All transactions are processed through RBI-licensed payment gateways with 3D Secure verification. We use 256-bit SSL encryption and never store your card details.'
    }
  ];

  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="faq-section" id="faq">
      <div className="container">
        {/* Header */}
        <div className="faq-header text-center">
          <ScrollReveal delay={100}>
            <span className="section-badge">FAQ</span>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <h2 className="section-title">
              Got Questions? <span className="highlight">We've Got Answers</span>
            </h2>
          </ScrollReveal>
        </div>

        {/* Accordion */}
        <div className="faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = activeIndex === idx;
            return (
              <ScrollReveal key={idx} delay={50 * (idx + 1)}>
                <div className={`faq-item ${isOpen ? 'active' : ''}`}>
                  <button
                    className="faq-question"
                    onClick={() => toggleFAQ(idx)}
                    aria-expanded={isOpen}
                  >
                    <span className="faq-question-text">{faq.question}</span>
                    <span className="faq-toggle">
                      <img src="/icons/faq-plus.svg" width="16" height="16" alt="" />
                    </span>
                  </button>
                  <div className="faq-answer-wrap">
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
