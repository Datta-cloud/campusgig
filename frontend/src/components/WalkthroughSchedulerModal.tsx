import React, { useState } from 'react';
import { X, Video, Calendar, Clock, CheckCircle2, ExternalLink, Copy, Check } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';

interface WalkthroughSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  orderNumber: string;
  onSuccess: (meetingUrl: string, scheduledAt: string) => void;
}

export const WalkthroughSchedulerModal: React.FC<WalkthroughSchedulerModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  onSuccess,
}) => {
  const [dateTime, setDateTime] = useState('');
  const [topic, setTopic] = useState('Code Walkthrough, Architecture & Viva Prep');
  const [submitting, setSubmitting] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateTime || submitting) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/orders/${orderId}/schedule-walkthrough`, {
        scheduled_at: new Date(dateTime).toISOString(),
        topic: topic.trim(),
      });
      setMeetingUrl(res.data.meeting_url);
      onSuccess(res.data.meeting_url, res.data.scheduled_at);
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to schedule walkthrough'));
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = () => {
    if (meetingUrl) {
      navigator.clipboard.writeText(meetingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Schedule 1-on-1 Walkthrough</h3>
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
        <div className="p-6 space-y-4">
          
          {meetingUrl ? (
            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-900 text-sm">Session Confirmed!</h4>
                <p className="text-xs text-emerald-700 mt-1">
                  Your private meeting room has been generated and pinned to your project chat.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-slate-700 truncate max-w-xs">{meetingUrl}</span>
                <button
                  type="button"
                  onClick={copyLink}
                  className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1 shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <a
                  href={meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2 font-bold shadow-md shadow-brand-500/20"
                >
                  <Video className="w-4 h-4" /> Open Video Room Now
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary text-xs px-4 py-2 font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect directly with your engineering mentor for a line-by-line code explanation, environment setup assistance, and project defense coaching.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Date & Time Slot *
                </label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={e => setDateTime(e.target.value)}
                  className="w-full input-field text-xs p-2.5"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Walkthrough Focus
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Model training explanation, dataset cleaning, PPT viva questions"
                  className="w-full input-field text-xs p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary text-xs px-4 py-2 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !dateTime}
                  className="btn-primary text-xs px-5 py-2 font-bold flex items-center gap-2 shadow-md shadow-brand-500/20"
                >
                  {submitting ? 'Generating Meet Room...' : 'Schedule & Generate Room'}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

export default WalkthroughSchedulerModal;
