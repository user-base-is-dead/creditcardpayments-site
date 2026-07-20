import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Docs.css';

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'services', label: 'Services' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'fees-limits', label: 'Fees & limits' },
  { id: 'supported', label: 'Supported cards' },
  { id: 'security', label: 'Security & compliance' },
  { id: 'faq', label: 'FAQ' },
];

const steps = [
  { n: 1, title: 'Log in securely', text: 'Sign in with your mobile number to access your account.' },
  { n: 2, title: 'Add bank & amount', text: "Enter the recipient's bank or UPI details and the amount. Fees are calculated instantly." },
  { n: 3, title: 'Enter card details', text: 'Pay with your credit card through our secure, PCI-aware checkout.' },
  { n: 4, title: 'Instant transfer', text: 'Funds are settled to the recipient bank account, typically within 5 minutes.' },
];

const services = [
  {
    id: 'send-money',
    title: 'Send Money',
    text: 'Transfer funds from your credit card to any bank account — in India or abroad — in just a few clicks. Ideal for quick payouts to yourself or others.',
  },
  {
    id: 'interest-money',
    title: 'Interest Money',
    text: 'Save on interest by moving high-cost debt to lower-interest options via a direct transfer, using your available card limit to pay down expensive balances.',
  },
  {
    id: 'bank-transfer',
    title: 'Bank Transfer',
    text: 'The core of our service: seamless, instant credit-card-to-bank transactions settled via IMPS/NEFT, typically within 5 minutes.',
  },
  {
    id: 'invest-money',
    title: 'Invest Money',
    text: 'Fund your investment or trading accounts directly from your credit card through our secure gateway, so you never miss an opportunity.',
  },
];

const faqs = [
  {
    question: 'How does the credit card to bank transfer work?',
    answer:
      "Enter your transfer amount, provide the recipient's bank/UPI details, and complete the payment with your credit card. Funds settle to the recipient's account within about 5 minutes via IMPS/NEFT/UPI.",
  },
  {
    question: 'Why is the service charge only 0.85%?',
    answer:
      'We use API-based bulk merchant settlement routes. Processing high volumes directly with digital bank settlement partners removes multiple intermediate margins (usually 2–4%), and we pass the savings to you.',
  },
  {
    question: 'Which credit cards and bank accounts are supported?',
    answer:
      'All major credit cards — VISA, Mastercard, RuPay, and American Express — from any Indian bank. Transfers can be made to any Indian bank account via IMPS, NEFT, or UPI.',
  },
  {
    question: 'What happens if my transaction fails?',
    answer:
      'In the rare event of a failed transaction, the full amount is automatically refunded to your credit card within 24–48 hours. Support is available 24/7.',
  },
  {
    question: 'Is there any limit on the amount I can transfer?',
    answer:
      'The minimum transfer amount is ₹10,000 and the maximum is ₹5,00,000 per transaction. Daily limits may vary based on your credit card limit and bank policies.',
  },
  {
    question: 'Is this service safe and RBI compliant?',
    answer:
      'Yes. All transactions are processed through RBI-licensed payment gateways with 3D Secure verification. We use 256-bit SSL encryption and never store your card details.',
  },
];

export default function Docs() {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('overview');
  const [openFaq, setOpenFaq] = useState(0);

  // Highlight the section currently in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Scroll to the section referenced by the URL hash (e.g. /docs#send-money),
  // e.g. when arriving from a homepage "View Details" link. Keyed on
  // location.key so it re-runs on every navigation (even to the same hash).
  useEffect(() => {
    const id = location.hash.slice(1);
    if (!id) return;

    // Clean baseline: jump to top instantly, then smooth-scroll to the target
    // once layout has settled (two animation frames). An absolute Y from
    // getBoundingClientRect keeps it reliable regardless of Lenis' state.
    if (window.lenis && typeof window.lenis.scrollTo === 'function') {
      window.lenis.scrollTo(0, { immediate: true });
    }

    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (!el) return;
        const y = el.getBoundingClientRect().top + window.scrollY - 96;
        if (window.lenis && typeof window.lenis.scrollTo === 'function') {
          window.lenis.scrollTo(y);
        } else {
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
        setActiveSection('services');
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [location.hash, location.key]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActiveSection(id);
    // Use Lenis if available (smooth-scroll aware), else native.
    if (window.lenis && typeof window.lenis.scrollTo === 'function') {
      window.lenis.scrollTo(el, { offset: -96 });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="docs">
      <div className="docs-shell">
        {/* Sidebar navigation */}
        <aside className="docs-sidebar">
          <div className="docs-sidebar-inner">
            <p className="docs-sidebar-eyebrow">Documentation</p>
            <nav className="docs-nav" aria-label="Documentation sections">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`docs-nav-link ${activeSection === s.id ? 'active' : ''}`}
                  onClick={() => scrollToSection(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </nav>
            <div className="docs-sidebar-cta">
              <Link to="/money-transfer" className="docs-sidebar-btn">Start a transfer →</Link>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="docs-main">
          <header className="docs-head">
            <nav className="docs-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span aria-hidden="true">/</span>
              <span>Docs</span>
            </nav>
            <h1 className="docs-title">CreditCardPay Documentation</h1>
            <p className="docs-lede">
              A complete guide to our credit&#8209;card&#8209;to&#8209;bank &amp; UPI transfer
              service — how it works, pricing, limits, supported cards, and security.
            </p>
            <div className="docs-meta">
              <span className="docs-badge">v1.0</span>
              <span className="docs-meta-sep">·</span>
              <span>Product Documentation</span>
            </div>
          </header>

          <section id="overview" className="docs-section">
            <h2>Overview</h2>
            <p>
              CreditCardPay lets you move money from your credit card to any Indian bank account or
              UPI ID at a flat <strong>0.85%</strong> fee. Transactions are processed through
              RBI&#8209;licensed payment gateways and typically settle within five minutes.
            </p>
            <div className="docs-note">
              <span className="docs-note-icon" aria-hidden="true">ℹ</span>
              <p>
                This documentation describes the standard consumer transfer flow. Amounts, fees, and
                settlement times are indicative and may vary with your card issuer and bank policies.
              </p>
            </div>
          </section>

          <hr className="docs-divider" />

          <section id="services" className="docs-section">
            <h2>Services</h2>
            <p>What you can do with CreditCardPay:</p>
            <div className="docs-services">
              {services.map((s) => (
                <div key={s.id} id={s.id} className="docs-service">
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
          </section>

          <hr className="docs-divider" />

          <section id="how-it-works" className="docs-section">
            <h2>How it works</h2>
            <p>A transfer moves through four steps, from sign&#8209;in to settlement:</p>
            <ol className="docs-steps">
              {steps.map((s) => (
                <li key={s.n} className="docs-step">
                  <span className="docs-step-num">{s.n}</span>
                  <div className="docs-step-body">
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <hr className="docs-divider" />

          <section id="fees-limits" className="docs-section">
            <h2>Fees &amp; limits</h2>
            <p>Pricing is a single flat rate — no hidden charges.</p>
            <table className="docs-table">
              <tbody>
                <tr>
                  <th scope="row">Service fee</th>
                  <td>0.85% flat on the transfer amount</td>
                </tr>
                <tr>
                  <th scope="row">Minimum transfer</th>
                  <td>₹10,000 per transaction</td>
                </tr>
                <tr>
                  <th scope="row">Maximum transfer</th>
                  <td>₹5,00,000 per transaction</td>
                </tr>
                <tr>
                  <th scope="row">Settlement time</th>
                  <td>Typically within 5 minutes</td>
                </tr>
                <tr>
                  <th scope="row">Daily limits</th>
                  <td>May vary based on your credit card limit and bank policies</td>
                </tr>
              </tbody>
            </table>
          </section>

          <hr className="docs-divider" />

          <section id="supported" className="docs-section">
            <h2>Supported cards &amp; transfers</h2>
            <ul className="docs-list">
              <li><strong>Cards:</strong> VISA, Mastercard, RuPay, and American Express from any Indian bank.</li>
              <li><strong>Payout rails:</strong> IMPS, NEFT, and UPI to any Indian bank account.</li>
              <li><strong>Recipients:</strong> your own account or any third&#8209;party bank account / UPI ID.</li>
            </ul>
          </section>

          <hr className="docs-divider" />

          <section id="security" className="docs-section">
            <h2>Security &amp; compliance</h2>
            <ul className="docs-list">
              <li>Transactions run through RBI&#8209;licensed payment gateways with 3D&nbsp;Secure verification.</li>
              <li>256&#8209;bit SSL encryption on every connection.</li>
              <li>We never store your full card number or CVV.</li>
            </ul>
            <div className="docs-note docs-note-success">
              <span className="docs-note-icon" aria-hidden="true">✓</span>
              <p>
                Card data is tokenised at the gateway. Only non&#8209;sensitive metadata (card brand
                and last four digits) is ever retained by CreditCardPay.
              </p>
            </div>
          </section>

          <hr className="docs-divider" />

          <section id="faq" className="docs-section">
            <h2>Frequently asked questions</h2>
            <div className="docs-faq">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className={`docs-faq-item ${isOpen ? 'open' : ''}`}>
                    <button
                      type="button"
                      className="docs-faq-q"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                    >
                      <span>{faq.question}</span>
                      <span className="docs-faq-chevron" aria-hidden="true">›</span>
                    </button>
                    {isOpen && (
                      <div className="docs-faq-a">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <footer className="docs-foot">
            <div>
              <h3>Ready to move money at the lowest rates?</h3>
              <p>Start a transfer or reach out to our team.</p>
            </div>
            <div className="docs-foot-actions">
              <Link to="/money-transfer" className="docs-btn docs-btn-primary">Start a transfer</Link>
              <Link to="/contact" className="docs-btn docs-btn-secondary">Contact us</Link>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
