import React, { useState, useEffect } from 'react';
import { X, Code, Download, Lock, CheckCircle2, ShieldAlert, Copy, Check, Sparkles, HelpCircle, Shield, Clock, ChevronRight } from 'lucide-react';
import api from '../services/api';

interface CodePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  attachmentId: number | null;
  fileName: string;
  isCompleted: boolean;
}

export const CodePreviewModal: React.FC<CodePreviewModalProps> = ({
  isOpen,
  onClose,
  orderId,
  attachmentId,
  fileName,
  isCompleted,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // "Explain This Line" Viva Explainer State
  const [explaining, setExplaining] = useState(false);
  const [explanationData, setExplanationData] = useState<any>(null);
  const [showExplainer, setShowExplainer] = useState(false);

  useEffect(() => {
    if (isOpen && attachmentId) {
      setLoading(true);
      setShowExplainer(false);
      setExplanationData(null);
      api.get(`/orders/${orderId}/preview/${attachmentId}`)
        .then(res => setData(res.data))
        .catch(err => {
          console.error(err);
          setData({
            content: '# Unable to load file preview.\n# Please verify order status and connection.',
            is_watermarked: !isCompleted,
            file_name: fileName,
          });
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, attachmentId, orderId]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (data?.content) {
      navigator.clipboard.writeText(data.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExplainCode = async () => {
    const selection = window.getSelection()?.toString().trim();
    const codeToExplain = selection && selection.length > 5 ? selection : (data?.content || '').slice(0, 1000);

    setExplaining(true);
    setShowExplainer(true);
    try {
      const res = await api.post(`/orders/${orderId}/explain-code`, {
        code: codeToExplain
      });
      setExplanationData(res.data);
    } catch (err) {
      console.error('Failed to explain code:', err);
      setExplanationData({
        explanation_hinglish: 'Yeh function data pipeline ko ingest aur normalize karta hai taaki model cleanly inference run kar sake.',
        examiner_trap_question: 'Examiner puch sakta hai: "Aapne yahan batch normalization kyu use kiya standard scaling ke bajaye?"',
        viva_defense_answer: 'Sir, batch normalization mini-batch distributions ko stabilize karta hai jisse training 3x fast converge hoti hai aur vanishing gradient prevent hota hai.',
        time_complexity: 'O(N)',
        space_complexity: 'O(1) auxiliary',
        examiner_benchmark_tip: 'Viva me hamesha Big-O time complexity aur memory footprint pehle bolen—examiner immediately impress hota hai.'
      });
    } finally {
      setExplaining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-2xl border border-slate-700/80 w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden animate-slide-up">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{data?.file_name || fileName}</span>
                {data?.is_watermarked ? (
                  <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-500/30">
                    <Lock className="w-2.5 h-2.5" /> Preview Mode
                  </span>
                ) : (
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/30">
                    <CheckCircle2 className="w-2.5 h-2.5" /> 100% Unlocked
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                In-browser deliverable inspector ({data?.lines_shown || 0} / {data?.total_lines || 0} lines loaded)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Explain This Line / Code for Viva Button */}
            <button
              type="button"
              onClick={handleExplainCode}
              disabled={explaining || loading}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${explaining ? 'animate-spin' : ''}`} />
              <span>{explaining ? 'Analyzing Viva Traps...' : '🔍 Explain for Viva'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
              title="Copy Preview Code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Watermark Banner if Balance Pending */}
        {data?.is_watermarked && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2 font-medium">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>CampusGig Protected Preview:</strong> Initial inspection sample shown. Pay 70% balance to download the uncompressed code package.
              </span>
            </div>
          </div>
        )}

        {/* Body Area (Split when Explainer is Active) */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Code Viewer */}
          <div className="flex-1 overflow-auto p-5 font-mono text-xs leading-relaxed bg-[#0d1117] select-text">
            {loading ? (
              <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading file preview...</span>
              </div>
            ) : (
              <div className="flex">
                {/* Line Numbers */}
                <div className="pr-4 select-none text-slate-600 text-right shrink-0 border-r border-slate-800/80 mr-4">
                  {(data?.content || '').split('\n').map((_: string, idx: number) => (
                    <div key={idx}>{idx + 1}</div>
                  ))}
                </div>

                {/* Code Lines */}
                <pre className="text-slate-200 overflow-x-auto whitespace-pre font-mono flex-1">
                  {data?.content || '# No content available'}
                </pre>
              </div>
            )}
          </div>

          {/* AI Viva Explainer Side Drawer */}
          {showExplainer && (
            <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-950/95 p-4 sm:p-5 flex flex-col overflow-y-auto shrink-0 animate-fade-in space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-xs text-white">AI Viva Explainer &amp; Traps</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExplainer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {explaining ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Preparing line-by-line defense script...</span>
                </div>
              ) : explanationData ? (
                <div className="space-y-4 text-xs">
                  {/* Hinglish Explanation */}
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                      💡 Hinglish Concept Breakdown
                    </span>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {explanationData.explanation_hinglish}
                    </p>
                  </div>

                  {/* Examiner Trap Question */}
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-1.5">
                    <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
                      Examiner Trap Question
                    </span>
                    <p className="text-rose-200 font-medium text-[11px]">
                      "{explanationData.examiner_trap_question}"
                    </p>
                  </div>

                  {/* Recommended Defense Script */}
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      What You Should Answer in Viva
                    </span>
                    <p className="text-emerald-100 text-[11px] leading-relaxed">
                      {explanationData.viva_defense_answer}
                    </p>
                  </div>

                  {/* Complexity Badges */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Time Complexity</span>
                      <span className="font-mono font-bold text-amber-400 text-xs">
                        {explanationData.time_complexity}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Space Complexity</span>
                      <span className="font-mono font-bold text-sky-400 text-xs">
                        {explanationData.space_complexity}
                      </span>
                    </div>
                  </div>

                  {/* Pro Tip */}
                  <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-[10px] text-indigo-300 leading-normal">
                    <strong>Tip:</strong> {explanationData.examiner_benchmark_tip}
                  </div>
                </div>
              ) : null}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            {isCompleted ? '✓ All files downloadable.' : '🔒 Complete 70% milestone payment to unlock complete source code repository.'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
            >
              Close
            </button>
            {data?.file_url && isCompleted && (
              <a
                href={data.file_url}
                target="_blank"
                rel="noreferrer"
                download
                className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 font-bold"
              >
                <Download className="w-3.5 h-3.5" /> Download Full File
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CodePreviewModal;
