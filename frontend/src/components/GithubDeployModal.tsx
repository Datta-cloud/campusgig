import React, { useState } from 'react';
import { X, GitBranch, ExternalLink, Copy, Check, CheckCircle2, Rocket, RefreshCw, Terminal } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';

interface GithubDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  orderNumber: string;
  projectTitle: string;
  existingGithubUrl?: string;
  existingDeployedUrl?: string;
  onSuccess: () => void;
}

export const GithubDeployModal: React.FC<GithubDeployModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  projectTitle,
  existingGithubUrl,
  existingDeployedUrl,
  onSuccess,
}) => {
  const [deploying, setDeploying] = useState(false);
  const [githubUrl, setGithubUrl] = useState(existingGithubUrl || '');
  const [deployUrl, setDeployUrl] = useState(existingDeployedUrl || '');
  const [copiedClone, setCopiedClone] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      const res = await api.post(`/orders/${orderId}/github-deploy`);
      setGithubUrl(res.data.github_repo_url);
      setDeployUrl(res.data.deployed_url);
      onSuccess();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to deploy project to GitHub'));
    } finally {
      setDeploying(false);
    }
  };

  const cloneCmd = `git clone ${githubUrl || `https://github.com/campusgig-projects/${orderNumber.toLowerCase()}`}.git`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-slide-up">
        
        {/* Header Strip */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center font-bold border border-white/20">
              <GitBranch className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-full border border-emerald-400/20">
                  DevOps &amp; Cloud Deployment
                </span>
                <span className="text-xs text-slate-400 font-mono">{orderNumber}</span>
              </div>
              <h3 className="font-bold text-white text-base mt-0.5">
                GitHub Direct Sync &amp; Auto-Deploy
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 text-xs">
          
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">{projectTitle}</h4>
            <p className="text-slate-500 text-xs">
              Directly synchronize your validated project codebase to a public/private GitHub repository and launch a live cloud preview sandbox for your recruiter portfolio.
            </p>
          </div>

          {!githubUrl ? (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Rocket className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-bold text-slate-900 text-sm">One-Click Project Launch</h5>
                <p className="text-slate-500 text-xs mt-0.5">
                  Generates an organized repository with README, requirements.txt, and live hosted URL.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDeploy}
                disabled={deploying}
                className="btn-primary text-xs px-5 py-2.5 font-bold shadow-md shadow-brand-500/20 inline-flex items-center gap-2"
              >
                {deploying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deploying Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    <span>Push to GitHub &amp; Launch Preview</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Deployed live success card */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Live Cloud Deployment Active</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono font-bold bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded">
                    Production
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-200">
                  <span className="font-mono text-[11px] text-slate-700 truncate max-w-xs">{deployUrl}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(deployUrl);
                        setCopiedUrl(true);
                        setTimeout(() => setCopiedUrl(false), 2000);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700"
                      title="Copy URL"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={deployUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-accent text-[11px] px-2.5 py-1 font-bold inline-flex items-center gap-1"
                    >
                      <span>Visit</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* GitHub Repo Card */}
              <div className="p-4 bg-slate-900 rounded-2xl text-slate-200 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-mono text-[11px] flex items-center gap-1">
                    <GitBranch className="w-3.5 h-3.5 text-indigo-400" /> GitHub Repository
                  </span>
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 font-bold text-[11px] flex items-center gap-1"
                  >
                    <span>Open GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-300 flex items-center justify-between">
                  <span className="truncate max-w-xs">{cloneCmd}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(cloneCmd);
                      setCopiedClone(true);
                      setTimeout(() => setCopiedClone(false), 2000);
                    }}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Copy Git Clone Command"
                  >
                    {copiedClone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs px-4 py-2 font-bold"
            >
              Close
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
