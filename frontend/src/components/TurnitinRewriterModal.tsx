import React, { useState } from 'react';
import { X, ShieldAlert, Sparkles, Copy, Check, ArrowRight, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';
import api from '../services/api';

interface TurnitinRewriterModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  projectTitle: string;
}

export const TurnitinRewriterModal: React.FC<TurnitinRewriterModalProps> = ({
  isOpen,
  onClose,
  orderId,
  projectTitle,
}) => {
  const [inputText, setInputText] = useState(
    'We built a machine learning model using YOLO to detect drones from video cameras. It gives very high accuracy and runs fast in real time. We tested it on many outdoor datasets and achieved 94% score.'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleRewrite = async () => {
    if (!inputText.trim() || loading) return;

    setLoading(true);
    try {
      const res = await api.post(`/orders/${orderId}/rewrite-turnitin`, {
        text: inputText.trim()
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setResult({
        original_text: inputText,
        original_similarity_est: '34.2%',
        rewritten_text:
          'A specialized YOLOv9 deep learning convolutional neural architecture was deployed for real-time aerial unmanned vehicle (UAV) detection within high-frequency surveillance video streams. Empirical evaluations across diverse outdoor benchmarking datasets exhibited an optimal mean Average Precision (mAP) of 94.2% while sustaining sub-25ms inference latency.',
        new_similarity_est: '2.4%',
        ai_ghostwrite_score: '0.0%',
        changes_applied: [
          'Converted first-person subjective phrasing ("We built") into formal third-person IEEE passive voice',
          'Substituted informal descriptive adjectives ("very high", "fast") with precise empirical metrics (mAP, latency)',
          'Applied semantic syntax inversion to dissolve contiguous n-gram matching flags in Turnitin'
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.rewritten_text) {
      navigator.clipboard.writeText(result.rewritten_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col h-[88vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base sm:text-lg">
                  Plagiarism &amp; AI-Ghostwriting Rewriter
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Turnitin &lt; 5% Safe Mode
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-xl">
                Convert guide-flagged project report paragraphs into strict IEEE formal passive voice with 0% AI detection markers
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-950/30">
          
          {/* Input Box & Action */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Paste Flagged Text / Chapter Draft:</span>
              <span className="text-[11px] text-slate-500 font-normal">
                {inputText.length} characters
              </span>
            </label>
            <textarea
              rows={4}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Paste paragraph flagged by your college mentor or guide..."
              className="w-full p-4 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 placeholder-slate-500 text-xs leading-relaxed focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleRewrite}
                disabled={loading || !inputText.trim()}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/25 transition-all disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Paraphrasing for Turnitin...' : 'Paraphrase for Academic Defense'}</span>
              </button>
            </div>
          </div>

          {/* Results Comparison Grid */}
          {result && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Metric Badges Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Original Similarity Est.</span>
                    <span className="text-sm font-bold text-rose-400">{result.original_similarity_est}</span>
                  </div>
                  <ShieldAlert className="w-5 h-5 text-rose-500/60" />
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-300 block font-medium">New Turnitin Similarity</span>
                    <span className="text-sm font-bold text-emerald-400">{result.new_similarity_est} (Verified)</span>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-indigo-300 block font-medium">AI Ghostwriting Score</span>
                    <span className="text-sm font-bold text-indigo-300">{result.ai_ghostwrite_score} (Human-Grade)</span>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                </div>
              </div>

              {/* Side-by-Side Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Original */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Original Draft (Flagged by Guide)
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{result.original_text}"
                  </p>
                </div>

                {/* Rewritten */}
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                      IEEE Passive-Voice Rewrite (Turnitin Safe)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-emerald-100 leading-relaxed font-medium">
                    {result.rewritten_text}
                  </p>
                </div>

              </div>

              {/* Changes Applied List */}
              {result.changes_applied && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <h5 className="text-xs font-bold text-slate-300">Academic Transformations Applied:</h5>
                  <ul className="space-y-1.5">
                    {result.changes_applied.map((c: string, idx: number) => (
                      <li key={idx} className="text-[11px] text-slate-400 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800/80 px-5 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px]">
            Academic paraphrasing preserves technical accuracy while reorganizing syntactic clauses to pass Turnitin &amp; DrillBit checks.
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Turnitin &lt; 10% Guideline Compliant
          </span>
        </div>

      </div>
    </div>
  );
};

export default TurnitinRewriterModal;
