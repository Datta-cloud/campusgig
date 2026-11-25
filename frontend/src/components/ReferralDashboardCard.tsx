import React, { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';

export interface ReferralDashboardStats {
  referral_code: string;
  total_referrals: number;
  successful_referrals: number;
  rewards_earned: number;
  pending_rewards: number;
  referral_link?: string;
  showFooterSampleNote?: boolean;
}

interface ReferralDashboardCardProps {
  stats?: Partial<ReferralDashboardStats>;
  sampleMode?: boolean;
  onShareWhatsApp?: () => void;
}

export const ReferralDashboardCard: React.FC<ReferralDashboardCardProps> = ({
  stats,
  sampleMode = false,
  onShareWhatsApp,
}) => {
  const [copied, setCopied] = useState(false);

  // If sampleMode, match the exact numbers from the user's screenshot
  const referralCode = sampleMode
    ? 'CAMPUS2027'
    : (stats?.referral_code || '---');

  const totalReferrals = sampleMode
    ? 12
    : (stats?.total_referrals ?? 0);

  const successfulReferrals = sampleMode
    ? 8
    : (stats?.successful_referrals ?? 0);

  const rewardsEarned = sampleMode
    ? 400
    : (stats?.rewards_earned ?? 0);

  const pendingRewards = sampleMode
    ? 200
    : (stats?.pending_rewards ?? 0);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-6 text-white shadow-xl max-w-2xl w-full transition-all">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-white">
          Invite &amp; Earn
        </h3>
        <p className="text-zinc-400 text-xs sm:text-sm mt-1 mb-4">
          Invite your friends to CampusGig AI and earn rewards.
        </p>
      </div>

      {/* Referral Code Box */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 flex items-center justify-between mb-3.5">
        <div>
          <span className="text-xs text-zinc-400 font-medium block mb-1">
            Your referral code
          </span>
          <span className="text-xl font-bold tracking-wider text-white font-mono">
            {referralCode}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="px-4 py-2 rounded-xl border border-zinc-700 hover:border-zinc-500 bg-zinc-800/80 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-zinc-300" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* 2x2 Metric Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3.5">
        {/* Total Referrals */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40">
          <span className="text-xs text-zinc-400 font-medium block mb-1">
            Total referrals
          </span>
          <span className="text-2xl font-bold text-white">
            {totalReferrals}
          </span>
        </div>

        {/* Successful Referrals */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40">
          <span className="text-xs text-zinc-400 font-medium block mb-1">
            Successful referrals
          </span>
          <span className="text-2xl font-bold text-white">
            {successfulReferrals}
          </span>
        </div>

        {/* Rewards Earned */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40">
          <span className="text-xs text-zinc-400 font-medium block mb-1">
            Rewards earned
          </span>
          <span className="text-2xl font-bold text-white">
            ₹{rewardsEarned}
          </span>
        </div>

        {/* Pending Rewards */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40">
          <span className="text-xs text-zinc-400 font-medium block mb-1">
            Pending rewards
          </span>
          <span className="text-2xl font-bold text-white">
            ₹{pendingRewards}
          </span>
        </div>
      </div>

      {/* Footer text matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <p className="text-xs text-zinc-400">
          {sampleMode ? 'Illustrative design with sample data.' : 'Share code with friends for flat ₹200 off their first capstone order.'}
        </p>

        {onShareWhatsApp && (
          <button
            type="button"
            onClick={onShareWhatsApp}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share on WhatsApp</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ReferralDashboardCard;
