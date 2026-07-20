import React, { useState } from 'react';
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal';
import { contactApi } from '../../lib/api';
import { CONTACT_PHONE_DISPLAY } from '../../config';
import './Contact.css';

const contactInfo = [
  {
    iconSrc: '/icons/icon-phone.svg',
    label: 'Call Us',
    value: CONTACT_PHONE_DISPLAY || 'Available on request',
    href: CONTACT_PHONE_DISPLAY ? `tel:${CONTACT_PHONE_DISPLAY.replace(/\s+/g, '')}` : null,
  },
  {
    iconSrc: '/icons/icon-mail.svg',
    label: 'Mail Us',
    value: 'support@creditcardpay.com',
    href: 'mailto:support@creditcardpay.com',
  },
  {
    iconSrc: '/icons/icon-pin.svg',
    label: 'Address',
    value: 'India',
    href: null,
  },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | submitting | sent | error

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      await contactApi.submit(form);
      setStatus('sent');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="container contact-hero-inner">
          <ScrollReveal delay={100}>
            <span className="section-badge section-badge-green">CONTACT US</span>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <h1 className="contact-title">
              We're Here to <span className="highlight">Help</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <p className="contact-subtitle">
              Have a question about a transfer, fees, or your account? Reach out and our team
              will get back to you.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="contact-body section-padding">
        <div className="container contact-grid">
          {/* Info cards */}
          <ScrollReveal delay={100}>
            <div className="contact-info-list">
              {contactInfo.map((item) => {
                const Wrapper = item.href ? 'a' : 'div';
                return (
                  <Wrapper key={item.label} href={item.href || undefined} className="contact-info-card card">
                    <span className="contact-info-icon"><img src={item.iconSrc} width="24" height="24" alt="" /></span>
                    <div>
                      <span className="contact-info-label">{item.label}</span>
                      <span className="contact-info-value">{item.value}</span>
                    </div>
                  </Wrapper>
                );
              })}
            </div>
          </ScrollReveal>

          {/* Form */}
          <ScrollReveal delay={200}>
            <form className="contact-form card" onSubmit={handleSubmit}>
              <h3 className="contact-form-title">Send us a message</h3>

              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="subject">Subject</label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  required
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                />
              </div>

              <div className="input-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us more..."
                />
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Sending...' : 'Send Message'}
              </button>

              {status === 'sent' && <p className="form-status form-status-success">Message sent. We'll be in touch soon.</p>}
              {status === 'error' && <p className="form-status form-status-error">Something went wrong. Please try again.</p>}
            </form>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
