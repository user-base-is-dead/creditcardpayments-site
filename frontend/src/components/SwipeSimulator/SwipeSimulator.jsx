import React, { useState, useRef, useEffect } from 'react';
import './SwipeSimulator.css';

export default function SwipeSimulator() {
  const [amount, setAmount] = useState('50000');
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [swipeState, setSwipeState] = useState('idle'); // idle | swiped | settled
  const [payoutStep, setPayoutStep] = useState(0); // For animating success details
  
  const trackRef = useRef(null);
  const dragStartRef = useRef(0);
  const maxDragDistance = 160; // Track height offset

  // Settle calculations
  const feeRate = 0.0085;
  const feeVal = Math.round((parseFloat(amount) || 0) * feeRate * 100) / 100;
  const settlementVal = Math.max(0, (parseFloat(amount) || 0) - feeVal);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Drag start
  const handleDragStart = (e) => {
    if (swipeState !== 'idle') return;
    setIsDragging(true);
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = clientY - dragY;
  };

  // Drag move
  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging) return;
      
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const calculatedY = clientY - dragStartRef.current;
      
      // Constrain dragging bounds
      const clampedY = Math.max(0, Math.min(calculatedY, maxDragDistance));
      setDragY(clampedY);

      // Trigger swipe once card reaches bottom
      if (clampedY >= maxDragDistance - 10) {
        setIsDragging(false);
        triggerSuccessSequence();
      }
    };

    const handleEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);
      
      // Snap back if not fully swiped
      if (dragY < maxDragDistance - 10) {
        setDragY(0);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragY]);

  // Trigger quick swipe helper
  const triggerQuickSwipe = () => {
    if (swipeState !== 'idle') return;
    
    // Animate slide down
    let currentY = 0;
    const interval = setInterval(() => {
      currentY += 15;
      if (currentY >= maxDragDistance) {
        setDragY(maxDragDistance);
        clearInterval(interval);
        triggerSuccessSequence();
      } else {
        setDragY(currentY);
      }
    }, 20);
  };

  const triggerSuccessSequence = () => {
    setSwipeState('swiped');
    
    // Step 1: Swiping authentication
    setTimeout(() => {
      setPayoutStep(1);
    }, 800);

    // Step 2: Verification confirmation
    setTimeout(() => {
      setPayoutStep(2);
    }, 1800);

    // Step 3: Cash settles!
    setTimeout(() => {
      setPayoutStep(3);
      setSwipeState('settled');
    }, 2800);
  };

  const handleReset = () => {
    setDragY(0);
    setSwipeState('idle');
    setPayoutStep(0);
  };

  const handleWhatsAppRedirect = () => {
    const message = `Hello CreditCardPay!\n\n` +
      `I tested the interactive Swipe Terminal with simulated settings:\n` +
      `- Amount: ${formatCurrency(amount)}\n` +
      `- Flat fee (0.85%): ${formatCurrency(feeVal)}\n` +
      `- Instant Settlement: ${formatCurrency(settlementVal)}\n\n` +
      `Please issue a real-world settlement payment link.`;
    window.open(`https://wa.me/919999999999?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="swipe-simulator-box glass-card">
      <div className="simulator-header">
        <h3 className="sim-title">Interactive Swap Terminal</h3>
        <p className="sim-subtitle">Simulate real-world swipes. Drag card to settle.</p>
      </div>

      {swipeState === 'idle' && (
        <div className="sim-interactive-view">
          {/* Amount input */}
          <div className="sim-amount-selection">
            <label>Choose Swap Amount</label>
            <div className="sim-input-wrapper">
              <span className="currency-symbol">₹</span>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)} 
                min="500" 
                max="500000"
              />
            </div>
            <div className="sim-slider-row">
              <input 
                type="range" 
                min="5000" 
                max="200000" 
                step="5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="sim-slider"
              />
            </div>
            <div className="sim-breakdown">
              <span>Settle Amount: <strong>{formatCurrency(settlementVal)}</strong></span>
              <span>Fee (0.85%): <strong className="text-red">{formatCurrency(feeVal)}</strong></span>
            </div>
          </div>

          {/* Drag Track and Terminal UI */}
          <div className="sim-terminal-zone">
            <div className="terminal-reader" ref={trackRef}>
              <div className="reader-slot"></div>
              
              {/* Draggable Card */}
              <div 
                className={`sim-draggable-card ${isDragging ? 'grabbing' : ''}`}
                style={{ transform: `translateY(${dragY}px)` }}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
              >
                <div className="sim-card-logo">⚡</div>
                <div className="sim-card-chip"></div>
                <div className="sim-card-number">•••• •••• 5000</div>
              </div>

              {/* Drag Guide */}
              {dragY === 0 && (
                <div className="drag-helper-text" onClick={triggerQuickSwipe}>
                  <div className="bounce-arrow">↓</div>
                  Swipe Down to Swap
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {swipeState === 'swiped' && (
        <div className="sim-status-view">
          <div className="terminal-screen neon-shimmer-card">
            <div className="screen-header">PROCESSING TRANSACTION</div>
            <div className="loading-spinner"></div>
            
            <div className="progress-checklist">
              <div className={`check-row ${payoutStep >= 1 ? 'checked' : ''}`}>
                <span className="check-icon">{payoutStep >= 1 ? '✓' : '○'}</span>
                <span>Authenticating Credit Card...</span>
              </div>
              <div className={`check-row ${payoutStep >= 2 ? 'checked' : ''}`}>
                <span className="check-icon">{payoutStep >= 2 ? '✓' : '○'}</span>
                <span>Securing 0.85% Settlement Route...</span>
              </div>
              <div className={`check-row ${payoutStep >= 3 ? 'checked' : ''}`}>
                <span className="check-icon">{payoutStep >= 3 ? '✓' : '○'}</span>
                <span>Initiating Bank Payout Transfer...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {swipeState === 'settled' && (
        <div className="sim-success-view">
          <div className="success-pulse shine-glow">✓</div>
          <h4 className="success-title font-heading">SIMULATION SUCCESSFUL</h4>
          <p className="success-desc">
            Simulated settlement of <strong>{formatCurrency(settlementVal)}</strong> completed in test mode (fee of {formatCurrency(feeVal)} applied).
          </p>

          <div className="receipt-box">
            <div className="receipt-row"><span>Terminal ID</span><span>CP-45892</span></div>
            <div className="receipt-row"><span>Exchange Channel</span><span>Credit Card to Bank</span></div>
            <div className="receipt-row"><span>Transferred Payout</span><span className="accent-green font-bold">{formatCurrency(settlementVal)}</span></div>
            <div className="receipt-row"><span>Service Fee (0.85%)</span><span>{formatCurrency(feeVal)}</span></div>
          </div>

          <div className="success-actions">
            <button onClick={handleWhatsAppRedirect} className="btn btn-primary w-full">
              Settle in Real Life ⚡
            </button>
            <button onClick={handleReset} className="btn btn-secondary w-full">
              Try Another Amount
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
