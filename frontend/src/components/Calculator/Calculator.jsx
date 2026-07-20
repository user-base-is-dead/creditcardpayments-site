import React, { useState, useEffect } from 'react';
import { whatsAppUrl } from '../../config';
import './Calculator.css';

export default function Calculator({ embedded = false }) {
  const [amount, setAmount] = useState('10000');
  const [transferType, setTransferType] = useState('cc-bank');
  const [calculations, setCalculations] = useState({
    fee: 0,
    settlement: 0,
    time: 'Instant (5 Mins)'
  });

  const rate = 0.0085; // 0.85%

  useEffect(() => {
    const numAmount = parseFloat(amount.replace(/[^0-9]/g, '')) || 0;
    const computedFee = Math.round(numAmount * rate * 100) / 100;
    const computedSettlement = Math.max(0, numAmount - computedFee);
    
    let timeText = 'Instant (5 Mins)';
    if (transferType === 'upi-wallet') {
      timeText = 'Instant (2 Mins)';
    }

    setCalculations({
      fee: computedFee,
      settlement: computedSettlement,
      time: timeText
    });
  }, [amount, transferType]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setAmount(val);
  };

  const handleProceed = () => {
    const numAmt = parseFloat(amount) || 0;
    const formattedAmt = formatCurrency(numAmt);
    const formattedSettlement = formatCurrency(calculations.settlement);
    const formattedFee = formatCurrency(calculations.fee);
    
    let typeLabel = 'Credit Card to Bank';
    if (transferType === 'upi-wallet') typeLabel = 'UPI & Wallet Transfer';

    const message = `Hello CreditCardPay! I want to execute a transfer.\n\n` +
      `- Type: ${typeLabel}\n` +
      `- Amount: ${formattedAmt}\n` +
      `- Service Fee (0.85%): ${formattedFee}\n` +
      `- Settle Amount: ${formattedSettlement}\n` +
      `- Expected Settlement: ${calculations.time}\n\n` +
      `Please guide me with the bank transfer payment link.`;

    window.open(whatsAppUrl(message), '_blank');
  };

  return (
    <div className={`calculator-container ${embedded ? 'embedded-calc' : ''}`}>
      <div className="calculator-card card">
        <h3 className="calc-title">Swap Calculator</h3>
        <p className="calc-subtitle">Calculate exact settlement values in real-time</p>
        
        {/* Form Inputs */}
        <div className="calc-form">
          <div className="input-group">
            <label htmlFor="amount-input">Transfer Amount (₹)</label>
            <div className="amount-input-wrapper">
              <span className="currency-prefix">₹</span>
              <input 
                id="amount-input"
                type="text" 
                value={amount ? Number(amount).toLocaleString('en-IN') : ''}
                onChange={handleAmountChange}
                placeholder="Enter amount"
              />
            </div>
            <div className="amount-helper">Min: ₹100 | Max: ₹5,00,000</div>
          </div>

          <div className="input-group">
            <label htmlFor="transfer-type">Select Exchange Channel</label>
            <select 
              id="transfer-type"
              value={transferType} 
              onChange={(e) => setTransferType(e.target.value)}
            >
              <option value="cc-bank">Credit Card to Bank (0.85% Fee)</option>
              <option value="upi-wallet">UPI & Wallet Settlement (0.85% Fee)</option>
            </select>
          </div>
        </div>

        {/* Calculations display */}
        <div className="calc-results">
          <div className="result-row">
            <span className="result-label">Exchange Rate / Fee</span>
            <span className="result-value text-green">0.85% Flat</span>
          </div>
          <div className="result-row">
            <span className="result-label">Computed Service Fee</span>
            <span className="result-value text-red">- {formatCurrency(calculations.fee)}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Settlement Timeline</span>
            <span className="result-value font-medium">{calculations.time}</span>
          </div>
          
          <div className="settlement-divider"></div>
          
          <div className="result-row settlement-total">
            <span className="total-label">You Will Receive</span>
            <span className="total-value text-green">{formatCurrency(calculations.settlement)}</span>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleProceed}
          disabled={!amount || parseFloat(amount) < 100}
          className="btn btn-primary calc-proceed w-full"
        >
          Proceed to Exchange <img src="/icons/icon-bolt-white.svg" width="14" height="14" alt="" style={{ verticalAlign: 'middle' }} />
        </button>
        
        <div className="trust-footer">
          <img src="/icons/icon-lock.svg" width="12" height="12" alt="" style={{ verticalAlign: 'middle', marginRight: '4px' }} />Secured 256-bit payment gateway. No card details stored.
        </div>
      </div>
    </div>
  );
}
