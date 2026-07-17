import React from 'react';
import Calculator from '../../components/Calculator/Calculator';
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal';
import './CalculatorPage.css';

export default function CalculatorPage() {
  const comparisonData = [
    {
      method: 'CreditCardPay Exchange',
      fee: '0.85% flat',
      settleTime: 'Instant (5 mins)',
      security: 'Bank-Grade (Highly Secure)',
      extra: 'None'
    },
    {
      method: 'Rent/Education Apps (Cred, Paytm, etc.)',
      fee: '2.0% - 3.5% + GST',
      settleTime: '12 - 24 Hours',
      security: 'Medium (Subject to flags)',
      extra: 'Subject to rent validation'
    },
    {
      method: 'Credit Card ATM Cash Advances',
      fee: '3.0% - 4.5% advance fee',
      settleTime: 'Immediate cash',
      security: 'Safe but high penalty',
      extra: '36-48% annualized interest'
    },
    {
      method: 'Offline Card Swipers / Dealers',
      fee: '2.5% - 5.0% commission',
      settleTime: 'Immediate Cash',
      security: 'Highly Risky (No compliance)',
      extra: 'Cash handling risks'
    }
  ];

  return (
    <div className="calculator-page">
      <div className="container calc-page-container">
        {/* Left column: Comparison and benefits */}
        <div className="calc-page-info">
          <ScrollReveal delay={100}>
            <span className="section-badge section-badge-green">TRANSPARENT PRICING</span>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <h1 className="calc-page-title">
              Instant Payout <br />
              <span className="highlight">Exchange Estimator</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <p className="calc-page-desc">
              Calculate your exact settlement funds in seconds. We charge a flat fee of 0.85% with absolutely no setup costs, subscription fees, or hidden markups.
            </p>
          </ScrollReveal>

          {/* Comparison Table */}
          <ScrollReveal delay={400}>
            <div className="comparison-table-wrapper card">
              <h3 className="comp-title">How much do you save?</h3>
              <div className="table-responsive">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Transfer Method</th>
                      <th>Service Fee</th>
                      <th>Settlement Time</th>
                      <th>Hidden Penalties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row, idx) => (
                      <tr key={idx} className={idx === 0 ? 'highlight-row' : ''}>
                        <td className="font-semibold">{row.method}</td>
                        <td className={idx === 0 ? 'accent-green font-bold' : ''}>{row.fee}</td>
                        <td>{row.settleTime}</td>
                        <td className={idx === 0 ? 'accent-green font-semibold' : ''}>{row.extra}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Right column: Interactive widget */}
        <div className="calc-page-widget-wrapper">
          <ScrollReveal delay={200}>
            <Calculator embedded={false} />
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
