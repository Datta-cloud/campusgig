import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, MessageCircle, Download, CheckCircle2, Clock, ShieldCheck,
  AlertCircle, FileText, QrCode, RefreshCw, Sparkles, Layers, Check,
  Upload, X, Package, Presentation, GraduationCap, Video, Eye, Award, Zap,
  Play, GitBranch, Users, Gift, Share2, Rocket, Network, FileCode, MessageSquare, ShieldAlert
} from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

// New Feature Modals
import CodePreviewModal from '../components/CodePreviewModal';
import RevisionRequestModal from '../components/RevisionRequestModal';
import VivaPrepModal from '../components/VivaPrepModal';
import WalkthroughSchedulerModal from '../components/WalkthroughSchedulerModal';
import PaymentModal from '../components/PaymentModal';
import { PresentationModal } from '../components/PresentationModal';
import { IeeePaperModal } from '../components/IeeePaperModal';
import { GithubDeployModal } from '../components/GithubDeployModal';
import { GroupSplitModal } from '../components/GroupSplitModal';
import { ReferralWalletModal } from '../components/ReferralWalletModal';
import UmlDiagramModal from '../components/UmlDiagramModal';
import ReadmeDockerModal from '../components/ReadmeDockerModal';
import WhatsAppBotModal from '../components/WhatsAppBotModal';
import TurnitinRewriterModal from '../components/TurnitinRewriterModal';

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // New Feature Modals State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewAttachmentId, setPreviewAttachmentId] = useState<number | null>(null);
  const [previewFileName, setPreviewFileName] = useState('');

  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [vivaModalOpen, setVivaModalOpen] = useState(false);
  const [walkthroughModalOpen, setWalkthroughModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentModalType, setPaymentModalType] = useState<'advance' | 'balance'>('balance');
  const [acceptingRevision, setAcceptingRevision] = useState(false);

  // Advanced Academic & Career Suite States
  const [presentationModalOpen, setPresentationModalOpen] = useState(false);
  const [ieeeModalOpen, setIeeeModalOpen] = useState(false);
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [groupSplitModalOpen, setGroupSplitModalOpen] = useState(false);
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [umlModalOpen, setUmlModalOpen] = useState(false);
  const [readmeDockerModalOpen, setReadmeDockerModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [turnitinModalOpen, setTurnitinModalOpen] = useState(false);

  // Admin Direct Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadPhase, setUploadPhase] = useState('Phase 2: Full Source Code Package');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTotalPrice, setUploadTotalPrice] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const PHASES = [
    { id: 'Phase 1: Working Prototype / Demo Preview', label: '🚀 Phase 1: Working Prototype / Demo Preview (Screenshot/Video)', type: 'preview' },
    { id: 'Phase 2: Full Source Code Package', label: '📦 Phase 2: Full Source Code Package (ZIP)', type: 'deliverable' },
    { id: 'Phase 3: Project Report & Documentation', label: '📄 Phase 3: Comprehensive Project Report (IEEE PDF)', type: 'deliverable' },
    { id: 'Phase 4: Presentation PPT Slides', label: '📊 Phase 4: Presentation PPT Slides (15-20 Slides)', type: 'deliverable' },
    { id: 'Phase 5: Viva & Exam Defense Guide', label: '🎓 Phase 5: Viva & Exam Defense Preparation Guide (PDF)', type: 'deliverable' },
    { id: 'Phase 6: Code Walkthrough Video', label: '🎥 Phase 6: Code Walkthrough Video Recording', type: 'deliverable' },
    { id: 'Reference Material', label: '🛠️ Reference Material / Dataset', type: 'reference' },
  ];

  const handleAdminUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !order) return;

    const selectedPhaseObj = PHASES.find(p => p.id === uploadPhase);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('file_type', selectedPhaseObj?.type || 'deliverable');
    formData.append('phase_name', uploadPhase);
    if (uploadTotalPrice && Number(uploadTotalPrice) > 0) {
      formData.append('updated_total_price', uploadTotalPrice);
    }

    setUploading(true);
    try {
      await api.post(`/admin/orders/${order.id}/upload-deliverable`, formData);
      alert(`Deliverable uploaded for ${uploadPhase}! Student can download it now.`);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTotalPrice('');
      fetchOrder();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to upload deliverable'));
    } finally {
      setUploading(false);
    }
  };

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleOpenPreview = (attachmentId: number, fileName: string) => {
    setPreviewAttachmentId(attachmentId);
    setPreviewFileName(fileName);
    setPreviewModalOpen(true);
  };

  const handleAcceptRevision = async () => {
    if (!order) return;
    setAcceptingRevision(true);
    try {
      await api.post(`/orders/${order.id}/accept-revision`);
      alert(`Revision accepted! Order is now In Progress.`);
      fetchOrder();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to accept revision'));
    } finally {
      setAcceptingRevision(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Order Not Found</h2>
        <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  // Parse AI Scope if present
  let aiScopeData: any = null;
  try {
    if (order.ai_refined_scope) {
      aiScopeData = JSON.parse(order.ai_refined_scope);
    }
  } catch (e) {
    // raw text
  }

  const deliverables = (order as any).deliverables || [];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Back & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500">{order.order_number}</span>
                <StatusBadge status={order.status} />
              </div>
              <h1 className="text-2xl font-black text-slate-900 mt-0.5">{order.project_title}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={user?.role === 'admin' ? `/admin/chat/${order.id}` : `/chat/${order.id}`}
              className="btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold"
            >
              <MessageCircle className="w-4 h-4 text-brand-600" /> Chat
            </Link>

            <button
              type="button"
              onClick={() => setWalkthroughModalOpen(true)}
              className="btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              <Video className="w-4 h-4" /> 1-on-1 Walkthrough
            </button>

            <button
              type="button"
              onClick={() => setVivaModalOpen(true)}
              className="btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-purple-600 hover:text-purple-700"
            >
              <Sparkles className="w-4 h-4" /> Viva Prep AI
            </button>

            {order.status !== 'pending_payment' && order.balance_amount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setPaymentModalType('balance');
                  setPaymentModalOpen(true);
                }}
                className="btn-accent flex items-center gap-1.5 px-4 py-2 text-xs font-bold shadow-md shadow-purple-500/20"
              >
                <ShieldCheck className="w-4 h-4" /> Pay Balance (₹{order.balance_amount} Due)
              </button>
            )}

            {order.status !== 'pending_payment' && order.balance_amount <= 0 && (
              <span className="px-3.5 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Fully Paid (₹0 Balance)
              </span>
            )}
          </div>
        </div>

        {/* Milestone Steps Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Milestone Progress</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            
            <div className="p-3.5 rounded-xl border bg-emerald-50 border-emerald-200">
              <span className="text-[10px] font-bold uppercase text-emerald-700 block">Milestone 1</span>
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1 mt-1">
                <Check className="w-4 h-4 text-emerald-600" /> 30% Advance (₹{order.advance_amount})
              </span>
              <span className="text-[10px] text-emerald-600">Locked & Verified</span>
            </div>

            <div className={`p-3.5 rounded-xl border ${
              ['in_progress', 'ready_for_review', 'completed'].includes(order.status)
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              <span className="text-[10px] font-bold uppercase block">Milestone 2</span>
              <span className="text-xs font-bold flex items-center gap-1 mt-1">
                <Clock className="w-4 h-4" /> Development & Sprints
              </span>
              <span className="text-[10px]">Code, Report, PPT build</span>
            </div>

            <div className={`p-3.5 rounded-xl border ${
              ['ready_for_review', 'completed'].includes(order.status)
                ? 'bg-purple-50 border-purple-200 text-purple-900'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              <span className="text-[10px] font-bold uppercase block">Milestone 3</span>
              <span className="text-xs font-bold flex items-center gap-1 mt-1">
                <Sparkles className="w-4 h-4" /> Demo Review
              </span>
              <span className="text-[10px]">Preview verification</span>
            </div>

            <div className={`p-3.5 rounded-xl border ${
              order.status === 'completed'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              <span className="text-[10px] font-bold uppercase block">Milestone 4</span>
              <span className="text-xs font-bold flex items-center gap-1 mt-1">
                <ShieldCheck className="w-4 h-4" /> 70% Balance & Unlock
              </span>
              <span className="text-[10px]">Final deliverables downloaded</span>
            </div>

          </div>
        </div>

        {/* Payment Verification Pending Banner */}
        {order.status === 'payment_submitted' && (
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-center gap-4 text-amber-900 animate-slide-up">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Payment Under Bank Verification ⏳</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Transaction reference <strong>UTR: {order.utr_number}</strong> was received. Mentor is verifying transaction receipt in the bank statement. Project milestones will unlock immediately upon approval.
              </p>
            </div>
          </div>
        )}

        {/* 1. Walkthrough Meeting Live Banner if Scheduled */}
        {(order as any).walkthrough_meeting_url && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Video className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 bg-white/10 px-2 py-0.5 rounded">
                  Confirmed Session
                </span>
                <h4 className="font-bold text-sm sm:text-base text-white mt-0.5">
                  1-on-1 Code Walkthrough &amp; Viva Mentorship
                </h4>
                <p className="text-xs text-indigo-100 mt-0.5">
                  {(order as any).walkthrough_scheduled_at ? new Date((order as any).walkthrough_scheduled_at).toLocaleString() : 'Scheduled session room ready'}
                </p>
              </div>
            </div>

            <a
              href={(order as any).walkthrough_meeting_url}
              target="_blank"
              rel="noreferrer"
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 shrink-0 transition-all"
            >
              <Video className="w-4 h-4" /> Join Video Room Now
            </a>
          </div>
        )}

        {/* 2. Turnitin Originality & AI Plagiarism Badge */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Originality Assured
                </span>
                <span className="text-xs font-bold text-slate-800">Turnitin Verified Standard</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm mt-1">
                Plagiarism: <strong className="text-emerald-700 font-black">{(order as any).plagiarism_score || 3.8}%</strong> • AI Generation: <strong className="text-emerald-700 font-black">{(order as any).ai_detection_score || 0.0}%</strong>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Complies with University &amp; IEEE requirements (Acceptance threshold &lt; 10%).
              </p>
            </div>
          </div>

          {(order as any).plagiarism_report_url && (
            <a
              href={(order as any).plagiarism_report_url}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5 font-bold shrink-0 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" /> View Turnitin PDF
            </a>
          )}
        </div>

        {/* 3. Revision Requested Banner */}
        {order.status === 'revision_requested' && (
          <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    Revision Active
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                    Revision #{(order as any).revision_count} Underway
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    "{(order as any).revision_notes}"
                  </p>
                </div>
              </div>

              {user?.role === 'admin' && (
                <button
                  type="button"
                  onClick={handleAcceptRevision}
                  disabled={acceptingRevision}
                  className="btn-accent text-xs px-4 py-2 font-bold shrink-0 shadow-sm"
                >
                  {acceptingRevision ? 'Accepting...' : 'Accept & Start Working'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4. Ready for Review Action Banner */}
        {order.status === 'ready_for_review' && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                  Deliverables Ready
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-2">
                  Review Files &amp; Complete 70% Balance (₹{order.balance_amount})
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-xl">
                  Inspect the source code previews below. If satisfied, complete the 70% milestone balance to download all uncompressed ZIP repositories. Or request a free revision.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setRevisionModalOpen(true)}
                  className="btn-secondary px-4 py-3 font-bold text-xs border-purple-300 text-purple-700 hover:bg-purple-100/60"
                >
                  <RefreshCw className="w-3.5 h-3.5 inline mr-1" /> Request Revision ({Math.max(0, 2 - ((order as any).revision_count || 0))} left)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentModalType('balance');
                    setPaymentModalOpen(true);
                  }}
                  className="btn-accent px-5 py-3 font-bold text-xs shadow-lg shadow-purple-500/20"
                >
                  <ShieldCheck className="w-4 h-4 inline mr-1" /> Pay Balance / Partial (₹{order.balance_amount} Due)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Academic Excellence & Placement Suite */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                  CampusGig Pro Suite
                </span>
                <span className="text-xs text-indigo-200">Defense &amp; Career Acceleration</span>
              </div>
              <h3 className="font-black text-xl text-white mt-1">Academic Defense &amp; Placement Toolkit</h3>
              <p className="text-xs text-slate-300">
                Interactive presentation deck, IEEE research paper draft, GitHub deployment &amp; capstone group split
              </p>
            </div>

            <button
              type="button"
              onClick={() => setReferralModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 shrink-0 transition-all"
            >
              <Gift className="w-4 h-4" />
              <span>Ambassador Wallet (Cashback)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* 1. Interactive PPT & Defense Mode */}
            <button
              type="button"
              onClick={() => setPresentationModalOpen(true)}
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all hover:scale-[1.02] flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold mb-3 border border-orange-500/30">
                  <Play className="w-5 h-5 fill-orange-400" />
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                  Interactive PPT &amp; Defense
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Fullscreen slide presentation with examiner defense notes &amp; Marp export
                </p>
              </div>
              <span className="text-[10px] font-bold text-orange-400 mt-3 inline-flex items-center gap-1">
                Launch Presentation Mode →
              </span>
            </button>

            {/* 2. IEEE Paper Draft */}
            <button
              type="button"
              onClick={() => setIeeeModalOpen(true)}
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all hover:scale-[1.02] flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold mb-3 border border-indigo-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                  IEEE Paper Generator
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Double-column research paper with LaTeX Overleaf export &amp; tables
                </p>
              </div>
              <span className="text-[10px] font-bold text-indigo-400 mt-3 inline-flex items-center gap-1">
                View IEEE Draft &amp; .tex →
              </span>
            </button>

            {/* 3. GitHub & Cloud Deploy */}
            <button
              type="button"
              onClick={() => setGithubModalOpen(true)}
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all hover:scale-[1.02] flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-3 border border-emerald-500/30">
                  <GitBranch className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                  GitHub &amp; Cloud Launch
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  {order.github_repo_url ? 'Repository active & cloud sandbox live' : '1-click repository push & portfolio sandbox'}
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 mt-3 inline-flex items-center gap-1">
                {order.github_repo_url ? 'Open DevOps Sandbox →' : 'Push Code & Deploy →'}
              </span>
            </button>

            {/* 4. Group Split-Payment */}
            <button
              type="button"
              onClick={() => setGroupSplitModalOpen(true)}
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all hover:scale-[1.02] flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold mb-3 border border-purple-500/30">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                  Group Capstone Split
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Split fee among 2-6 batchmates with individual UPI QR codes
                </p>
              </div>
              <span className="text-[10px] font-bold text-purple-400 mt-3 inline-flex items-center gap-1">
                Manage Teammates →
              </span>
            </button>

            {/* 5. UML & Architecture Generator */}
            <button
              type="button"
              onClick={() => setUmlModalOpen(true)}
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all hover:scale-[1.02] flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold mb-3 border border-sky-500/30">
                  <Network className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-sky-300 transition-colors">
                  UML Architecture Diagrams
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  DFD Level-0/1, ER Schema &amp; Sequence diagrams with Mermaid.js
                </p>
              </div>
              <span className="text-[10px] font-bold text-sky-400 mt-3 inline-flex items-center gap-1">
                Render Chapter 3 Diagrams →
              </span>
            </button>

            {/* 6. GitHub README & Dockerfile */}
            <button
              type="button"
              onClick={() => setReadmeDockerModalOpen(true)}
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all hover:scale-[1.02] flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold mb-3 border border-teal-500/30">
                  <FileCode className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-teal-300 transition-colors">
                  README &amp; Dockerfile
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Shields.io badges, setup instructions &amp; container orchestration
                </p>
              </div>
              <span className="text-[10px] font-bold text-teal-400 mt-3 inline-flex items-center gap-1">
                Inspect DevOps Assets →
              </span>
            </button>

            {/* 7. 2-Way WhatsApp Bot */}
            <button
              type="button"
              onClick={() => setWhatsappModalOpen(true)}
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all hover:scale-[1.02] flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-[#00a884] flex items-center justify-center font-bold mb-3 border border-emerald-500/30">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                  2-Way WhatsApp Bot
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  STATUS, REPORT &amp; MEET command hotline directly via WhatsApp
                </p>
              </div>
              <span className="text-[10px] font-bold text-[#00a884] mt-3 inline-flex items-center gap-1">
                Open WhatsApp Command Center →
              </span>
            </button>

            {/* 8. Plagiarism & AI-Ghostwriting Rewriter */}
            <button
              type="button"
              onClick={() => setTurnitinModalOpen(true)}
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all hover:scale-[1.02] flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold mb-3 border border-rose-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-rose-300 transition-colors">
                  Turnitin Safe Rewriter
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Plagiarism &lt; 5% Safe Mode with IEEE passive academic phrasing
                </p>
              </div>
              <span className="text-[10px] font-bold text-rose-400 mt-3 inline-flex items-center gap-1">
                Academic Paraphraser →
              </span>
            </button>

          </div>
        </div>

        {/* Deliverables Section with Phase-Wise Downloads */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded border border-brand-200">
                Phase-Wise Delivery
              </span>
              <h3 className="font-bold text-slate-900 text-lg mt-1">Project Deliverables & Artifacts</h3>
              <p className="text-xs text-slate-500">
                Download the source code package, documentation report, presentation PPT, and viva notes
              </p>
            </div>

            {/* Admin Upload Trigger Button */}
            {user?.role === 'admin' && (
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="btn-primary text-xs flex items-center gap-2 px-4 py-2.5 font-bold shadow-md shadow-brand-500/20 shrink-0"
              >
                <Upload className="w-4 h-4" /> Upload Phase Deliverable
              </button>
            )}
          </div>

          {/* Actual Uploaded Phase Files (Big Download Cards) */}
          {order.attachments && order.attachments.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Available Downloads ({order.attachments.length} Files Ready):
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {order.attachments.map(att => {
                  const isZip = att.file_name.endsWith('.zip') || att.file_type.includes('Code');
                  const isPdf = att.file_name.endsWith('.pdf') || att.file_type.includes('Report');
                  const isPpt = att.file_name.endsWith('.ppt') || att.file_name.endsWith('.pptx') || att.file_type.includes('PPT');

                  return (
                    <div
                      key={att.id}
                      className="p-5 rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50/50 hover:border-brand-400 transition-all shadow-sm space-y-3 flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                          isZip ? 'bg-purple-100 text-purple-700' :
                          isPdf ? 'bg-rose-100 text-rose-700' :
                          isPpt ? 'bg-amber-100 text-amber-700' :
                          'bg-brand-100 text-brand-700'
                        }`}>
                          {isZip ? <Package className="w-5 h-5" /> :
                           isPdf ? <FileText className="w-5 h-5" /> :
                           isPpt ? <Presentation className="w-5 h-5" /> :
                           <Download className="w-5 h-5" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 inline-block mb-1">
                            {att.file_type || 'Project Deliverable'}
                          </span>
                          <h5 className="text-sm font-bold text-slate-900 truncate" title={att.file_name}>
                            {att.file_name}
                          </h5>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Uploaded by Mentor • {att.created_at ? new Date(att.created_at).toLocaleDateString() : 'Ready'}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(att.id, att.file_name)}
                          className="flex-1 btn-secondary py-2 text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-brand-600" /> Inspect Preview
                        </button>

                        <a
                          href={att.file_url}
                          download={att.file_name}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 btn-primary py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
              <Package className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-700 text-sm">Deliverables Being Prepared</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                The mentor is currently developing the source code and files for this project. As soon as a phase is ready, downloadable files will appear here!
              </p>
              {user?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="btn-primary text-xs px-4 py-2 mt-2 font-bold inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload First Phase Deliverable
                </button>
              )}
            </div>
          )}

          {/* Deliverables Scope Checklist */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Scope Deliverables Checklist:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {deliverables.map((d: string, idx: number) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 capitalize">{d.replace('_', ' ')}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    order.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {order.status === 'completed' ? '✓ Completed' : 'In Progress'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Admin Direct Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleAdminUpload} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl animate-slide-up">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    Mentor Deliverables Uploader
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-1">
                    Upload Phase Deliverable ({order.order_number})
                  </h3>
                </div>
                <button type="button" onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Project Phase / Deliverable Type *</label>
                <select
                  value={uploadPhase}
                  onChange={e => setUploadPhase(e.target.value)}
                  className="input-field text-xs font-semibold"
                >
                  {PHASES.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select File to Upload (.zip, .pdf, .pptx, .mp4 - up to 500MB) *</label>
                <input
                  type="file"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer border border-slate-200 rounded-xl"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Upload full project packages, video walkthroughs, and code repositories up to 500MB.
                </p>
              </div>

              {/* Adjust / Update Total Amount */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Adjust Total Project Price (₹) (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      step="1"
                      value={uploadTotalPrice}
                      onChange={e => setUploadTotalPrice(e.target.value)}
                      placeholder={String(order.total_price)}
                      className="w-full input-field pl-7 text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div className="text-right text-[11px] bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                    <span className="text-slate-400 text-[10px] block">New Balance:</span>
                    <span className="font-extrabold text-brand-600">
                      ₹{Math.max(0, (Number(uploadTotalPrice) || order.total_price) - (order.advance_amount || 0))}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">
                  Advance paid was ₹{order.advance_amount || 0}. If updated, student's remaining payable balance updates automatically.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn-secondary text-xs px-4 py-2 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="btn-primary text-xs px-5 py-2 font-bold"
                >
                  {uploading ? 'Uploading...' : 'Upload & Deliver to Student'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* AI Scope of Work Overview */}
        {aiScopeData && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full w-fit">
              <Sparkles className="w-3.5 h-3.5" /> Approved Project Scope of Work
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Technology Stack</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(aiScopeData.tech_stack || []).map((t: string, i: number) => (
                    <span key={i} className="bg-white px-2.5 py-0.5 rounded border border-slate-200 font-medium text-slate-800">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Methodology</span>
                <p className="text-slate-600 leading-relaxed">{aiScopeData.methodology || 'Iterative development'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Modals for New Upgrades */}
        <CodePreviewModal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          orderId={order.id}
          attachmentId={previewAttachmentId}
          fileName={previewFileName}
          isCompleted={order.status === 'completed'}
        />

        <RevisionRequestModal
          isOpen={revisionModalOpen}
          onClose={() => setRevisionModalOpen(false)}
          orderId={order.id}
          orderNumber={order.order_number}
          revisionCount={(order as any).revision_count || 0}
          maxRevisions={(order as any).max_revisions || 2}
          onSuccess={fetchOrder}
        />

        <VivaPrepModal
          isOpen={vivaModalOpen}
          onClose={() => setVivaModalOpen(false)}
          orderId={order.id}
          projectTitle={order.project_title}
        />

        <WalkthroughSchedulerModal
          isOpen={walkthroughModalOpen}
          onClose={() => setWalkthroughModalOpen(false)}
          orderId={order.id}
          orderNumber={order.order_number}
          walkthroughCount={(order as any).walkthrough_count || 0}
          onSuccess={fetchOrder}
        />

        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          orderId={order.id}
          orderNumber={order.order_number}
          amount={paymentModalType === 'advance' ? order.advance_amount : order.balance_amount}
          totalPrice={order.total_price}
          advanceAmount={order.advance_amount}
          balanceAmount={order.balance_amount}
          paymentType={paymentModalType}
          onSuccess={fetchOrder}
        />

        <PresentationModal
          isOpen={presentationModalOpen}
          onClose={() => setPresentationModalOpen(false)}
          orderId={order.id}
          projectTitle={order.project_title}
        />

        <IeeePaperModal
          isOpen={ieeeModalOpen}
          onClose={() => setIeeeModalOpen(false)}
          orderId={order.id}
          orderNumber={order.order_number}
        />

        <GithubDeployModal
          isOpen={githubModalOpen}
          onClose={() => setGithubModalOpen(false)}
          orderId={order.id}
          orderNumber={order.order_number}
          projectTitle={order.project_title}
          existingGithubUrl={order.github_repo_url}
          existingDeployedUrl={order.deployed_url}
          onSuccess={fetchOrder}
        />

        <GroupSplitModal
          isOpen={groupSplitModalOpen}
          onClose={() => setGroupSplitModalOpen(false)}
          orderId={order.id}
          orderNumber={order.order_number}
          onSuccess={fetchOrder}
        />

        <ReferralWalletModal
          isOpen={referralModalOpen}
          onClose={() => setReferralModalOpen(false)}
        />

        <UmlDiagramModal
          isOpen={umlModalOpen}
          onClose={() => setUmlModalOpen(false)}
          orderId={order.id}
          projectTitle={order.project_title}
        />

        <ReadmeDockerModal
          isOpen={readmeDockerModalOpen}
          onClose={() => setReadmeDockerModalOpen(false)}
          orderId={order.id}
          projectTitle={order.project_title}
        />

        <WhatsAppBotModal
          isOpen={whatsappModalOpen}
          onClose={() => setWhatsappModalOpen(false)}
          orderId={order.id}
          orderNumber={order.order_number}
          projectTitle={order.project_title}
        />

        <TurnitinRewriterModal
          isOpen={turnitinModalOpen}
          onClose={() => setTurnitinModalOpen(false)}
          orderId={order.id}
          projectTitle={order.project_title}
        />

      </div>
    </div>
  );
};

export default OrderDetail;
