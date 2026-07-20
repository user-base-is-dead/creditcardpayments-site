import React, { useState, useEffect } from 'react';
import ScrollReveal from '../ScrollReveal/ScrollReveal';
import './Testimonials.css';

export default function Testimonials() {
  const reviews = [
    {
      name: 'Aditya Verma',
      role: 'Business Owner',
      text: 'Superb service! Exchanged my card limit of ₹80,000 for just ₹680 fees. Got the money in my bank account in 3 minutes. Customer support was extremely helpful.',
      rating: 5
    },
    {
      name: 'Priya Sharma',
      role: 'Freelance Designer',
      text: 'I was hesitant at first, but CreditCardPay is 100% legit. Settled my international client payments at 0.85%. Saved almost 3% compared to other platforms.',
      rating: 5
    },
    {
      name: 'Rahul Mehta',
      role: 'Software Engineer',
      text: 'Very fast UPI settlement. Swapped my RuPay card limit to pay urgent medical bills. The 0.85% charge is way cheaper than ATM cash withdrawal fees.',
      rating: 5
    },
    {
      name: 'Karan Malhotra',
      role: 'Retailer',
      text: 'Using it monthly for vendor payments. Highly reliable transaction flow, RBI guidelines are respected, and payouts are blazing fast. Recommend it to all.',
      rating: 5
    },
    {
      name: 'Sneha Patel',
      role: 'E-commerce Seller',
      text: 'Amazing support team. They guided me through the entire verification process on WhatsApp. Payout was instant. Clean and modern interface.',
      rating: 5
    }
  ];

  const [current, setCurrent] = useState(0);

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [reviews.length]);

  return (
    <section className="testimonials-section">
      <div className="container">
        {/* Header */}
        <div className="testimonials-header text-center">
          <ScrollReveal delay={100}>
            <span className="section-badge">TESTIMONIALS</span>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <h2 className="section-title">
              Trusted Customer <span className="highlight">Feedback</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <p className="section-desc">
              Don't take our word for it. Here's what thousands of users say about our service.
            </p>
          </ScrollReveal>
        </div>

        {/* Carousel */}
        <ScrollReveal delay={300}>
          <div className="testimonial-carousel">
            <div className="carousel-track" style={{ transform: `translateX(-${current * 100}%)` }}>
              {reviews.map((review, idx) => (
                <div key={idx} className="testimonial-slide">
                  <div className="testimonial-card">
                    <div className="quote-icon">
                      <img src="/icons/quote.svg" width="32" height="32" alt="" />
                    </div>
                    <p className="testimonial-text">{review.text}</p>
                    <div className="testimonial-stars">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <span key={i} className="star">★</span>
                      ))}
                    </div>
                    <div className="testimonial-author">
                      <div className="author-avatar">
                        {review.name.charAt(0)}
                      </div>
                      <div className="author-info">
                        <span className="author-name">{review.name}</span>
                        <span className="author-role">{review.role}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dots */}
            <div className="carousel-dots">
              {reviews.map((_, idx) => (
                <button
                  key={idx}
                  className={`dot ${current === idx ? 'active' : ''}`}
                  onClick={() => setCurrent(idx)}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
