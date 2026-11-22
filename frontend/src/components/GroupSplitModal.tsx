import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Trash2, CheckCircle2, Clock, QrCode, Copy, Check, ShieldCheck, Share2 } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';

interface Teammate {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role_in_team: string;
  share_amount: number;
  is_paid: boolean;
  paid_at?: string;
  utr_number?: string;
  qr_token?: string;
}

interface SplitData {
  order_id: number;
  order_number: string;
  total_price: number;
  total_members: number;
  per_member_share: number;
  primary_student: {
    name: string;
    email?: string;
    role: string;
    share_amount: number;
    is_paid: boolean;
  };
  teammates: Teammate[];
  all_shares_paid: boolean;
}

interface GroupSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  orderNumber: string;
  onSuccess: () => void;
}

export const GroupSplitModal: React.FC<GroupSplitModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  onSuccess,
}) => {
  const [splitData, setSplitData] = useState<SplitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Frontend / UI Designer');
  const [submitting, setSubmitting] = useState(false);
  const [payingMemberId, setPayingMemberId] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchSplit = async () => {
    try {
      const res = await api.get(`/orders/${orderId}/group-split`);
      setSplitData(res.data);
    } catch (err: any) {
      console.error('Failed to load group split data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchSplit();
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/orders/${orderId}/group-split/members`, {
        name: name.trim(),
        email: email.trim(),
        role_in_team: role
      });
      setName('');
      setEmail('');
      setShowAddForm(false);
      fetchSplit();
      onSuccess();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to add teammate'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (memberId: number) => {
    if (!confirm('Remove this teammate from group split?')) return;
    try {
      await api.delete(`/orders/${orderId}/group-split/members/${memberId}`);
      fetchSplit();
      onSuccess();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to remove teammate'));
    }
  };

  const handleSimulatePayShare = async (memberId: number) => {
    setPayingMemberId(memberId);
    try {
      await api.post(`/orders/${orderId}/group-split/pay/${memberId}`, {
        utr_number: `SPLIT_UTR_${Math.floor(10000000 + Math.random() * 90000000)}`
      });
      fetchSplit();
      onSuccess();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to record teammate share'));
    } finally {
      setPayingMemberId(null);
    }
  };

  const paidCount = (splitData?.primary_student.is_paid ? 1 : 0) + (splitData?.teammates.filter(t => t.is_paid).length || 0);
  const totalCount = (splitData?.total_members || 1);
  const collectedAmount = paidCount * (splitData?.per_member_share || 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
        
        {/* Header Strip */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                  Team Capstone Split
                </span>
                <span className="text-xs text-slate-400 font-mono">{orderNumber}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base mt-0.5">
                Group Project Split-Payment
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          
          {/* Summary Progress Card */}
          {splitData && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block">Total Project Fee</span>
                  <span className="text-base font-extrabold text-slate-900">₹{splitData.total_price}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Individual Share (Split by {splitData.total_members})</span>
                  <span className="text-base font-extrabold text-indigo-600">₹{splitData.per_member_share} / person</span>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span className="text-slate-700">{paidCount} of {totalCount} Teammates Paid</span>
                  <span className="text-indigo-600">₹{collectedAmount} / ₹{splitData.total_price}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (paidCount / totalCount) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Project Team Members</h4>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn-secondary text-[11px] px-2.5 py-1 font-bold inline-flex items-center gap-1 text-indigo-600"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Teammate</span>
              </button>
            </div>

            {/* Add member form */}
            {showAddForm && (
              <form onSubmit={handleAddMember} className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3 animate-fade-in">
                <h5 className="font-bold text-indigo-950 text-xs">Invite Capstone Teammate</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Teammate Full Name *"
                    className="input-field text-xs"
                    required
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="College Email Address *"
                    className="input-field text-xs"
                    required
                  />
                </div>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="input-field text-xs font-semibold"
                >
                  <option value="Frontend / UI Designer">Frontend / UI Designer</option>
                  <option value="Backend & Database Engineer">Backend &amp; Database Engineer</option>
                  <option value="Machine Learning / AI Specialist">Machine Learning / AI Specialist</option>
                  <option value="IEEE Documentation & PPT Lead">IEEE Documentation &amp; PPT Lead</option>
                  <option value="Testing & QA Lead">Testing &amp; QA Lead</option>
                </select>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="btn-secondary text-[11px] px-3 py-1 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary text-[11px] px-4 py-1 font-bold"
                  >
                    {submitting ? 'Adding...' : 'Save Teammate'}
                  </button>
                </div>
              </form>
            )}

            {/* Primary Student */}
            {splitData && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                    ★
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">{splitData.primary_student.name}</span>
                    <span className="text-[10px] text-slate-400 block">{splitData.primary_student.role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">₹{splitData.primary_student.share_amount}</span>
                  {splitData.primary_student.is_paid ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Paid
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" /> Pending
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Other Teammates */}
            {splitData?.teammates.map(m => (
              <div key={m.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">{m.name}</span>
                    <span className="text-[10px] text-slate-400 block">{m.role_in_team} • {m.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">₹{m.share_amount}</span>
                  {m.is_paid ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Paid
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSimulatePayShare(m.id)}
                      disabled={payingMemberId === m.id}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg transition-all"
                      title="Confirm / Record Share Payment"
                    >
                      {payingMemberId === m.id ? 'Recording...' : 'Mark Paid (₹' + m.share_amount + ')'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteMember(m.id)}
                    className="p-1 text-slate-300 hover:text-rose-500"
                    title="Remove member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(`Hey team! Please pay your ₹${splitData?.per_member_share || ''} share for our capstone project (${orderNumber}): http://127.0.0.1:5173/order/${orderId}`);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? 'Invite Link Copied!' : 'Copy WhatsApp Share Link'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs px-4 py-2 font-bold"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
