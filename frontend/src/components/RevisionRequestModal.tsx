import React, { useState } from 'react';
import { X, RefreshCw, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';

interface RevisionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  orderNumber: string;
  revisionCount: number;
  maxRevisions: number;
  onSuccess: () => void;
}

export const RevisionRequestModal: React.FC<RevisionRequestModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  revisionCount,
  maxRevisions,
  onSuccess,
}) => {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const remaining = Math.max(0, maxRevisions - revisionCount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() || submitting) return;

    setSubmitting(true);
    try {
      await api.post(`/orders/${orderId}/request-revision`, { notes: notes.trim() });
      alert(`Revision #${revisionCount + 1} requested successfully! Your mentor has been notified.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to request revision'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Request Project Revision</h3>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Policy Pill */}
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">
                {remaining} of {maxRevisions} Free Revisions Available
              </span>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Clearly describe what you would like changed (e.g. modify Chapter 3 formatting, update dataset parameters, or tune model threshold).
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Detailed Revision Instructions *
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. 'My professor requested us to include a Confusion Matrix chart in the PPT slide 7, and rephrase the methodology section in the report.'"
              className="w-full input-field text-xs p-3"
              required
            />
          </div>

          {/* Action Buttons */}
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
              disabled={submitting || !notes.trim() || remaining <= 0}
              className="btn-accent text-xs px-5 py-2 font-bold flex items-center gap-2"
            >
              {submitting ? 'Submitting...' : 'Submit Revision Request'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default RevisionRequestModal;
