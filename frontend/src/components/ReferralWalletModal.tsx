import React, { useState, useEffect } from 'react';
import { X, Gift, Copy, Check, Share2, Sparkles, Trophy, Wallet, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../services/api';

interface WalletData {
  referral_code: string;
  referral_link: string;
  wallet_balance: number;
  total_referred: number;
  ambassador_tier: string;
  reward_per_referral: number;
  benefits: string[];
  recent_referrals: Array<{
    id: number;
    name: string;
    college: string;
    reward_earned: number;
    date: string;
  }>;
}

interface ReferralWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferralWalletModal: React.FC<ReferralWalletModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchWallet = async () => {
      setLoading(true);
      try {
        const res = await api.get('/referrals/my-wallet');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load wallet data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleShareWhatsApp = () => {
    if (!data) return;
    const text = `Hey! Use my referral code *${data.referral_code}* to get flat ₹200 OFF on your college final year engineering / capstone project on CampusGig! Order here: ${data.referral_link}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-slide-up">
        
        {/* Header Strip */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center font-bold backdrop-blur-md">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-100 bg-black/20 px-2.5 py-0.5 rounded-full">
                  Campus Ambassador Program
                </span>
              </div>
              <h3 className="font-black text-white text-base mt-0.5">
                Referral Hub &amp; Cash Wallet
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          
          {loading ? (
            <div className="text-center py-10 text-slate-400">Loading wallet &amp; referral stats...</div>
          ) : data ? (
            <>
              {/* Wallet Balance Hero Card */}
              <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl text-white shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-amber-400" />
                    <span className="text-slate-300 font-semibold text-xs">Available Wallet Balance</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                    {data.ambassador_tier}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-white">₹{data.wallet_balance.toFixed(2)}</span>
                  <span className="text-xs text-slate-400">Cashback credit</span>
                </div>

                <p className="text-[11px] text-slate-300">
                  Earn ₹{data.reward_per_referral} for every junior or batchmate who completes a project using your referral code.
                </p>
              </div>

              {/* Referral Code & WhatsApp Share */}
              <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-3">
                <span className="text-[11px] font-bold text-slate-700 block">Your Exclusive Ambassador Code:</span>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border-2 border-dashed border-orange-300 p-2.5 rounded-xl text-center font-mono font-black text-base text-orange-600 tracking-wider">
                    {data.referral_code}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(data.referral_code);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="btn-secondary text-xs px-3.5 py-2.5 font-bold shrink-0 flex items-center gap-1.5"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs shadow-md shadow-emerald-600/20 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share on WhatsApp (+ Flat ₹200 Off for Friends)</span>
                </button>
              </div>

              {/* Ambassador Perks */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Ambassador Privileges</span>
                <div className="grid grid-cols-1 gap-1.5">
                  {data.benefits.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-600 text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs px-4 py-2 font-bold"
            >
              Close
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
