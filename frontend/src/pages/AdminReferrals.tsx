import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Gift, ArrowLeft, ShieldCheck, AlertTriangle, CheckCircle2, XCircle,
  Save, RefreshCw, Users, DollarSign, Settings, Check, Clock, Eye
} from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface ReferralAdminOverview {
  config: {
    is_enabled: boolean;
    referrer_reward: number;
    referred_discount: number;
    min_qualifying_amount: number;
  };
  stats: {
    total_referrals: number;
    total_rewards_distributed: number;
    pending_referrals: number;
  };
  records: Array<{
    id: number;
    referral_code: string;
    referrer_name: string;
    referrer_email: string;
    referred_name: string;
    referred_email: string;
    status: 'pending' | 'completed' | 'rejected';
    reward_amount: number;
    qualifying_order?: string | null;
    created_at?: string | null;
    credited_at?: string | null;
    is_suspicious: boolean;
    suspicion_reason?: string | null;
  }>;
}

export const AdminReferrals: React.FC = () => {
  const [data, setData] = useState<ReferralAdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    is_enabled: true,
    referrer_reward: 250,
    referred_discount: 200,
    min_qualifying_amount: 500,
  });
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'suspicious'>('all');

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get('/referrals/admin/overview');
      setData(res.data);
      if (res.data?.config) {
        setSettingsForm({
          is_enabled: res.data.config.is_enabled,
          referrer_reward: res.data.config.referrer_reward,
          referred_discount: res.data.config.referred_discount,
          min_qualifying_amount: res.data.config.min_qualifying_amount,
        });
      }
    } catch (err) {
      console.error('Failed to load referral admin overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await api.put('/referrals/admin/settings', settingsForm);
      alert('✅ Referral program settings updated successfully!');
      fetchOverview();
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to update referral settings'));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDisputeAction = async (recordId: number, action: 'approve' | 'reject') => {
    let reason = undefined;
    if (action === 'reject') {
      const promptRes = window.prompt('Enter reason for rejecting this referral reward:');
      if (promptRes === null) return;
      reason = promptRes || 'Disqualified by administrator';
    }
    try {
      setActionLoadingId(recordId);
      await api.post(`/referrals/admin/${recordId}/action`, { action, reason });
      alert(action === 'approve' ? '✅ Referral reward approved and credited to wallet!' : '❌ Referral reward marked as rejected.');
      fetchOverview();
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to process referral action'));
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner />
      </div>
    );
  }

  const filteredRecords = (data?.records || []).filter(r => {
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'completed') return r.status === 'completed';
    if (filter === 'suspicious') return r.is_suspicious;
    return true;
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link to="/admin" className="text-xs font-bold text-slate-500 hover:text-brand-600 flex items-center gap-1 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Ambassador Control &amp; Anti-Fraud
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Referral &amp; Reward Management
          </h1>
          <p className="text-xs text-slate-500">
            Configure student cashback, monitor student referrals, detect fraud, and resolve disputes.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOverview}
          className="btn-secondary text-xs px-3.5 py-2 font-bold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Total Referrals Registered</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{data?.stats.total_referrals || 0}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Cash Rewards Distributed</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              ₹{(data?.stats.total_rewards_distributed || 0).toLocaleString()}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Pending Qualifying Orders</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">{data?.stats.pending_referrals || 0}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Program Settings Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Referral Program Rules &amp; Reward Configuration</h3>
          </div>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${settingsForm.is_enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
            {settingsForm.is_enabled ? 'Program Active' : 'Program Paused'}
          </span>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Referral Program Status</label>
              <select
                value={settingsForm.is_enabled ? 'true' : 'false'}
                onChange={e => setSettingsForm({ ...settingsForm, is_enabled: e.target.value === 'true' })}
                className="input-field text-xs"
              >
                <option value="true">Active (Students can earn rewards)</option>
                <option value="false">Paused (Disable referral rewards)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Referrer Reward (₹)</label>
              <input
                type="number"
                min="0"
                step="50"
                value={settingsForm.referrer_reward}
                onChange={e => setSettingsForm({ ...settingsForm, referrer_reward: Number(e.target.value) })}
                className="input-field text-xs font-semibold"
              />
              <span className="text-[10px] text-slate-400">Credited to referrer wallet on first order</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Friend Discount (₹)</label>
              <input
                type="number"
                min="0"
                step="50"
                value={settingsForm.referred_discount}
                onChange={e => setSettingsForm({ ...settingsForm, referred_discount: Number(e.target.value) })}
                className="input-field text-xs font-semibold"
              />
              <span className="text-[10px] text-slate-400">Instant discount on referred student's order</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Min Qualifying Order Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={settingsForm.min_qualifying_amount}
                onChange={e => setSettingsForm({ ...settingsForm, min_qualifying_amount: Number(e.target.value) })}
                className="input-field text-xs font-semibold"
              />
              <span className="text-[10px] text-slate-400">Minimum total price to trigger referral payout</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="btn-primary text-xs px-5 py-2.5 font-bold flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? 'Saving Settings...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Referral Records & Anti-Fraud Monitoring Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Referral Audit &amp; Dispute Management</h3>
            <p className="text-xs text-slate-500">Monitor all referrals, verify legitimacy, and resolve disputes.</p>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
            {(['all', 'pending', 'completed', 'suspicious'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-colors ${
                  filter === tab
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab} {tab === 'suspicious' && data?.records.some(r => r.is_suspicious) && '⚠️'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">Referrer</th>
                <th className="py-3 px-4">Referred Student</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Qualifying Order</th>
                <th className="py-3 px-4">Reward</th>
                <th className="py-3 px-4">Fraud Check</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No referral records matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-all">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{r.referrer_name}</span>
                      <span className="text-[10px] text-slate-400">{r.referrer_email}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{r.referred_name}</span>
                      <span className="text-[10px] text-slate-400">{r.referred_email}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-brand-600">
                      {r.referral_code}
                    </td>
                    <td className="py-3 px-4">
                      {r.status === 'completed' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Credited
                        </span>
                      ) : r.status === 'rejected' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {r.qualifying_order ? (
                        <span className="font-mono text-brand-600 font-bold">#{r.qualifying_order}</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No order placed yet</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{r.reward_amount}
                    </td>
                    <td className="py-3 px-4">
                      {r.is_suspicious ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 inline-flex items-center gap-1" title={r.suspicion_reason || 'Suspicious activity'}>
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          <span>{r.suspicion_reason || 'Suspicious'}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Clean
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {r.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={actionLoadingId === r.id}
                            onClick={() => handleDisputeAction(r.id, 'approve')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-all"
                            title="Manually credit reward to referrer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={actionLoadingId === r.id}
                            onClick={() => handleDisputeAction(r.id, 'reject')}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold border border-rose-200 transition-all"
                            title="Reject and invalidate this referral"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminReferrals;
