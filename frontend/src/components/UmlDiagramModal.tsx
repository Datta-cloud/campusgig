import React, { useState, useEffect, useRef } from 'react';
import { X, Network, Copy, Check, Download, Layers, GitCommit, Database, RefreshCw, ZoomIn, Info } from 'lucide-react';
import mermaid from 'mermaid';
import api from '../services/api';

interface UmlDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  projectTitle: string;
}

export const UmlDiagramModal: React.FC<UmlDiagramModalProps> = ({
  isOpen,
  onClose,
  orderId,
  projectTitle,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dfd_level_0' | 'dfd_level_1' | 'er_diagram' | 'sequence_diagram'>('dfd_level_0');
  const [copied, setCopied] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [svgOutput, setSvgOutput] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, sans-serif',
      themeVariables: {
        darkMode: true,
        background: '#090d16',
        primaryColor: '#4f46e5',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#6366f1',
        lineColor: '#94a3b8',
        secondaryColor: '#059669',
        tertiaryColor: '#d97706',
      }
    });
  }, []);

  const fetchDiagrams = () => {
    setLoading(true);
    setRenderError(null);
    api.get(`/orders/${orderId}/uml-diagrams`)
      .then(res => {
        setData(res.data);
      })
      .catch(err => {
        console.error('Failed to load UML diagrams:', err);
        setRenderError('Unable to load UML diagrams from server.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiagrams();
    }
  }, [isOpen, orderId]);

  // Re-render Mermaid SVG when active tab or data changes
  useEffect(() => {
    if (!data?.diagrams || !activeTab) return;

    const currentDiagram = data.diagrams[activeTab];
    if (!currentDiagram?.mermaid) return;

    const renderDiagram = async () => {
      setRenderError(null);
      try {
        const uniqueId = `mermaid-svg-${activeTab}-${Date.now()}`;
        const { svg } = await mermaid.render(uniqueId, currentDiagram.mermaid);
        setSvgOutput(svg);
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        setRenderError('Failed to parse or render Mermaid diagram syntax.');
      }
    };

    renderDiagram();
  }, [data, activeTab]);

  if (!isOpen) return null;

  const currentDiagram = data?.diagrams ? data.diagrams[activeTab] : null;

  const handleCopyCode = () => {
    if (currentDiagram?.mermaid) {
      navigator.clipboard.writeText(currentDiagram.mermaid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadSvg = () => {
    if (!svgOutput) return;
    const blob = new Blob([svgOutput], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${activeTab}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs: { key: typeof activeTab; label: string; icon: any; badge: string }[] = [
    { key: 'dfd_level_0', label: 'DFD Level-0', icon: Network, badge: 'Context Diagram' },
    { key: 'dfd_level_1', label: 'DFD Level-1', icon: Layers, badge: 'Process Pipeline' },
    { key: 'er_diagram', label: 'ER Schema', icon: Database, badge: 'Database Relational' },
    { key: 'sequence_diagram', label: 'Sequence UML', icon: GitCommit, badge: 'Runtime Execution' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base sm:text-lg">
                  Automated UML &amp; Architecture Engine
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Chapter 3 Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-xl">
                Standard Mermaid.js diagrams for reports, viva examinations, and project manuals: {projectTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchDiagrams}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Regenerate Diagrams"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded ${
                  isActive ? 'bg-indigo-700/80 text-indigo-100' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-950/20">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Generating Academic Architecture Diagrams with Mermaid.js...</span>
            </div>
          ) : currentDiagram ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Diagram Title & Description Banner */}
              <div className="p-3.5 px-5 bg-slate-900/80 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    {currentDiagram.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {currentDiagram.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied Mermaid!' : 'Copy Code'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSvg}
                    disabled={!svgOutput}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download SVG</span>
                  </button>
                </div>
              </div>

              {/* Rendered Visual Diagram */}
              <div className="flex-1 p-6 overflow-auto flex items-center justify-center bg-[#070b12]" ref={containerRef}>
                {renderError ? (
                  <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-center max-w-md">
                    <p className="text-xs font-bold mb-2">Diagram Rendering Error</p>
                    <p className="text-[11px] text-rose-400">{renderError}</p>
                    <pre className="mt-3 p-3 bg-slate-950 rounded text-[10px] text-left overflow-x-auto text-slate-300">
                      {currentDiagram.mermaid}
                    </pre>
                  </div>
                ) : svgOutput ? (
                  <div
                    className="mermaid-render-container w-full h-full flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: svgOutput }}
                  />
                ) : (
                  <div className="text-xs text-slate-500">Preparing SVG vector preview...</div>
                )}
              </div>

              {/* Viva Tip Footnote */}
              <div className="p-3 bg-slate-900 border-t border-slate-800/80 px-5 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-[11px]">
                    <strong>Viva Tip:</strong> Examiners specifically inspect Level-1 DFD pipelines for data storage boundary transitions.
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  Standard IEEE 1471 / UML 2.5 Architecture
                </span>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              No diagram data available.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default UmlDiagramModal;
