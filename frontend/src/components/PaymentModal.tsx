import React, { useState, useEffect } from 'react';
import { X, QrCode, ShieldCheck, CheckCircle2, Copy, Check, Zap, ArrowRight, Wallet, Info, Tag, AlertTriangle } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  orderNumber: string;
  amount: number;
  totalPrice?: number;
  advanceAmount?: number;
  balanceAmount?: number;
  paymentType: 'advance' | 'balance';
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  amount,
  totalPrice = 3200,
  advanceAmount = 960,
  balanceAmount = 2240,
  paymentType,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [customPayAmount, setCustomPayAmount] = useState<number>(amount);
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [quota, setQuota] = useState<{ monthly_limit: number; used: number; remaining: number } | null>(null);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscountPercent, setCouponDiscountPercent] = useState<number>(0);
  const [couponMsg, setCouponMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomPayAmount(amount);
      setUtrNumber('');
      setUtrError('');
      setCouponInput('');
      setAppliedCoupon(null);
      setCouponDiscountPercent(0);
      setCouponMsg(null);
      api.get('/orders/user/payment-quota')
        .then(res => setQuota(res.data))
        .catch(() => {});
    }
  }, [isOpen, amount]);

  if (!isOpen) return null;

  // Amount before coupon
  const basePayAmount = paymentType === 'advance' ? amount : Math.max(1, Math.min(balanceAmount, customPayAmount || 1));
  
  // 10% off if DATTA07 applied
  const discountAmount = appliedCoupon ? Math.round(basePayAmount * (couponDiscountPercent / 100)) : 0;
  const currentPayAmount = Math.max(1, basePayAmount - discountAmount);
  const remainingAfterPayment = Math.max(0, balanceAmount - currentPayAmount);

  const payeeVpa = '7020209079@ybl';
  const payeeName = 'Dattatray Goraksh Hadke';
  const [upiTrRef] = useState(() => `CG${(orderNumber || 'ORD').replace(/[^a-zA-Z0-9]/g, '')}${Date.now().toString().slice(-6)}`);

  // Direct NPCI UPI Intent URL for GPay, PhonePe, Paytm, BHIM with dynamic discounted amount, note & unique tr
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(payeeVpa)}&pn=${encodeURIComponent(payeeName)}&am=${currentPayAmount}&cu=INR&tn=${encodeURIComponent('Order ' + orderNumber)}&tr=${upiTrRef}`;

  // Generate dynamic QR image url containing the direct UPI intent payload
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiIntentUrl)}`;

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    try {
      const res = await api.post('/orders/validate-coupon', { code });
      setAppliedCoupon(res.data.code);
      setCouponDiscountPercent(res.data.discount_percent);
      setCouponMsg({
        text: res.data.message || `🎉 Coupon ${res.data.code} applied! ${res.data.discount_percent}% discount applied.`,
        type: 'success'
      });
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponDiscountPercent(0);
      setCouponMsg({
        text: err.response?.data?.detail || "❌ Invalid or inactive coupon code. Please check and try again.",
        type: 'error'
      });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscountPercent(0);
    setCouponInput('');
    setCouponMsg(null);
  };

  const handleUtrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only accept numeric digits, up to 12 chars
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 12);
    setUtrNumber(cleaned);
    if (cleaned.length > 0 && cleaned.length < 12) {
      setUtrError(`12 digits required (${cleaned.length}/12 entered)`);
    } else {
      setUtrError('');
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(payeeVpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utrNumber.trim();
    if (cleanUtr.length !== 12) {
      setUtrError('UPI Reference Number (UTR) must be exactly 12 numeric digits.');
      return;
    }

    if (submitting) return;

    setSubmitting(true);
    try {
      if (paymentType === 'advance') {
        await api.put(`/orders/${orderId}/confirm-payment`, {
          payment_method: 'upi',
          utr_number: cleanUtr,
          coupon_code: appliedCoupon,
          discount_amount: discountAmount,
        });
        alert(`✅ Payment Submitted! UTR ${cleanUtr} recorded for ₹${currentPayAmount}. Mentor is verifying the transaction receipt against bank statement.`);
      } else {
        const res = await api.post(`/orders/${orderId}/pay-balance`, {
          amount: currentPayAmount,
          payment_method: 'upi',
          utr_number: cleanUtr,
        });
        if (res.data.is_fully_paid) {
          alert(`🎉 Full balance settled! All uncompressed source code files and deliverables are 100% unlocked.`);
        } else {
          alert(`💳 Partial payment of ₹${currentPayAmount} recorded! Remaining payable balance is ₹${res.data.remaining_balance}.`);
        }
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Payment submission failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-brand-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base">
                  {paymentType === 'advance' ? '30% Milestone Advance' : 'Flexible Milestone Balance Payment'}
                </h3>
                {appliedCoupon ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400 line-through">₹{basePayAmount}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2 py-0.5 rounded-full">
                      ₹{currentPayAmount}
                    </span>
                  </div>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ₹{currentPayAmount}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono">{orderNumber}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Coupon Code Section */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-amber-600" /> Have a Coupon Code?
              </span>
              {appliedCoupon && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 10% DISCOUNT APPLIED
                </span>
              )}
            </div>

            {!appliedCoupon ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                  placeholder="Enter promo coupon code"
                  className="flex-1 input-field text-xs font-mono uppercase bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCoupon()}
                  className="btn-primary text-xs px-4 py-2 font-bold shrink-0 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                >
                  Apply
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-200">
                <div className="text-xs">
                  <span className="font-mono font-black text-emerald-700">{appliedCoupon}</span>
                  <span className="text-slate-600 ml-2 font-medium">(-₹{discountAmount} / {couponDiscountPercent}% off)</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline"
                >
                  Remove
                </button>
              </div>
            )}

            {couponMsg ? (
              <p className={`text-[11px] font-semibold ${couponMsg.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
                {couponMsg.text}
              </p>
            ) : (
              <p className="text-[10px] text-slate-500">
                Got a promo coupon? Enter above and click Apply.
              </p>
            )}
          </div>
          
          {/* Balance Overview Banner (When paying balance) */}
          {paymentType === 'balance' && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Total Project Fee:</span>
                <span className="font-bold text-slate-700">₹{totalPrice}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Advance Paid (30%):</span>
                <span className="font-bold text-emerald-600">✓ ₹{advanceAmount}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                <span className="text-slate-900 font-bold flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-purple-600" />
                  Remaining Balance Due:
                </span>
                <span className="font-extrabold text-purple-700 text-sm">
                  ₹{balanceAmount}
                </span>
              </div>

              {/* Partial Payment Amount Selector */}
              <div className="pt-2 border-t border-slate-200/80 space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  How much would you like to pay now? (₹):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min={1}
                    max={balanceAmount}
                    value={customPayAmount}
                    onChange={e => setCustomPayAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Enter amount..."
                  />
                </div>

                {/* Quick Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setCustomPayAmount(balanceAmount)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                      customPayAmount === balanceAmount
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Full Balance (₹{balanceAmount})
                  </button>
                  {balanceAmount > 500 && (
                    <button
                      type="button"
                      onClick={() => setCustomPayAmount(Math.round(balanceAmount / 2))}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg border bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    >
                      50% Share (₹{Math.round(balanceAmount / 2)})
                    </button>
                  )}
                  {balanceAmount >= 500 && (
                    <button
                      type="button"
                      onClick={() => setCustomPayAmount(500)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg border bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    >
                      ₹500
                    </button>
                  )}
                  {balanceAmount >= 1000 && (
                    <button
                      type="button"
                      onClick={() => setCustomPayAmount(1000)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg border bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    >
                      ₹1,000
                    </button>
                  )}
                </div>

                {/* Dynamic Status Callout */}
                <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-200 text-[11px] text-purple-900 leading-normal">
                  {remainingAfterPayment <= 0 ? (
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> This payment will fully settle your project balance and unlock all downloads!
                    </span>
                  ) : (
                    <span>
                      Remaining balance after this payment: <strong>₹{remainingAfterPayment}</strong>. You can pay the remaining portion in future installment(s).
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* QR Code Presentation Box */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0 flex flex-col items-center">
              <img
                src={qrImageUrl}
                alt="Direct UPI Payment QR"
                className="w-36 h-36 object-contain rounded-xl"
              />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Instant Direct UPI QR
              </span>
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Verified Merchant Payee
                </span>
                <h4 className="text-sm font-black text-slate-900 tracking-tight">
                  {payeeName}
                </h4>
                <p className="text-[11px] font-mono text-slate-500">{payeeVpa}</p>
                <div className="mt-1 flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-bold text-slate-700">Payable:</span>
                  <span className="text-base font-black text-emerald-600">₹{currentPayAmount}</span>
                  {appliedCoupon && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                      10% OFF
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-snug">
                Scan with Google Pay, PhonePe, Paytm, or BHIM. Amount and Order Reference are pre-configured in the QR.
              </p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <a
                  href={upiIntentUrl}
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 font-bold shadow-sm bg-gradient-to-r from-emerald-600 to-teal-600"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Pay via UPI App
                </a>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="btn-secondary text-[11px] px-2.5 py-1.5 flex items-center gap-1 font-bold"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Monthly Submissions Quota Tracker */}
          {quota && (
            <div className="flex items-center justify-between text-xs px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-600 font-medium">Monthly Submissions:</span>
              <span className={`font-bold ${quota.remaining > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {quota.used} / {quota.monthly_limit} used ({quota.remaining} remaining this month)
              </span>
            </div>
          )}

          {/* Manual 12-digit UTR Input */}
          <form onSubmit={handleManualUtrSubmit} className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Enter 12-Digit UPI Transaction UTR / RRN *
              </label>
              <span className={`text-[10px] font-mono font-bold ${utrNumber.length === 12 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {utrNumber.length}/12 Digits
              </span>
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={utrNumber}
                onChange={handleUtrChange}
                placeholder="e.g. 412356789012"
                maxLength={12}
                disabled={Boolean(quota && quota.remaining <= 0)}
                className="flex-1 input-field text-xs font-mono tracking-wider"
                required
              />
              <button
                type="submit"
                disabled={submitting || utrNumber.length !== 12 || Boolean(quota && quota.remaining <= 0)}
                className="btn-primary text-xs px-4 py-2 font-bold shrink-0 shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : `Submit ₹${currentPayAmount}`}
              </button>
            </div>
            {quota && quota.remaining <= 0 && (
              <p className="text-[11px] text-red-600 font-bold">
                ⚠️ Monthly limit reached (3 submissions used). Please contact admin on WhatsApp for manual verification.
              </p>
            )}

            {utrError && (
              <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {utrError}
              </p>
            )}

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2 text-[11px] text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Anti-Fraud Protection:</strong> Submitted UTRs are verified against bank receipts. Orders with fake, incomplete, or duplicate UTRs are rejected by the system.
              </span>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};

export default PaymentModal;
