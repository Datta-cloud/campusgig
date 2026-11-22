import React, { useState, useEffect } from 'react';
import { X, FileCode, Copy, Check, Download, Box, Terminal, RefreshCw, CheckCircle2, Shield } from 'lucide-react';
import api from '../services/api';

interface ReadmeDockerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  projectTitle: string;
}

export const ReadmeDockerModal: React.FC<ReadmeDockerModalProps> = ({
  isOpen,
  onClose,
  orderId,
  projectTitle,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    readme_markdown: string;
    dockerfile: string;
    docker_compose: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'readme' | 'dockerfile' | 'compose'>('readme');
  const [copied, setCopied] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api.get(`/orders/${orderId}/readme-docker`)
      .then(res => setData(res.data))
      .catch(err => {
        console.error(err);
        setData({
          readme_markdown: `# ${projectTitle}\n\nAutomated package for Capstone Project.`,
          dockerfile: 'FROM python:3.11-slim\nWORKDIR /app\nCOPY . .\nCMD ["python", "main.py"]',
          docker_compose: 'version: "3.8"\nservices:\n  app:\n    build: .\n    ports:\n      - "8000:8000"'
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  const currentContent = activeTab === 'readme'
    ? data?.readme_markdown || ''
    : activeTab === 'dockerfile'
    ? data?.dockerfile || ''
    : data?.docker_compose || '';

  const currentFileName = activeTab === 'readme'
    ? 'README.md'
    : activeTab === 'dockerfile'
    ? 'Dockerfile'
    : 'docker-compose.yml';

  const handleCopy = () => {
    if (currentContent) {
      navigator.clipboard.writeText(currentContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!currentContent) return;
    const blob = new Blob([currentContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col h-[88vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base sm:text-lg">
                  GitHub README &amp; Dockerfile Generator
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  DevOps Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-xl">
                Aesthetic badges, setup instructions, and container configuration for resume portfolios
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Regenerate"
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

        {/* Tab Bar */}
        <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('readme')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'readme'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>README.md (Badges)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dockerfile')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'dockerfile'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Dockerfile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('compose')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'compose'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>docker-compose.yml</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {currentFileName}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-5 font-mono text-xs bg-[#090d16] select-text leading-relaxed">
          {loading ? (
            <div className="py-24 text-center text-slate-500 flex flex-col items-center gap-3">
              <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Generating Shields.io badges and Docker infrastructure...</span>
            </div>
          ) : (
            <pre className="text-slate-200 whitespace-pre overflow-x-auto">
              {currentContent}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800/80 px-5 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">
              Drop these files directly into your GitHub repo root to get verified open-source recruiter stars.
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Docker 25+ | Compose v2 | GitHub Flavored Markdown
          </span>
        </div>

      </div>
    </div>
  );
};

export default ReadmeDockerModal;
