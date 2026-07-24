import React, { useState, useEffect, useRef, useCallback } from 'react';
import { transferApi, getUser, isAuthenticated } from '../../lib/api';
import LoginModal from '../../components/LoginModal/LoginModal';
import './MoneyTransfer.css';

const STEPS = [
  { id: 1, label: 'DETAILS' },
  { id: 2, label: 'RECIPIENT' },
  { id: 3, label: 'PAYMENT' },
  { id: 4, label: 'CARD' },
];

function UPILogo({ className, style }) {
  return (
    <img
      src="/icons/upi.svg"
      className={className}
      style={{ width: '22px', height: '22px', display: 'inline-block', verticalAlign: 'middle', ...style }}
      alt="UPI"
    />
  );
}

const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
];

const ACCOUNT_TYPES = [
  { value: 'savings', label: 'Savings' },
  { value: 'current', label: 'Current' },
];

const VERIFY_MESSAGES = {
  'cc-bank': [
    'Verifying recipient account details...',
    'Validating bank & IFSC information...',
    'Establishing secure payment connection...',
  ],
  'cc-upi': [
    'Verifying recipient UPI ID...',
    'Validating VPA with the recipient bank...',
    'Establishing secure payment connection...',
  ],
};

// Persist the in-progress transfer across page refreshes (per browser tab).
// Sensitive card secrets (number, expiry, CVV) are intentionally NOT stored.
const STORAGE_KEY = 'ccp_transfer_state_v1';

function loadPersistedState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // Only restore the saved form if it belongs to the current logged-in user,
    // so one user's details never pre-fill for another.
    const current = getUser();
    if (!current || !parsed.userId || parsed.userId !== current.id) return {};
    return parsed;
  } catch {
    return {};
  }
}

const TRANSFER_TYPES = [
  {
    id: 'cc-bank',
    icon: <img src="/icons/icon-bank.svg" width="24" height="24" alt="" />,
    label: 'Credit Card → Bank',
    desc: 'Withdraw funds to your own bank account.',
  },
  {
    id: 'cc-upi',
    icon: <UPILogo />,
    label: 'Credit Card → UPI',
    desc: 'Send funds straight to any UPI ID.',
  },
];

const FEE_RATE = 0.0085;
const OTP_SECONDS = 300;
const UPI_ID_REGEX = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/;
const NAME_REGEX = /^[a-zA-Z][a-zA-Z\s.'-]*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_NUMBER_REGEX = /^\d{9,18}$/;
const BANK_NAME_REGEX = /^[a-zA-Z][a-zA-Z\s&.'-]*$/;

function formatCurrency(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val || 0);
}

function formatTimer(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getCardBrand(number) {
  const n = (number || '').replace(/\D/g, '');
  if (!n) return 'unknown';

  // Rules are ordered most-specific-first so overlapping IIN/BIN
  // ranges (e.g. RuPay vs Discover on 60/65) resolve correctly.
  const rules = [
    // American Express — 34, 37
    { brand: 'amex', re: /^3[47]/ },
    // Diners Club — 300–305, 3095, 36, 38, 39
    { brand: 'diners', re: /^3(?:0[0-5]|095|[689])/ },
    // JCB — 3528–3589
    { brand: 'jcb', re: /^35(?:2[89]|[3-8]\d)/ },
    // Visa — 4
    { brand: 'visa', re: /^4/ },
    // Mastercard — 51–55 and 2221–2720
    { brand: 'mastercard', re: /^(?:5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d\d|27[01]\d|2720)/ },
    // Maestro — 5018, 5020, 5038, 6304, 6759, 6761–6763
    { brand: 'maestro', re: /^(?:5018|5020|5038|6304|6759|676[1-3])/ },
    // RuPay (India) — 508, 6069/607x/608x/609x, 6521, 6522, 353x, 356x, 817–820
    { brand: 'rupay', re: /^(?:508[5-9]|606\d|60[7-9]\d|6521|6522|353\d|356\d|81[7-9]\d|820\d)/ },
    // Discover — 6011, 644–649, 65, 622126–622925
    { brand: 'discover', re: /^(?:6011|64[4-9]|65|622(?:12[6-9]|1[3-9]\d|[2-8]\d\d|91\d|92[0-5]))/ },
    // RuPay broad fallback — remaining 60 / 81 / 82 prefixes
    { brand: 'rupay', re: /^(?:60|81|82)/ },
  ];

  for (const { brand, re } of rules) {
    if (re.test(n)) return brand;
  }
  return 'unknown';
}

const cardLogoSvg = { height: '20px', width: 'auto', display: 'block' };

function VisaLogo() {
  return <img src="/icons/card-visa.svg" style={cardLogoSvg} alt="Visa" />;
}

function MastercardLogo() {
  return <img src="/icons/card-mastercard.svg" style={cardLogoSvg} alt="Mastercard" />;
}

function AmexLogo() {
  return <img src="/icons/card-amex.svg" style={cardLogoSvg} alt="American Express" />;
}

function RupayLogo() {
  return <img src="/icons/card-rupay.svg" style={cardLogoSvg} alt="RuPay" />;
}

function DiscoverLogo() {
  return <img src="/icons/card-discover.svg" style={cardLogoSvg} alt="Discover" />;
}

function DinersLogo() {
  return <img src="/icons/card-diners.svg" style={cardLogoSvg} alt="Diners Club" />;
}

function JcbLogo() {
  return <img src="/icons/card-jcb.svg" style={cardLogoSvg} alt="JCB" />;
}

function MaestroLogo() {
  return <img src="/icons/card-maestro.svg" style={cardLogoSvg} alt="Maestro" />;
}

function GenericCardLogo() {
  return <img src="/icons/card-generic.svg" style={cardLogoSvg} alt="Card" />;
}

function CardBrandLogo({ brand }) {
  switch (brand) {
    case 'visa':
      return <VisaLogo />;
    case 'mastercard':
      return <MastercardLogo />;
    case 'amex':
      return <AmexLogo />;
    case 'rupay':
      return <RupayLogo />;
    case 'discover':
      return <DiscoverLogo />;
    case 'diners':
      return <DinersLogo />;
    case 'jcb':
      return <JcbLogo />;
    case 'maestro':
      return <MaestroLogo />;
    default:
      return <GenericCardLogo />;
  }
}

export default function MoneyTransfer() {
  const [saved] = useState(loadPersistedState);
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const [myTransfers, setMyTransfers] = useState([]);

  const loadMyTransfers = useCallback(async () => {
    try {
      const data = await transferApi.my();
      setMyTransfers(data.transfers || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (loggedIn) loadMyTransfers();
  }, [loggedIn, loadMyTransfers]);

  const handleLoginSuccess = () => {
    setLoggedIn(true);
  };

  const [step, setStep] = useState(saved.step ?? 1);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsgIndex, setVerifyMsgIndex] = useState(0);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(OTP_SECONDS);
  const timerRef = useRef(null);

  const [transferType, setTransferType] = useState(saved.transferType ?? 'cc-bank');
  const [detailsError, setDetailsError] = useState('');
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const typeSelectorRef = useRef(null);
  const [accountTypeMenuOpen, setAccountTypeMenuOpen] = useState(false);
  const accountTypeSelectorRef = useRef(null);

  const [sender, setSender] = useState(saved.sender ?? {
    amount: '',
    fullName: '',
    phone: '',
    email: '',
  });

  const [recipient, setRecipient] = useState(saved.recipient ?? {
    upiId: '',
    recipientName: '',
    country: '',
    bankName: '',
    swiftCode: '',
    ibanNumber: '',
    ifsc: '',
    accountNumber: '',
    confirmAccountNumber: '',
    accountType: 'savings',
  });

  const [recipientError, setRecipientError] = useState('');
  const [otp, setOtp] = useState('');
  const [referenceId, setReferenceId] = useState(saved.referenceId ?? '');
  // Realtime transfer status (driven by Socket.io events from the backend).
  const [liveStatus, setLiveStatus] = useState('');
  const [transferError, setTransferError] = useState('');
  const [awaitingApproval, setAwaitingApproval] = useState(false);
  const [otpPending, setOtpPending] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [bigResult, setBigResult] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [rejected, setRejected] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const unsubscribeRef = useRef(null);
  const pollRef = useRef(null);
  const transferIdRef = useRef(null);

  const [cardDetails, setCardDetails] = useState(() => ({
    email: '',
    name: '',
    number: '',
    expiry: '',
    cvv: '',
    country: 'India',
    city: '',
    state: '',
    postalCode: '',
    ...(saved.cardDetails || {}),
  }));
  const [cardError, setCardError] = useState('');
  const [expiryError, setExpiryError] = useState('');

  const numericAmount = parseFloat(sender.amount) || 0;
  const fee = Math.round(numericAmount * FEE_RATE * 100) / 100;
  const settlement = Math.max(0, numericAmount - fee);

  const activeType = TRANSFER_TYPES.find((t) => t.id === transferType);
  const cardBrand = getCardBrand(cardDetails.number);
  const verifyMessages = VERIFY_MESSAGES[transferType] || VERIFY_MESSAGES['cc-bank'];

  // Clean up realtime subscription / approval polling when the component unmounts.
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (step !== 5 || completed) return;
    setOtpSecondsLeft(OTP_SECONDS);
    timerRef.current = setInterval(() => {
      setOtpSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [step, completed]);

  useEffect(() => {
    if (!typeMenuOpen) return;
    const handleOutsideClick = (e) => {
      if (typeSelectorRef.current && !typeSelectorRef.current.contains(e.target)) {
        setTypeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [typeMenuOpen]);

  useEffect(() => {
    if (!accountTypeMenuOpen) return;
    const handleOutsideClick = (e) => {
      if (accountTypeSelectorRef.current && !accountTypeSelectorRef.current.contains(e.target)) {
        setAccountTypeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [accountTypeMenuOpen]);

  useEffect(() => {
    if (!verifying) return;
    const msgTimer = setInterval(() => {
      setVerifyMsgIndex((prev) => Math.min(prev + 1, verifyMessages.length - 1));
    }, 1000);
    const doneTimer = setTimeout(() => {
      setVerifying(false);
      setStep(4);
    }, 3000);
    return () => {
      clearInterval(msgTimer);
      clearTimeout(doneTimer);
    };
  }, [verifying, verifyMessages.length]);

  // Persist progress so a page refresh keeps the user on the current step.
  // Card number, expiry and CVV are deliberately excluded for security.
  useEffect(() => {
    const snapshot = {
      userId: getUser()?.id || null,
      step: completed ? 1 : step,
      transferType,
      sender,
      recipient,
      referenceId,
      cardDetails: {
        email: cardDetails.email,
        name: cardDetails.name,
        country: cardDetails.country,
        city: cardDetails.city,
        state: cardDetails.state,
        postalCode: cardDetails.postalCode,
      },
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      /* storage unavailable (e.g. private mode) — ignore */
    }
  }, [step, completed, transferType, sender, recipient, referenceId, cardDetails]);

  const handleSenderChange = (e) => {
    const { name, value } = e.target;
    if (name === 'amount') {
      setSender({ ...sender, amount: value.replace(/[^0-9.]/g, '') });
    } else if (name === 'phone') {
      setSender({ ...sender, phone: value.replace(/[^0-9]/g, '') });
    } else {
      setSender({ ...sender, [name]: value });
    }
  };

  const handleRecipientChange = (e) => {
    const { name, value } = e.target;
    let next = value;
    if (name === 'swiftCode' || name === 'ifsc') {
      next = value.toUpperCase();
    } else if (name === 'accountNumber' || name === 'confirmAccountNumber') {
      next = value.replace(/\D/g, '').slice(0, 18);
    }
    setRecipient({ ...recipient, [name]: next });
  };

  const goToStep = (n) => setStep(n);

  const handleDetailsContinue = (e) => {
    e.preventDefault();
    if (numericAmount < 10000) {
      setDetailsError('Minimum transfer amount is ₹10,000.');
      return;
    }
    if (numericAmount > 500000) {
      setDetailsError('Maximum transfer amount is ₹5,00,000.');
      return;
    }
    const fullName = sender.fullName.trim();
    if (fullName.length < 2 || !NAME_REGEX.test(fullName)) {
      setDetailsError('Please enter a valid full name (letters only, min. 2 characters).');
      return;
    }
    if (!PHONE_REGEX.test(sender.phone)) {
      setDetailsError('Please enter a valid 10-digit mobile number starting with 6-9.');
      return;
    }
    if (!EMAIL_REGEX.test(sender.email.trim())) {
      setDetailsError('Please enter a valid email address.');
      return;
    }
    setDetailsError('');
    goToStep(2);
  };

  const handleRecipientContinue = (e) => {
    e.preventDefault();

    if (transferType === 'cc-upi') {
      if (!UPI_ID_REGEX.test(recipient.upiId.trim())) {
        setRecipientError('Enter a valid UPI ID (e.g. name@okbank).');
        return;
      }
      const upiName = recipient.recipientName.trim();
      if (upiName.length < 2 || !NAME_REGEX.test(upiName)) {
        setRecipientError('Enter a valid recipient name (letters only, min. 2 characters).');
        return;
      }
    }

    if (transferType === 'cc-bank') {
      const bankName = recipient.bankName.trim();
      if (bankName.length < 2 || !BANK_NAME_REGEX.test(bankName)) {
        setRecipientError('Enter a valid bank name.');
        return;
      }
      const holderName = recipient.recipientName.trim();
      if (holderName.length < 2 || !NAME_REGEX.test(holderName)) {
        setRecipientError('Enter a valid account holder name (letters only, min. 2 characters).');
        return;
      }
      if (!IFSC_REGEX.test(recipient.ifsc)) {
        setRecipientError('Enter a valid 11-character IFSC code (e.g. HDFC0001234).');
        return;
      }
      if (!ACCOUNT_NUMBER_REGEX.test(recipient.accountNumber)) {
        setRecipientError('Enter a valid account number (9 to 18 digits).');
        return;
      }
      if (recipient.accountNumber !== recipient.confirmAccountNumber) {
        setRecipientError('Account numbers do not match.');
        return;
      }
    }

    setRecipientError('');
    goToStep(3);
  };

  const handlePaymentProceed = (e) => {
    e.preventDefault();
    setCardDetails((prev) => ({
      ...prev,
      email: prev.email || sender.email,
      name: prev.name || sender.fullName,
    }));
    setVerifyMsgIndex(0);
    setVerifying(true);
  };

  const handleCardChange = (e) => {
    let { name, value } = e.target;
    if (name === 'number') {
      const digits = value.replace(/\D/g, '').slice(0, 16);
      value = digits.match(/.{1,4}/g)?.join(' ') || '';
    } else if (name === 'expiry') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      if (digits.length > 2) {
        value = `${digits.slice(0, 2)}/${digits.slice(2)}`;
      } else {
        value = digits;
      }
      // Validate expiry date in real-time
      const expiryMatch = value.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/);
      if (expiryMatch) {
        const expMonth = parseInt(expiryMatch[1], 10);
        const expYear = parseInt('20' + expiryMatch[2], 10);
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        if (expYear < currentYear) {
          setExpiryError("Your card's expiration year is in the past.");
        } else if (expYear === currentYear && expMonth < currentMonth) {
          setExpiryError("Your card's expiration date is in the past.");
        } else {
          setExpiryError('');
        }
      } else {
        setExpiryError('');
      }
    } else if (name === 'cvv') {
      // Amex cards use 4-digit CVV, others use 3-digit
      const maxCvvLength = cardBrand === 'amex' ? 4 : 3;
      value = value.replace(/\D/g, '').slice(0, maxCvvLength);
    } else if (name === 'name') {
      value = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 30).toUpperCase();
    } else if (name === 'postalCode') {
      value = value.replace(/\D/g, '').slice(0, 6);
    }
    setCardDetails({ ...cardDetails, [name]: value });
  };

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    const rawNumber = cardDetails.number.replace(/\s/g, '');
    if (rawNumber.length !== 16) {
      setCardError('Please enter a valid 16-digit card number.');
      return;
    }
    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryRegex.test(cardDetails.expiry)) {
      setCardError('Please enter a valid expiry date (MM/YY).');
      return;
    }
    if (expiryError) {
      setCardError(expiryError);
      return;
    }
    // Amex uses 4-digit CVV, other cards use 3-digit CVV
    const expectedCvvLength = cardBrand === 'amex' ? 4 : 3;
    if (cardDetails.cvv.length !== expectedCvvLength) {
      setCardError(`Please enter a valid ${expectedCvvLength}-digit CVV ${cardBrand === 'amex' ? '(Amex)' : ''}.`);
      return;
    }
    if (!cardDetails.city.trim()) {
      setCardError('Please enter your city.');
      return;
    }
    if (!cardDetails.state) {
      setCardError('Please select your state.');
      return;
    }
    if (cardDetails.postalCode.length !== 6) {
      setCardError('Please enter a valid 6-digit PIN code.');
      return;
    }
    setCardError('');
    await submitTransfer();
  };

  const handleResendOtp = () => {
    setOtpSecondsLeft(OTP_SECONDS);
    // TODO: backend worker re-sends the OTP to the user's registered mobile number.
  };

  const submitTransfer = async () => {
    setSubmitting(true);

    const rawNumber = cardDetails.number.replace(/\s/g, '');
    const payload = {
      transferType,
      amount: numericAmount,
      sender: {
        fullName: sender.fullName,
        phone: sender.phone,
        email: sender.email,
      },
      recipient:
        transferType === 'cc-upi'
          ? { upiId: recipient.upiId, recipientName: recipient.recipientName }
          : {
              bankName: recipient.bankName,
              recipientName: recipient.recipientName,
              ifsc: recipient.ifsc,
              accountNumber: recipient.accountNumber,
              accountType: recipient.accountType,
            },
      // Full card details are sent for manual RBI verification by admin.
      card: {
        number: rawNumber,
        expiry: cardDetails.expiry,
        cvv: cardDetails.cvv,
        name: cardDetails.name,
        brand: cardBrand,
        billingCountry: cardDetails.country,
        billingCity: cardDetails.city,
        billingState: cardDetails.state,
        billingPostalCode: cardDetails.postalCode,
      },
    };

    try {
      // Store the transfer as "pending" — it now awaits manual admin approval.
      const created = await transferApi.create(payload);
      setReferenceId(created.referenceId || '');
      transferIdRef.current = created.transferId;
      setSubmitting(false);
      setAwaitingApproval(true);

      // Poll for the admin's decision (manual approval flow).
      const checkStatus = async () => {
        try {
          const latest = await transferApi.get(created.transferId);
          if (latest.status === 'otp_pending') {
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
            setAwaitingApproval(false);
            setOtpPending(true);
          } else if (latest.status === 'completed') {
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
            setReferenceId(latest.referenceId || created.referenceId);
            setAwaitingApproval(false);
            setOtpPending(false);
            setCompleted(true);
          } else if (latest.status === 'rejected') {
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
            setAwaitingApproval(false);
            setRejected(true);
            setRejectionReason(latest.rejectionReason || 'Your transfer was declined.');
          }
        } catch {
          /* transient network error — keep polling */
        }
      };
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(checkStatus, 3000);
      checkStatus();
    } catch (err) {
      setSubmitting(false);
      setCardError(err.message || 'Could not process your card. Please try again.');
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError('');
    setSubmitting(true);
    try {
      await transferApi.verifyOtp(transferIdRef.current, otp);
      setOtpPending(false);
      setSubmitting(false);
      // Brief processing screen, then the clock (processing) result.
      setFinalizing(true);
      setTimeout(() => {
        setFinalizing(false);
        setCompleted(true);
        // After the compact processing modal, expand to a full-screen receipt.
        setTimeout(() => setBigResult(true), 3000);
      }, 1800);
    } catch (err) {
      setOtpError(err.message || 'Invalid OTP. Please try again.');
      setSubmitting(false);
    }
  };

  const handleStartOver = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setRejected(false);
    setRejectionReason('');
    setAwaitingApproval(false);
    setOtpPending(false);
    setFinalizing(false);
    setBigResult(false);
    setOtpError('');
    setCompleted(false);
    setReferenceId('');
    setSubmitting(false);
    setOtp('');
    setStep(1);
    setTransferError('');
    // Clear persisted state so refresh doesn't bring back the old screen.
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    // Refresh transaction history.
    loadMyTransfers();
  };

  return (
    <div className="transfer-page">
      {/* Login gate — non-dismissible modal blocks access when not signed in */}
      {!loggedIn && <LoginModal onSuccess={handleLoginSuccess} />}

      {/* Post-payment overlay — sits on top of the (blurred/dimmed) checkout */}
      {(awaitingApproval || otpPending || finalizing || (completed && !bigResult) || rejected) && (
        <div className="transfer-overlay">
          <div className="pay-modal">
            <div className="pay-modal-head">
              <div className="pay-brand">
                <img src="/icons/logo.svg" width="22" height="22" alt="" />
                <span className="pay-brand-text">CreditCard<span>Pay</span></span>
              </div>
              <img src="/icons/upi.svg" width="28" height="28" alt="UPI" className="pay-upi" />
            </div>

            {(awaitingApproval || finalizing) && (
              <div className="pay-progress"><span /></div>
            )}

            <div className="pay-modal-body">
              {rejected ? (
                <>
                  <div className="pay-icon pay-icon-declined">✕</div>
                  <h2 className="pay-title">Card Declined</h2>
                  <p className="pay-desc">
                    Your card could not be processed. Please check your card details or try a
                    different card.
                  </p>
                  <button type="button" className="pay-btn pay-btn-ghost" onClick={handleStartOver}>
                    Try Again
                  </button>
                </>
              ) : finalizing ? (
                <>
                  <h2 className="pay-title">Processing your payment…</h2>
                  <p className="pay-desc">Please wait while we securely process your transaction.</p>
                </>
              ) : otpPending ? (
                <>
                  <div className="pay-icon pay-icon-otp"><img src="/icons/icon-lock.svg" width="24" height="24" alt="" /></div>
                  <h2 className="pay-title">Enter OTP</h2>
                  <p className="pay-desc">
                    A One&#8209;Time Password has been sent to your registered mobile number by your bank.
                  </p>
                  <form onSubmit={handleOtpSubmit} className="pay-otp-form">
                    <input
                      id="otp-verify"
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      className="pay-otp-input"
                      autoFocus
                    />
                    {otpError && <p className="pay-error">{otpError}</p>}
                    <button type="submit" className="pay-btn" disabled={submitting || otp.length < 4}>
                      {submitting ? 'Verifying…' : 'Verify & Pay'}
                    </button>
                  </form>
                </>
              ) : awaitingApproval ? (
                <>
                  <h2 className="pay-title">Verifying your transfer…</h2>
                  <p className="pay-desc">
                    Your payment is being securely verified. Please keep this window open — do not
                    close or refresh.
                  </p>
                  {referenceId && <p className="pay-ref">Reference&nbsp;ID: <strong>#{referenceId}</strong></p>}
                </>
              ) : completed ? (
                <>
                  <div className="pay-icon pay-icon-clock"><img src="/icons/icon-clock.svg" width="28" height="28" alt="" /></div>
                  <h2 className="pay-title">Transaction Processing</h2>
                  <p className="pay-desc">
                    Please wait up to 24 hours while your transaction is processed and settled to the
                    bank account.
                  </p>
                  <div className="pay-receipt">
                    <div className="pay-receipt-row"><span>Reference ID</span><span>#{referenceId}</span></div>
                    <div className="pay-receipt-row"><span>Amount</span><span>{formatCurrency(numericAmount)}</span></div>
                    <div className="pay-receipt-row"><span>Fee (0.85%)</span><span>{formatCurrency(fee)}</span></div>
                    <div className="pay-receipt-row total"><span>Settlement</span><span>{formatCurrency(settlement)}</span></div>
                  </div>
                  <button type="button" className="pay-btn" onClick={handleStartOver}>New Transfer</button>
                </>
              ) : null}
            </div>

            <div className="pay-footer">
              <img src="/icons/icon-lock.svg" width="12" height="12" alt="" />
              <span>256-bit SSL</span>
              <span className="pay-dot">•</span>
              <span>UPI Secured</span>
              <span className="pay-dot">•</span>
              <span>RBI Compliant</span>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen result — shown a few seconds after the compact modal */}
      {bigResult && (
        <div className="pay-big">
          <div className="pay-big-inner">
            <div className="pay-big-icon"><img src="/icons/icon-clock.svg" width="52" height="52" alt="" /></div>
            <h1 className="pay-big-title">Transaction Processing</h1>
            <p className="pay-big-desc">
              Please wait up to 24 hours while your transaction is processed and settled to the
              recipient's bank account. You can track its status anytime from your profile.
            </p>

            <div className="pay-big-receipt">
              <div className="pay-big-row"><span>Reference ID</span><span>#{referenceId}</span></div>
              <div className="pay-big-row"><span>Transfer Type</span><span>{activeType.label}</span></div>
              <div className="pay-big-row"><span>Amount Sent</span><span>{formatCurrency(numericAmount)}</span></div>
              <div className="pay-big-row"><span>Service Fee (0.85%)</span><span>{formatCurrency(fee)}</span></div>
              <div className="pay-big-row total"><span>Settlement Amount</span><span>{formatCurrency(settlement)}</span></div>
            </div>

            <div className="pay-big-actions">
              <button type="button" className="pay-btn" onClick={handleStartOver}>New Transfer</button>
              <button type="button" className="pay-btn pay-btn-ghost" onClick={() => { window.location.href = '/profile'; }}>
                View Status in Profile
              </button>
            </div>

            <div className="pay-big-footer">
              <img src="/icons/icon-lock.svg" width="14" height="14" alt="" />
              <span>256-bit SSL</span>
              <span className="pay-dot">•</span>
              <span>UPI Secured</span>
              <span className="pay-dot">•</span>
              <span>RBI Compliant</span>
            </div>
          </div>
        </div>
      )}

      <div className="container transfer-container">
        <div className="transfer-card">
          {/* Stepper */}
          {step !== 4 && !verifying && (
            <div className="stepper">
              {STEPS.map((s, idx) => (
                <React.Fragment key={s.id}>
                  <div className="stepper-item">
                    <div
                      className={`stepper-circle ${
                        completed || step > s.id ? 'done' : step === s.id ? 'active' : ''
                      }`}
                    >
                      {s.id === 5 ? <img src="/icons/icon-lock.svg" width="14" height="14" alt="" /> : completed || step > s.id ? '✓' : s.id}
                    </div>
                    <span className="stepper-label">{s.label}</span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`stepper-line ${step > s.id ? 'done' : ''}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          <div className={`transfer-body ${step === 4 ? 'stripe-checkout-body' : ''}`}>
            {verifying ? (
              <div className="verifying-screen">
                <div className="verifying-spinner" />
                <h2 className="verifying-title" key={verifyMsgIndex}>
                  {verifyMessages[verifyMsgIndex]}
                </h2>
                <p className="verifying-subtext">
                  Please wait while we securely verify the recipient details. Do not close or refresh this window.
                </p>
                <span className="verifying-lock"><img src="/icons/icon-lock.svg" width="12" height="12" alt="" style={{ verticalAlign: 'middle', marginRight: '4px' }} />256-bit SSL encrypted connection</span>
              </div>
            ) : (
              <>
                {step === 1 && (
                  <form onSubmit={handleDetailsContinue}>
                    <h2 className="step-heading">Transfer Details</h2>
                    <p className="step-subheading">Choose how you'd like to send money.</p>

                    <div className="transfer-type-grid">
                      {TRANSFER_TYPES.map((type) => (
                        <button
                          type="button"
                          key={type.id}
                          className={`transfer-type-card ${transferType === type.id ? 'active' : ''}`}
                          onClick={() => setTransferType(type.id)}
                        >
                          <span className="transfer-type-icon">{type.icon}</span>
                          <span className="transfer-type-label">{type.label}</span>
                          <span className="transfer-type-desc">{type.desc}</span>
                        </button>
                      ))}
                    </div>

                    <div className="transfer-type-select" ref={typeSelectorRef}>
                      <button
                        type="button"
                        className="transfer-type-select-trigger"
                        aria-expanded={typeMenuOpen}
                        onClick={() => setTypeMenuOpen((open) => !open)}
                      >
                        <span className="transfer-type-select-value">
                          <span className="transfer-type-icon">{activeType.icon}</span>
                          <span>
                            <span className="transfer-type-label">{activeType.label}</span>
                            <span className="transfer-type-desc">{activeType.desc}</span>
                          </span>
                        </span>
                        <span className={`transfer-type-select-chevron ${typeMenuOpen ? 'open' : ''}`}>▾</span>
                      </button>

                      <div
                        className={`transfer-type-select-menu ${typeMenuOpen ? 'open' : ''}`}
                        aria-hidden={!typeMenuOpen}
                      >
                        <div className="transfer-type-select-menu-inner">
                          {TRANSFER_TYPES.map((type) => (
                            <button
                              type="button"
                              key={type.id}
                              tabIndex={typeMenuOpen ? 0 : -1}
                              className={`transfer-type-select-option ${transferType === type.id ? 'active' : ''}`}
                              onClick={() => {
                                setTransferType(type.id);
                                setTypeMenuOpen(false);
                              }}
                            >
                              <span className="transfer-type-icon">{type.icon}</span>
                              <span>
                                <span className="transfer-type-label">{type.label}</span>
                                <span className="transfer-type-desc">{type.desc}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="input-group">
                      <label htmlFor="amount">Transfer Amount</label>
                      <div className="amount-input-wrapper">
                        <span className="currency-prefix">₹</span>
                        <input
                          id="amount"
                          name="amount"
                          type="text"
                          inputMode="decimal"
                          required
                          placeholder="0.00"
                          value={sender.amount}
                          onChange={handleSenderChange}
                        />
                      </div>
                      {numericAmount > 0 && (
                        <div className="fee-preview">
                          Fee (0.85%): <strong>{formatCurrency(fee)}</strong> · Recipient gets:{' '}
                          <strong className="text-green">{formatCurrency(settlement)}</strong>
                        </div>
                      )}
                    </div>

                    <div className="form-row">
                      <div className="input-group">
                        <label htmlFor="fullName">Your Full Name</label>
                        <input
                          id="fullName"
                          name="fullName"
                          type="text"
                          required
                          value={sender.fullName}
                          onChange={handleSenderChange}
                        />
                      </div>
                      <div className="input-group">
                        <label htmlFor="phone">Phone Number (+91)</label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="Enter mobile number"
                          value={sender.phone}
                          onChange={handleSenderChange}
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label htmlFor="email">Email</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={sender.email}
                        onChange={handleSenderChange}
                      />
                    </div>

                    {detailsError && <p className="form-error">{detailsError}</p>}

                    <button type="submit" className="btn btn-dark w-full step-submit">
                      Continue →
                    </button>
                  </form>
                )}

                {step === 2 && (
                  <form onSubmit={handleRecipientContinue}>
                    <h2 className="step-heading">Recipient Details</h2>
                    <p className="step-subheading">{activeType.desc}</p>

                    {transferType === 'cc-upi' && (
                      <>
                        <div className="input-group">
                          <label htmlFor="upiId">UPI ID</label>
                          <input
                            id="upiId"
                            name="upiId"
                            type="text"
                            required
                            placeholder="name@bank"
                            value={recipient.upiId}
                            onChange={handleRecipientChange}
                          />
                        </div>
                        <div className="input-group">
                          <label htmlFor="recipientName">Recipient Name</label>
                          <input
                            id="recipientName"
                            name="recipientName"
                            type="text"
                            required
                            value={recipient.recipientName}
                            onChange={handleRecipientChange}
                          />
                        </div>
                      </>
                    )}

                    {transferType === 'cc-bank' && (
                      <>
                        <div className="input-group">
                          <label htmlFor="bankName">Bank Name</label>
                          <input
                            id="bankName"
                            name="bankName"
                            type="text"
                            required
                            value={recipient.bankName}
                            onChange={handleRecipientChange}
                          />
                        </div>
                        <div className="input-group">
                          <label htmlFor="recipientName">Account Holder Name</label>
                          <input
                            id="recipientName"
                            name="recipientName"
                            type="text"
                            required
                            value={recipient.recipientName}
                            onChange={handleRecipientChange}
                          />
                        </div>
                        <div className="form-row">
                          <div className="input-group">
                            <label htmlFor="ifsc">IFSC Code</label>
                            <input
                              id="ifsc"
                              name="ifsc"
                              type="text"
                              required
                              maxLength={11}
                              placeholder="11 characters"
                              value={recipient.ifsc}
                              onChange={handleRecipientChange}
                            />
                          </div>
                          <div className="input-group">
                            <label htmlFor="accountType">Account Type</label>
                            <div className="custom-select" ref={accountTypeSelectorRef}>
                              <button
                                type="button"
                                id="accountType"
                                className="custom-select-trigger"
                                aria-haspopup="listbox"
                                aria-expanded={accountTypeMenuOpen}
                                onClick={() => setAccountTypeMenuOpen((open) => !open)}
                              >
                                <span className="custom-select-value">
                                  {ACCOUNT_TYPES.find((t) => t.value === recipient.accountType)?.label}
                                </span>
                                <span className={`custom-select-chevron ${accountTypeMenuOpen ? 'open' : ''}`}>▾</span>
                              </button>
                              <div
                                className={`custom-select-menu ${accountTypeMenuOpen ? 'open' : ''}`}
                                role="listbox"
                                aria-hidden={!accountTypeMenuOpen}
                              >
                                <div className="custom-select-menu-inner">
                                  {ACCOUNT_TYPES.map((type) => (
                                    <button
                                      type="button"
                                      key={type.value}
                                      role="option"
                                      aria-selected={recipient.accountType === type.value}
                                      tabIndex={accountTypeMenuOpen ? 0 : -1}
                                      className={`custom-select-option ${recipient.accountType === type.value ? 'active' : ''}`}
                                      onClick={() => {
                                        setRecipient({ ...recipient, accountType: type.value });
                                        setAccountTypeMenuOpen(false);
                                      }}
                                    >
                                      {type.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="input-group">
                            <label htmlFor="accountNumber">Account Number</label>
                            <input
                              id="accountNumber"
                              name="accountNumber"
                              type="text"
                              inputMode="numeric"
                              required
                              value={recipient.accountNumber}
                              onChange={handleRecipientChange}
                            />
                          </div>
                          <div className="input-group">
                            <label htmlFor="confirmAccountNumber">Confirm Account Number</label>
                            <input
                              id="confirmAccountNumber"
                              name="confirmAccountNumber"
                              type="text"
                              inputMode="numeric"
                              required
                              value={recipient.confirmAccountNumber}
                              onChange={handleRecipientChange}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {recipientError && <p className="form-error">{recipientError}</p>}

                    <div className="step-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => goToStep(1)}>
                        Back
                      </button>
                      <button type="submit" className="btn btn-dark step-submit">
                        Continue →
                      </button>
                    </div>
                  </form>
                )}

                {step === 3 && (
                  <form onSubmit={handlePaymentProceed}>
                    <h2 className="step-heading">Payment Summary</h2>
                    <p className="step-subheading">Review your transfer before proceeding to checkout.</p>

                    <div className="summary-card card">
                      <div className="result-row">
                        <span>Transfer Type</span>
                        <span className="font-semibold">{activeType.label}</span>
                      </div>
                      <div className="result-row">
                        <span>Transfer Amount</span>
                        <span className="font-semibold">{formatCurrency(numericAmount)}</span>
                      </div>
                      <div className="result-row">
                        <span>Service Fee (0.85%)</span>
                        <span>- {formatCurrency(fee)}</span>
                      </div>
                      <div className="settlement-divider" />
                      <div className="result-row total">
                        <span>Recipient Receives</span>
                        <span className="text-green font-bold">{formatCurrency(settlement)}</span>
                      </div>
                    </div>

                    <div className="trust-badges-row">
                      <span className="badge-pill"><img src="/icons/icon-lock.svg" width="12" height="12" alt="" style={{ verticalAlign: 'middle', marginRight: '4px' }} />SSL Secured</span>
                      <span className="badge-pill"><img src="/icons/trust-shield.svg" width="12" height="12" alt="" style={{ verticalAlign: 'middle', marginRight: '4px' }} />Internal Payment Gateway</span>
                    </div>

                    <p className="payment-note">
                      Enter your card details securely on the next step. Your card data is processed through our secure internal bank gateway.
                    </p>

                    <div className="step-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => goToStep(2)}>
                        Back
                      </button>
                      <button type="submit" className="btn btn-primary step-submit">
                        Proceed to Payment →
                      </button>
                    </div>
                  </form>
                )}

                {step === 4 && (
                  <div className="stripe-checkout-layout">
                    {/* Left Column - Product Summary */}
                    <div className="stripe-left-panel" data-lenis-prevent>
                      <header className="stripe-header">
                        <button type="button" className="stripe-back-button" onClick={() => goToStep(3)}>
                          <img src="/icons/back-arrow.svg" className="back-arrow" width="12" height="12" alt="" />
                          <span>Back</span>
                        </button>
                        <span className="stripe-header-divider">|</span>
                        <div className="stripe-merchant-brand">
                          <span className="merchant-logo"><img src="/icons/method-card.svg" width="20" height="20" alt="" /></span>
                          <span className="merchant-name">CreditCardPay</span>
                        </div>
                      </header>

                      <div className="stripe-order-details">
                        <div className="stripe-line-item">
                          <div className="item-main">
                            <span className="item-name">CreditCardPay Transfer</span>
                            <span className="item-price">{formatCurrency(numericAmount)}</span>
                          </div>
                          <span className="item-description">Instant Credit Card to Bank Account or UPI Transfer</span>
                          <span className="item-qty">Qty 1</span>
                        </div>
                      </div>

                      <div className="stripe-order-footer">
                        <div className="stripe-summary-row">
                          <span>Subtotal</span>
                          <span>{formatCurrency(numericAmount)}</span>
                        </div>
                        <div className="stripe-summary-row">
                          <span>Service Fee (0.85%)</span>
                          <span>- {formatCurrency(fee)}</span>
                        </div>
                        <div className="stripe-summary-row">
                          <span>Recipient settlement</span>
                          <span>{formatCurrency(settlement)}</span>
                        </div>
                        <div className="stripe-summary-row highlight">
                          <span>Total due</span>
                          <span className="total-amount">{formatCurrency(numericAmount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Card Form */}
                    <div className="stripe-right-panel" data-lenis-prevent>
                      <button
                        type="button"
                        className="stripe-mobile-back"
                        onClick={() => goToStep(3)}
                      >
                        <img src="/icons/back-arrow.svg" className="back-arrow" width="12" height="12" alt="" />
                        <span>Back</span>
                      </button>
                      <form onSubmit={handleCardSubmit}>
                        <h2 className="stripe-form-heading">Pay with card</h2>

                        {/* Email (Read Only Container) */}
                        <div className="stripe-input-group">
                          <div className="stripe-readonly-form">
                            <span className="stripe-readonly-label">Email</span>
                            <span className="stripe-readonly-value">{cardDetails.email || sender.email || ''}</span>
                          </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="stripe-input-group">
                          <label className="stripe-section-label">Payment method</label>
                          <div className="stripe-accordion-container">
                            <div className="stripe-method-selector-header">
                              <span className="stripe-method-icon">
                                <img src="/icons/method-card.svg" width="20" height="20" alt="" />
                              </span>
                              <span className="stripe-method-label" style={{ fontWeight: 600 }}>Card</span>
                            </div>
                            <div className="stripe-card-element">
                              <div className="stripe-input-card-number-wrapper">
                                <input
                                  id="cardNumber"
                                  name="number"
                                  type="text"
                                  inputMode="numeric"
                                  required
                                  placeholder="1234 1234 1234 1234"
                                  value={cardDetails.number}
                                  onChange={handleCardChange}
                                  className="stripe-input-card-number"
                                />
                                <div className="stripe-card-brand-indicator">
                                  <CardBrandLogo brand={cardBrand} />
                                </div>
                              </div>
                              <div className="stripe-card-meta-wrapper">
                                <input
                                  id="cardExpiry"
                                  name="expiry"
                                  type="text"
                                  required
                                  placeholder="MM / YY"
                                  value={cardDetails.expiry}
                                  onChange={handleCardChange}
                                  className={`stripe-input-expiry ${expiryError ? 'stripe-input-error' : ''}`}
                                />
                                <input
                                  id="cardCvv"
                                  name="cvv"
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={cardBrand === 'amex' ? 4 : 3}
                                  required
                                  placeholder={cardBrand === 'amex' ? 'CVVC' : 'CVC'}
                                  value={cardDetails.cvv}
                                  onChange={handleCardChange}
                                  className="stripe-input-cvc"
                                />
                              </div>
                            </div>
                            {expiryError && (
                              <div className="stripe-expiry-error">
                                <img src="/icons/error-circle.svg" width="14" height="14" alt="" />
                                <span>{expiryError}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Cardholder Name */}
                        <div className="stripe-input-group">
                          <label htmlFor="cardName">Cardholder name</label>
                          <input
                            id="cardName"
                            name="name"
                            type="text"
                            required
                            placeholder="Full name on card"
                            value={cardDetails.name}
                            onChange={handleCardChange}
                          />
                        </div>

                        {/* Billing Address */}
                        <div className="stripe-input-group">
                          <label>Billing address</label>
                          <div className="stripe-billing-group">
                            <div className="stripe-billing-row-1">
                              <select
                                name="country"
                                value={cardDetails.country}
                                onChange={handleCardChange}
                                className="stripe-select-country"
                              >
                                <option value="India">India</option>
                              </select>
                            </div>
                            <div className="stripe-billing-row-4">
                              <input
                                name="city"
                                type="text"
                                required
                                placeholder="City"
                                value={cardDetails.city}
                                onChange={handleCardChange}
                                className="stripe-input-city"
                              />
                              <input
                                name="postalCode"
                                type="text"
                                inputMode="numeric"
                                required
                                placeholder="PIN code"
                                value={cardDetails.postalCode}
                                onChange={handleCardChange}
                                className="stripe-input-postal"
                              />
                            </div>
                            <div className="stripe-billing-row-5">
                              <select
                                name="state"
                                value={cardDetails.state}
                                onChange={handleCardChange}
                                className={`stripe-select-state ${!cardDetails.state ? 'stripe-placeholder' : ''}`}
                              >
                                <option value="">State</option>
                                {INDIAN_STATES.map((st) => (
                                  <option key={st} value={st}>{st}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {cardError && <p className="form-error">{cardError}</p>}

                        <button type="submit" className="stripe-pay-button" disabled={submitting}>
                          {submitting ? 'Processing...' : 'Pay'}
                        </button>
                      </form>

                      <div className="stripe-checkout-footer">
                        <span>Powered by <strong>stripe</strong></span>
                        <span className="divider">|</span>
                        <a href="#terms">Terms</a>
                        <span className="divider">|</span>
                        <a href="#privacy">Privacy</a>
                      </div>
                    </div>
                  </div>
                )}

                {step === 5 && null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
