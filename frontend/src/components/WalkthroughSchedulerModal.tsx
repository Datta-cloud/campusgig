import React, { useState } from 'react';
import { X, Video, Calendar, Clock, CheckCircle2, ExternalLink, Copy, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';

interface WalkthroughSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  orderNumber: string;
  walkthroughCount?: number;
  onSuccess: (meetingUrl: string, scheduledAt: string) => void;
}

const TIME_SLOTS = [
  { label: '10:00 AM - 10:30 AM', time: '10:00' },
  { label: '10:30 AM - 11:00 AM', time: '10:30' },
  { label: '11:00 AM - 11:30 AM', time: '11:00' },
  { label: '11:30 AM - 12:00 PM', time: '11:30' },
  { label: '02:00 PM - 02:30 PM', time: '14:00' },
  { label: '02:30 PM - 03:00 PM', time: '14:30' },
  { label: '03:00 PM - 03:30 PM', time: '15:00' },
  { label: '03:30 PM - 04:00 PM', time: '15:30' },
  { label: '04:00 PM - 04:30 PM', time: '16:00' },
  { label: '04:30 PM - 05:00 PM', time: '16:30' },
  { label: '05:00 PM - 05:30 PM', time: '17:00' },
  { label: '06:00 PM - 06:30 PM', time: '18:00' },
  { label: '07:00 PM - 07:30 PM', time: '19:00' },
  { label: '08:00 PM - 08:30 PM', time: '20:00' },
];

const SUGGESTED_TOPICS = [
  'Line-by-Line Code & Algorithm Walkthrough',
  'Architecture, Flowchart & Viva Defense Prep',
  'Local Machine Setup & Run Assistance',
  'Dataset, ML Training & Metrics Review',
];

export const WalkthroughSchedulerModal: React.FC<WalkthroughSchedulerModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  walkthroughCount = 0,
  onSuccess,
}) => {
  // Tomorrow's date in YYYY-MM-DD
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(tomorrowStr);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('10:30');
  const [topic, setTopic] = useState('Line-by-Line Code & Algorithm Walkthrough');
  const [submitting, setSubmitting] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isLimitReached = walkthroughCount >= 3;
  const sessionsRemaining = Math.max(0, 3 - walkthroughCount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitReached || !selectedDate || !selectedSlotTime || submitting) return;

    // Combine date and time
    const dateTimeIso = new Date(`${selectedDate}T${selectedSlotTime}:00`).toISOString();

    setSubmitting(true);
    try {
      const res = await api.post(`/orders/${orderId}/schedule-walkthrough`, {
        scheduled_at: dateTimeIso,
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
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base">1-on-1 Code Walkthrough</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isLimitReached ? 'bg-red-100 text-red-700' : 'bg-brand-100 text-brand-800'}`}>
                  {walkthroughCount}/3 Booked
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
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {meetingUrl ? (
            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-900 text-base">30-Minute Session Confirmed! 🎥</h4>
                <p className="text-xs text-emerald-700 mt-1">
                  Mentor has been notified. Your dedicated video room has been generated and pinned to your project.
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
                  <span>{copied ? 'Copied' : 'Copy Link'}</span>
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
              
              {/* Quota Callout */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-slate-500 font-medium block">Sessions Allowed:</span>
                  <span className="font-bold text-slate-800">Max 3 Walkthroughs per Order</span>
                </div>
                <div className="text-right text-xs">
                  <span className="text-slate-500 font-medium block">Remaining:</span>
                  <span className={`font-black ${sessionsRemaining > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {sessionsRemaining} of 3 sessions
                  </span>
                </div>
              </div>

              {isLimitReached ? (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Maximum Walkthrough Limit Reached (3/3)
                  </div>
                  <p className="leading-relaxed">
                    You have already scheduled all 3 complimentary walkthrough sessions for this project. If you require additional live coaching, please message your mentor directly in the Chat room.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Book a 1-on-1 private video walkthrough with your engineering mentor. Each session is scheduled in <strong>30-minute intervals</strong> for screen-sharing and viva defense preparation.
                  </p>

                  {/* 1. Date Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-600" /> 1. Select Date *
                    </label>
                    <input
                      type="date"
                      min={todayStr}
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="w-full input-field text-xs p-2.5 font-medium"
                      required
                    />
                  </div>

                  {/* 2. 30-Minute Time Slot Picker */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand-600" /> 2. Select 30-Minute Time Slot *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
                      {TIME_SLOTS.map(slot => (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => setSelectedSlotTime(slot.time)}
                          className={`text-xs py-2 px-2.5 rounded-lg border font-bold text-left transition-all ${
                            selectedSlotTime === slot.time
                              ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          ⏱️ {slot.label}
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      ⚡ Fixed 30-minute interval with dedicated audio/video line & screen sharing.
                    </span>
                  </div>

                  {/* 3. Primary Topic */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      3. Walkthrough Focus Topic *
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {SUGGESTED_TOPICS.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTopic(t)}
                          className={`text-[10px] font-semibold px-2 py-1 rounded-md border transition-all ${
                            topic === t
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-bold'
                              : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      placeholder="e.g. Model architecture explanation, viva questions"
                      className="w-full input-field text-xs p-2.5"
                      required
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
                      disabled={submitting || !selectedDate || !selectedSlotTime}
                      className="btn-primary text-xs px-5 py-2 font-bold flex items-center gap-2 shadow-md shadow-brand-500/20"
                    >
                      {submitting ? 'Booking & Notifying Mentor...' : `Confirm Session (${walkthroughCount + 1}/3)`}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

export default WalkthroughSchedulerModal;
