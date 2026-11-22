import React, { useState, useEffect } from 'react';
import { X, QrCode, ShieldCheck, CheckCircle2, Copy, Check, Zap, ArrowRight, Wallet, Info } from 'lucide-react';
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
  const [submitting, setSubmitting] = useState(false);
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCustomPayAmount(amount);
      setUtrNumber('');
    }
  }, [isOpen, amount]);

  if (!isOpen) return null;

  const currentPayAmount = paymentType === 'advance' ? amount : Math.max(1, Math.min(balanceAmount, customPayAmount || 1));
  const remainingAfterPayment = Math.max(0, balanceAmount - currentPayAmount);

  const razorpayLink = 'https://razorpay.me/@dattatraygorakshhadke';
  const payeeName = 'Dattatray Goraksh Hadke';
  const upiId = 'razorpay.me/@dattatraygorakshhadke';
  const upiIntent = razorpayLink;

  // Generate QR image url pointing to the verified Razorpay payment page
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(razorpayLink)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(razorpayLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim() || submitting) return;

    setSubmitting(true);
    try {
      if (paymentType === 'advance') {
        await api.put(`/orders/${orderId}/confirm-payment`, {
          payment_method: 'upi',
          utr_number: utrNumber.trim(),
        });
        alert(`Advance payment confirmed! Development has been initiated.`);
      } else {
        const res = await api.post(`/orders/${orderId}/pay-balance`, {
          amount: currentPayAmount,
          payment_method: 'upi',
          utr_number: utrNumber.trim(),
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
      alert(getErrorMessage(err, 'Payment confirmation failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateWebhook = async () => {
    setSimulatingWebhook(true);
    try {
      await api.post('/orders/payments/webhook', {
        order_number: orderNumber,
        payment_type: paymentType,
        amount: currentPayAmount,
        transaction_id: `RZP_LIVE_${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      });
      alert(`⚡ Automated Razorpay Webhook Callback Executed! Payment of ₹${currentPayAmount} confirmed.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Webhook simulation failed'));
    } finally {
      setSimulatingWebhook(false);
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
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ₹{currentPayAmount}
                </span>
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
        <div className="p-6 space-y-5">
          
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
                alt="Razorpay UPI Payment QR"
                className="w-32 h-32 object-contain rounded-xl"
              />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Powered by Razorpay
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
              </div>

              <p className="text-xs text-slate-600 leading-snug">
                Scan using Google Pay, PhonePe, Paytm, or BHIM, or open the secure Razorpay payment page directly.
              </p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <a
                  href={razorpayLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 font-bold shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Pay on Razorpay
                </a>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="btn-secondary text-[11px] px-2.5 py-1.5 flex items-center gap-1 font-bold"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Link Copied' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>

          {/* Instant 1-Click Automated Gateway Simulation (Admin Only) */}
          {user?.role === 'admin' && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-purple-600 fill-purple-600" /> Admin Fast Approval Webhook:
                </span>
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                  Admin Only
                </span>
              </div>
              <p className="text-[11px] text-purple-700 leading-relaxed">
                Simulate a live Razorpay/Cashfree webhook callback to auto-approve this transaction of ₹{currentPayAmount} immediately.
              </p>
              <button
                type="button"
                onClick={handleSimulateWebhook}
                disabled={simulatingWebhook}
                className="w-full btn-accent text-xs py-2.5 font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                {simulatingWebhook ? 'Verifying Webhook...' : `Simulate Instant ₹${currentPayAmount} Webhook Approval`}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Manual 12-digit UTR Input */}
          <form onSubmit={handleManualUtrSubmit} className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700">
              Enter 12-Digit UPI Transaction UTR:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={utrNumber}
                onChange={e => setUtrNumber(e.target.value)}
                placeholder="12-digit bank reference number"
                className="flex-1 input-field text-xs font-mono"
              />
              <button
                type="submit"
                disabled={submitting || !utrNumber.trim()}
                className="btn-primary text-xs px-4 py-2 font-bold shrink-0"
              >
                {submitting ? 'Confirming...' : `Submit ₹${currentPayAmount}`}
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};

export default PaymentModal;
