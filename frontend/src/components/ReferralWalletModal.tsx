import React, { useState, useEffect } from 'react';
import {
  X, Gift, Copy, Check, Share2, Sparkles, Trophy, Wallet, ArrowRight,
  ShieldCheck, Clock, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownLeft,
  Users, DollarSign, Award, HelpCircle, ExternalLink
} from 'lucide-react';
import api from '../services/api';

interface ReferralItem {
  id: number;
  name: string;
  college: string;
  status: 'pending' | 'completed' | 'rejected';
  reward_amount: number;
  qualifying_order?: string | null;
  credited_at?: string | null;
  date: string;
}

interface WalletTxItem {
  id: number;
  amount: number;
  transaction_type: 'credit' | 'debit';
  description: string;
  reference_id?: string | null;
  date: string;
}

interface WalletData {
  referral_code: string;
  referral_link: string;
  wallet_balance: number;
  total_referred: number;
  successful_referrals: number;
  pending_referrals: number;
  total_rewards_earned: number;
  ambassador_tier: string;
  program_enabled: boolean;
  reward_per_referral: number;
  referred_discount: number;
  benefits: string[];
  referral_history: ReferralItem[];
  wallet_transactions: WalletTxItem[];
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
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'transactions' | 'rules'>('overview');

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
    const text = `Hey! Use my referral code *${data.referral_code}* to get flat ₹${int(data.referred_discount || 200)} OFF on your college final year capstone project or academic assistance on CampusGig AI! Order here: ${data.referral_link}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  function int(val: number | undefined): number {
    return Math.round(val || 0);
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-slide-up my-auto max-h-[92vh] flex flex-col">
        
        {/* Header Strip */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center font-bold backdrop-blur-md">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-100 bg-black/20 px-2.5 py-0.5 rounded-full">
                  Campus Ambassador Dashboard
                </span>
              </div>
              <h3 className="font-black text-white text-base mt-0.5">
                Referral &amp; Reward Wallet
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 shrink-0 text-xs font-bold overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & Wallet', icon: Wallet },
            { id: 'referrals', label: `My Referrals (${data?.referral_history?.length || 0})`, icon: Users },
            { id: 'transactions', label: `Passbook Ledger (${data?.wallet_transactions?.length || 0})`, icon: DollarSign },
            { id: 'rules', label: 'Tier Benefits & Rules', icon: Award },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-brand-600 text-brand-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {loading ? (
            <div className="text-center py-16 text-slate-400 space-y-3">
              <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-medium text-xs">Loading your Ambassador wallet and referral data...</p>
            </div>
          ) : data ? (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  {/* Hero Balance Card */}
                  <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-amber-400" />
                        <span className="text-slate-300 font-semibold text-xs">Available Wallet Balance</span>
                      </div>
                      <span className="text-xs font-bold text-amber-400 bg-amber-400/15 px-3 py-1 rounded-full border border-amber-400/30 flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5" />
                        {data.ambassador_tier}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-4xl sm:text-5xl font-black text-white">₹{data.wallet_balance.toFixed(2)}</span>
                      <span className="text-xs text-slate-400 font-medium">Ready for Project Checkout</span>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-white/10 text-center">
                      <div className="p-2 rounded-xl bg-white/5">
                        <span className="text-[10px] text-slate-400 block uppercase">Total Referred</span>
                        <strong className="text-base font-black text-white">{data.total_referred}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-white/5">
                        <span className="text-[10px] text-emerald-400 block uppercase">Successful</span>
                        <strong className="text-base font-black text-emerald-400">{data.successful_referrals}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-white/5">
                        <span className="text-[10px] text-amber-400 block uppercase">Pending Orders</span>
                        <strong className="text-base font-black text-amber-400">{data.pending_referrals}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-white/5">
                        <span className="text-[10px] text-slate-400 block uppercase">Total Earned</span>
                        <strong className="text-base font-black text-amber-300">₹{int(data.total_rewards_earned)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Shareable Code & Link Box */}
                  <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200/80 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Your Shareable Ambassador Assets</span>
                      <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                        ₹{int(data.reward_per_referral)} per successful friend
                      </span>
                    </div>

                    {/* Code Input Box */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Referral Code (Students enter during registration):</label>
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
                          <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Link Input Box */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Shareable Direct Signup Link:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={data.referral_link}
                          className="flex-1 bg-white border border-orange-200 p-2 rounded-xl text-xs font-mono text-slate-700 select-all"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(data.referral_link);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }}
                          className="btn-secondary text-xs px-3 py-2 font-bold shrink-0 flex items-center gap-1.5"
                        >
                          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                        </button>
                      </div>
                    </div>

                    {/* WhatsApp Action */}
                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs shadow-md shadow-emerald-600/20 transition-all"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share on WhatsApp (+ Flat ₹{int(data.referred_discount)} Discount for Batchmates)</span>
                    </button>
                  </div>

                  {/* Highlights of Benefits */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Ambassador Privileges</span>
                    <div className="grid grid-cols-1 gap-2">
                      {data.benefits.map((b, i) => (
                        <div key={i} className="flex items-start gap-2 text-slate-600 text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: REFERRAL HISTORY TABLE */}
              {activeTab === 'referrals' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Referred Students &amp; Reward Status</h4>
                      <p className="text-slate-500 text-[11px]">Track students who joined using your code and their qualifying order status.</p>
                    </div>
                    <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
                      Total: {data.referral_history.length}
                    </span>
                  </div>

                  {data.referral_history.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                      <Users className="w-10 h-10 text-slate-300 mx-auto" />
                      <h5 className="font-bold text-slate-700 text-sm">No Referrals Yet</h5>
                      <p className="text-slate-500 text-xs max-w-sm mx-auto">
                        Share your referral code or link with classmates working on capstone projects or assignments. You'll earn ₹{int(data.reward_per_referral)} when they confirm their first project!
                      </p>
                      <button
                        type="button"
                        onClick={handleShareWhatsApp}
                        className="btn-primary text-xs px-4 py-2 font-bold inline-flex items-center gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Share on WhatsApp Now
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Student</th>
                            <th className="p-3">College / Stream</th>
                            <th className="p-3">Joined Date</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Cashback</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.referral_history.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-3 font-bold text-slate-900">{r.name}</td>
                              <td className="p-3 text-slate-600">{r.college || 'Engineering'}</td>
                              <td className="p-3 text-slate-500">{r.date}</td>
                              <td className="p-3">
                                {r.status === 'completed' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-fit">
                                    <CheckCircle2 className="w-3 h-3" /> Credited
                                  </span>
                                ) : r.status === 'rejected' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 w-fit">
                                    <X className="w-3 h-3" /> Ineligible
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 w-fit">
                                    <Clock className="w-3 h-3" /> Awaiting 1st Order
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right font-black text-slate-900">
                                {r.status === 'completed' ? (
                                  <span className="text-emerald-600">+₹{int(r.reward_amount)}</span>
                                ) : (
                                  <span className="text-slate-400">₹{int(r.reward_amount)} (Pending)</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PASSBOOK LEDGER */}
              {activeTab === 'transactions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Wallet Transaction Passbook</h4>
                      <p className="text-slate-500 text-[11px]">Audit trail of all credits earned and debits applied to project orders.</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Balance: ₹{data.wallet_balance.toFixed(2)}
                    </span>
                  </div>

                  {data.wallet_transactions.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                      <Wallet className="w-9 h-9 text-slate-300 mx-auto" />
                      <h5 className="font-bold text-slate-700 text-sm">No Transactions Recorded</h5>
                      <p className="text-slate-500 text-xs">
                        Wallet transactions will appear here whenever referral rewards are credited or redeemed against your projects.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Type</th>
                            <th className="p-3">Description</th>
                            <th className="p-3">Date &amp; Time</th>
                            <th className="p-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.wallet_transactions.map(tx => (
                            <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-3">
                                {tx.transaction_type === 'credit' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-fit">
                                    <ArrowDownLeft className="w-3 h-3" /> Credit
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1 w-fit">
                                    <ArrowUpRight className="w-3 h-3" /> Debit
                                  </span>
                                )}
                              </td>
                              <td className="p-3">
                                <span className="font-bold text-slate-800 block">{tx.description}</span>
                                {tx.reference_id && (
                                  <span className="text-[10px] font-mono text-slate-400">Ref: {tx.reference_id}</span>
                                )}
                              </td>
                              <td className="p-3 text-slate-500 text-[11px] whitespace-nowrap">{tx.date}</td>
                              <td className="p-3 text-right font-black">
                                <span className={tx.transaction_type === 'credit' ? 'text-emerald-600' : 'text-blue-600'}>
                                  {tx.transaction_type === 'credit' ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: TIER BENEFITS & RULES */}
              {activeTab === 'rules' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Ambassador Tiers &amp; Rules</h4>
                    <p className="text-slate-500 text-[11px]">Level up your tier by referring more students to unlock cash rewards and privileges.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { tier: 'Bronze Ambassador', count: '0 - 1 Referrals', badge: '🥉', perk: '₹250 per referral + Flat ₹200 for friend' },
                      { tier: 'Silver Ambassador', count: '2 - 4 Referrals', badge: '🥈', perk: 'Priority mentor matching + 10% discount on personal orders' },
                      { tier: 'Gold Ambassador', count: '5 - 9 Referrals', badge: '🥇', perk: 'Official Campus Ambassador Certificate + Free Viva Guide' },
                      { tier: 'Diamond Ambassador', count: '10+ Referrals', badge: '💎', perk: '1-on-1 Placement Mock Interview + Letter of Recommendation' },
                    ].map(t => (
                      <div key={t.tier} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>{t.badge}</span> {t.tier}
                          </span>
                          <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                            {t.count}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">{t.perk}</p>
                      </div>
                    ))}
                  </div>

                  {/* Anti-Fraud & Qualification Rules */}
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2 text-[11px] text-amber-900">
                    <span className="font-bold flex items-center gap-1.5 text-xs">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      Program Terms &amp; Anti-Fraud Protection:
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-amber-800">
                      <li>Cashback rewards are credited automatically when your referred student's order advance payment is verified (minimum qualifying order: ₹500).</li>
                      <li>Self-referrals (referring yourself using alternate emails or phone numbers) are blocked by the automated fraud detection engine.</li>
                      <li>Your wallet balance can be used at checkout towards any project advance or final balance payment.</li>
                      <li>Referral discounts cannot be combined with conflicting promotional promo codes.</li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          ) : null}

          {/* Footer Close */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              CampusGig AI Ambassador Network • Secured by Escrow
            </span>
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

export default ReferralWalletModal;
