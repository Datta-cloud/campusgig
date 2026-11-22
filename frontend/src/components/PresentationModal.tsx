import React, { useState, useEffect } from 'react';
import { X, Play, ChevronLeft, ChevronRight, Download, Maximize2, Minimize2, Mic, Sparkles, CheckCircle2 } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';

interface Slide {
  slide_number: number;
  badge: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  speaker_notes: string;
  code_snippet?: string | null;
}

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  projectTitle: string;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({
  isOpen,
  onClose,
  orderId,
  projectTitle,
}) => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchDeck = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/orders/${orderId}/presentation-deck`);
        setSlides(res.data.slides || []);
        setCurrentSlideIndex(0);
      } catch (err: any) {
        console.error('Failed to load presentation deck', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDeck();
  }, [isOpen, orderId]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlideIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, slides.length, isFullscreen]);

  if (!isOpen) return null;

  const currentSlide = slides[currentSlideIndex];

  const handleDownloadMarp = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/orders/${orderId}/export-presentation-markdown`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${projectTitle.slice(0, 20)}_Presentation_Marp.md`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to download presentation'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 ${isFullscreen ? 'p-0' : ''}`}>
      <div className={`bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 ${
        isFullscreen ? 'w-screen h-screen rounded-none' : 'w-full max-w-5xl h-[88vh]'
      }`}>
        
        {/* Top Header */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 font-bold">
              <Play className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  Interactive PPT &amp; Defense Mode
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Slide {currentSlideIndex + 1} of {slides.length || 8}
                </span>
              </div>
              <h3 className="font-bold text-slate-100 text-sm truncate max-w-md sm:max-w-lg mt-0.5">
                {projectTitle}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadMarp}
              disabled={downloading}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
              title="Download Marp / Reveal.js Presentation Markdown"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{downloading ? 'Downloading...' : 'Export .pptx / .md'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Presentation'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Presentation Main Canvas */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left/Main: Slide Visual Canvas */}
          <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 overflow-y-auto">
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm animate-pulse">
                Generating interactive presentation slides...
              </div>
            ) : currentSlide ? (
              <div className="space-y-6 max-w-2xl mx-auto my-auto w-full animate-fade-in">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    {currentSlide.badge}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 leading-tight tracking-tight">
                    {currentSlide.title}
                  </h2>
                  {currentSlide.subtitle && (
                    <p className="text-sm text-slate-400 mt-1 font-medium italic">
                      {currentSlide.subtitle}
                    </p>
                  )}
                </div>

                {/* Bullet Points */}
                <div className="space-y-3 pt-2">
                  {currentSlide.bullets.map((b, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-slate-800/40 border border-slate-800 p-3.5 rounded-2xl">
                      <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0 shadow-sm shadow-amber-400/50" />
                      <p className="text-sm text-slate-200 leading-relaxed font-normal">{b}</p>
                    </div>
                  ))}
                </div>

                {/* Code Snippet if present */}
                {currentSlide.code_snippet && (
                  <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto">
                    <pre>{currentSlide.code_snippet}</pre>
                  </div>
                )}
              </div>
            ) : null}

            {/* Slide Navigation Strip */}
            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentSlideIndex
                        ? 'w-8 bg-amber-400 shadow-md shadow-amber-400/30'
                        : 'w-2 bg-slate-700 hover:bg-slate-600'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentSlideIndex === 0}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
                  disabled={currentSlideIndex === slides.length - 1}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-30 disabled:pointer-events-none text-slate-950 font-extrabold text-xs flex items-center gap-1 shadow-lg shadow-amber-500/20"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right/Bottom Panel: Speaker Notes (Examiner Defense Script) */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-950/60 p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Mic className="w-4 h-4 text-amber-400" />
                <span>What to say to Examiner</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Word-by-word recommended defense script for Slide {currentSlideIndex + 1}:
              </p>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-sans shadow-inner">
                "{currentSlide?.speaker_notes || 'Speak clearly, introduce the architecture and address the research challenges.'}"
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/60 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Examiner Tip: Keep eye contact &amp; pace at 1 slide/min</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Press <strong>Right Arrow / Space</strong> to advance slides, <strong>Left Arrow</strong> to go back.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
