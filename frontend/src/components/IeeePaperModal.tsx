import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Copy, Check, ExternalLink, ShieldCheck, BookOpen } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';

interface Section {
  number: string;
  title: string;
  content: string;
}

interface IeeePaperData {
  title: string;
  author: string;
  affiliation: string;
  abstract: string;
  keywords: string[];
  sections: Section[];
  references: string[];
}

interface IeeePaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  orderNumber: string;
}

export const IeeePaperModal: React.FC<IeeePaperModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
}) => {
  const [paper, setPaper] = useState<IeeePaperData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchPaper = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/orders/${orderId}/ieee-paper`);
        setPaper(res.data);
      } catch (err: any) {
        console.error('Failed to load IEEE paper', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPaper();
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  const handleDownloadTex = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/orders/${orderId}/export-ieee-tex`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'text/x-tex' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${orderNumber}_IEEE_Paper.tex`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to download LaTeX file'));
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLatex = async () => {
    if (!paper) return;
    try {
      const res = await api.get(`/orders/${orderId}/export-ieee-tex`);
      navigator.clipboard.writeText(res.data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      alert('Failed to copy LaTeX code');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-slide-up">
        
        {/* Header Strip */}
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                  IEEE Double-Column Format
                </span>
                <span className="text-xs text-slate-400 font-mono">{orderNumber}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mt-0.5">
                IEEE Conference &amp; Journal Paper Draft
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLatex}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Copy LaTeX source code for Overleaf"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied LaTeX!' : 'Copy LaTeX (Overleaf)'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTex}
              disabled={downloading}
              className="btn-primary text-xs px-3.5 py-1.5 font-bold flex items-center gap-1.5 shadow-sm"
              title="Download Overleaf IEEEtran LaTeX .tex file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Downloading...' : 'Download .tex'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Body: Academic IEEE Layout */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm animate-pulse">
              Generating IEEE Double-Column Conference Paper Draft...
            </div>
          ) : paper ? (
            <div className="bg-white max-w-3xl mx-auto p-8 sm:p-12 shadow-md border border-slate-200 font-serif text-slate-900 leading-relaxed text-justify space-y-6">
              
              {/* Paper Title & Authors */}
              <div className="text-center space-y-2 border-b border-slate-200 pb-6">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 font-sans">
                  {paper.title}
                </h1>
                <p className="text-sm font-semibold text-slate-800">
                  {paper.author}
                </p>
                <p className="text-xs text-slate-500 italic">
                  {paper.affiliation}
                </p>
                <div className="pt-2">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    🛡️ Turnitin Originality Benchmark Verified (&lt; 5% Similarity)
                  </span>
                </div>
              </div>

              {/* Abstract & Keywords */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-sans text-xs">
                <p className="italic text-slate-700 font-medium">
                  {paper.abstract}
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-slate-900">Keywords—</span>
                  {paper.keywords.map((k, i) => (
                    <span key={i} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600 text-[11px]">
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              {/* 2-Column Sections Grid on Desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-serif leading-relaxed pt-2">
                {paper.sections.map((sec, idx) => (
                  <div key={idx} className="space-y-2">
                    <h3 className="font-sans font-bold text-sm tracking-wide text-slate-900 uppercase border-b border-slate-100 pb-1">
                      {sec.number}. {sec.title}
                    </h3>
                    <div className="text-slate-700 whitespace-pre-line">
                      {sec.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* References Section */}
              <div className="border-t border-slate-200 pt-6 space-y-2">
                <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900">
                  References
                </h3>
                <div className="space-y-1.5 text-[11px] text-slate-600 font-mono">
                  {paper.references.map((ref, i) => (
                    <p key={i}>{ref}</p>
                  ))}
                </div>
              </div>

            </div>
          ) : null}
        </div>

        {/* Footer info strip */}
        <div className="p-3 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>LaTeX file contains standard <code>\documentclass[conference]{'{IEEEtran}'}</code> header.</span>
          <a
            href="https://www.overleaf.com"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
          >
            <span>Open Overleaf</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
};
