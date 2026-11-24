import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, MessageCircle, Download, CheckCircle2, Clock, ShieldCheck,
  AlertCircle, FileText, QrCode, RefreshCw, Sparkles, Layers, Check,
  Upload, X, Package, Presentation, GraduationCap, Video, Eye, Award, Zap,
  Play, GitBranch, Users, Gift, Share2, Rocket, Network, FileCode, MessageSquare, ShieldAlert, Lock,
  Unlock, ChevronRight, FileCheck, User, Star, Calendar, History, UserCheck
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

  // Milestone Tabs & Feature Lock States
  const [activePhaseTab, setActivePhaseTab] = useState<'all' | 'phase_1' | 'phase_2' | 'phase_3' | 'phase_4' | 'phase_5'>('all');
  const [lockedFeatureInfo, setLockedFeatureInfo] = useState<{
    title: string;
    description: string;
    requiredMilestone: string;
    requiredPercent: number;
  } | null>(null);

  const handleAdminVerifyPayment = async (action: 'approve' | 'reject') => {
    if (!order) return;
    let reason: string | undefined = undefined;
    if (action === 'reject') {
      const promptRes = window.prompt("Reason for rejecting payment (e.g., UTR not received in bank account):");
      if (promptRes === null) return;
      reason = promptRes || "Payment verification failed";
    }
    try {
      await api.post(`/admin/orders/${order.id}/verify-payment`, { action, notes: reason });
      alert(action === 'approve' ? '✅ Payment verified and credited successfully!' : '❌ Payment rejected.');
      fetchOrder();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to verify payment'));
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

  const handleDownloadDeliverable = async (attId: number, fileName: string) => {
    try {
      const res = await api.get(`/orders/${order?.id}/download/${attId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to download deliverable. Please complete balance payment to unlock.'));
    }
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

  const advanceConfirmed = Boolean(
    order?.advance_paid_at ||
    ['advance_paid', 'in_progress', 'ready_for_review', 'completed'].includes(order?.status || '')
  );
  const totalPrice = Number(order?.total_price || 0);
  const balanceAmount = Number(order?.balance_amount || 0);
  const totalPaid = Math.max(0, totalPrice - balanceAmount);
  const paidRatio = totalPrice > 0 ? (totalPaid / totalPrice) : (order?.status === 'completed' ? 1 : 0);
  const paidPercent = Math.min(100, Math.round(paidRatio * 100));

  const isMidtermUnlocked = Boolean(advanceConfirmed && (paidRatio >= 0.49 || order?.status === 'completed'));
  const isFullySettled = Boolean(order?.status === 'completed' || balanceAmount <= 0.01);

  const getAttachmentPhase = (att: any): 'phase_1' | 'phase_2' | 'phase_3' | 'phase_4' | 'phase_5' => {
    if (att.phase && ['phase_1', 'phase_2', 'phase_3', 'phase_4', 'phase_5'].includes(att.phase)) {
      return att.phase;
    }
    const t = `${att.file_type || ''} ${att.file_name || ''}`.toLowerCase();
    if (t.includes('phase 1') || t.includes('synopsis') || t.includes('scope') || t.includes('architecture') || t.includes('diagram') || t.includes('srs') || t.includes('reference')) return 'phase_1';
    if (t.includes('phase 2') || t.includes('prototype') || t.includes('draft') || t.includes('mid-term') || t.includes('midterm') || t.includes('devops')) return 'phase_2';
    if (t.includes('phase 4') || t.includes('report') || t.includes('ieee') || t.includes('paper') || t.includes('ppt') || t.includes('presentation')) return 'phase_4';
    if (t.includes('phase 5') || t.includes('phase 6') || t.includes('viva') || t.includes('exam') || t.includes('defense') || t.includes('turnitin') || t.includes('certificate') || t.includes('walkthrough') || t.includes('video')) return 'phase_5';
    return 'phase_3';
  };

  const isAttachmentUnlocked = (att: any) => {
    if (user?.role === 'admin') return true;
    if (typeof att.is_unlocked === 'boolean') return att.is_unlocked;
    const phase = getAttachmentPhase(att);
    if (phase === 'phase_1') return advanceConfirmed;
    if (phase === 'phase_2') return isMidtermUnlocked;
    return isFullySettled;
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

            {order.status === 'balance_submitted' ? (
              <button
                type="button"
                onClick={() => {
                  setPaymentModalType('balance');
                  setPaymentModalOpen(true);
                }}
                className="bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-amber-300 shadow-sm"
              >
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" /> Balance Verification Underway (₹{order.balance_amount} Due)
              </button>
            ) : (
              order.status !== 'pending_payment' && order.status !== 'completed' && order.balance_amount > 0 && (
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
              )
            )}

            {(order.status === 'completed' || (order.status !== 'pending_payment' && order.balance_amount <= 0)) && (
              <span className="px-3.5 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Fully Settled & Completed
              </span>
            )}
          </div>
        </div>

        {/* Comprehensive Order Progress Tracking & Visual Lifecycle Timeline */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Order Lifecycle Progress</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                Order Tracking & Milestone Timeline
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Target Delivery:</span>
              <span className="text-xs font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-600" />
                {order.deadline ? new Date(order.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '5-7 Days'}
              </span>
            </div>
          </div>

          {/* Connected Lifecycle Stepper */}
          <div className="relative">
            {/* Stepper Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                {
                  id: 'placed',
                  title: 'Order Placed',
                  desc: 'Requirements & 30% advance submitted',
                  isDone: ['advance_paid', 'in_progress', 'ready_for_review', 'completed', 'balance_submitted'].includes(order.status),
                  isActive: ['pending_payment', 'payment_submitted'].includes(order.status),
                  stepNum: 1,
                },
                {
                  id: 'accepted',
                  title: 'Mentor Accepted',
                  desc: 'Payment confirmed & academic mentor assigned',
                  isDone: ['in_progress', 'ready_for_review', 'completed', 'balance_submitted'].includes(order.status),
                  isActive: order.status === 'advance_paid',
                  stepNum: 2,
                },
                {
                  id: 'progress',
                  title: 'In Progress',
                  desc: 'Research, development & draft review',
                  isDone: ['ready_for_review', 'completed', 'balance_submitted'].includes(order.status),
                  isActive: order.status === 'in_progress',
                  stepNum: 3,
                },
                {
                  id: 'delivered',
                  title: 'Delivered / Demo',
                  desc: 'Deliverables uploaded for inspection',
                  isDone: ['completed', 'balance_submitted'].includes(order.status),
                  isActive: ['ready_for_review', 'revision_requested'].includes(order.status),
                  stepNum: 4,
                },
                {
                  id: 'completed',
                  title: 'Completed',
                  desc: 'Final settlement & all assets unlocked',
                  isDone: order.status === 'completed',
                  isActive: order.status === 'balance_submitted',
                  stepNum: 5,
                },
              ].map(step => {
                return (
                  <div
                    key={step.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 ${
                      step.isDone
                        ? 'border-emerald-200 bg-emerald-50/60'
                        : step.isActive
                        ? 'border-brand-500 bg-brand-50/70 shadow-sm ring-2 ring-brand-100'
                        : 'border-slate-200 bg-slate-50/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                          step.isDone
                            ? 'bg-emerald-600 text-white'
                            : step.isActive
                            ? 'bg-brand-600 text-white animate-pulse'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {step.isDone ? <Check className="w-3.5 h-3.5" /> : step.stepNum}
                      </span>
                      {step.isDone && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          Done
                        </span>
                      )}
                      {step.isActive && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-100 px-2 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Special Notification for Revision Requested */}
            {order.status === 'revision_requested' && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900">
                <RefreshCw className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
                <span>
                  <strong>Revision In Progress:</strong> Your feedback is currently being incorporated by the mentor. You will receive an updated preview soon.
                </span>
              </div>
            )}
          </div>

          {/* Buyer & Freelancer Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Assigned Freelancer / Mentor Card */}
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white flex flex-col justify-between">
              <div className="flex items-start gap-3.5">
                <div className="relative">
                  <img
                    src={order.freelancer?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                    alt={order.freelancer?.name || 'Academic Mentor'}
                    className="w-13 h-13 rounded-2xl object-cover border-2 border-white shadow-sm ring-1 ring-slate-200"
                    style={{ width: '52px', height: '52px' }}
                  />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" title="Online & Active" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      Assigned Mentor
                    </span>
                    <span className="flex items-center text-xs font-bold text-amber-600">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                      {order.freelancer?.rating || '4.9'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base mt-1 truncate">
                    {order.freelancer?.name || 'Dr. Rohit Sharma'}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">
                    {order.freelancer?.role || 'Senior Academic Mentor & Tech Lead'}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Verified Mentor:</span> Top 1% Verified Expert
                </div>
                <Link
                  to={user?.role === 'admin' ? `/admin/chat/${order.id}` : `/chat/${order.id}`}
                  className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all shrink-0"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Chat with Mentor
                </Link>
              </div>
            </div>

            {/* Buyer / Student Information Card */}
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Buyer Profile
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    ID: #{order.order_number}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  {order.student?.full_name || user?.full_name || 'Datta Hadke'}
                </h4>
                <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                  <p>
                    <strong className="text-slate-700 font-medium">Academic Stream:</strong>{' '}
                    {order.student_type === 'school' ? 'School Student (Board Prep)' : 'College / Degree Engineering'}
                  </p>
                  <p className="truncate">
                    <strong className="text-slate-700 font-medium">College/Branch:</strong>{' '}
                    {order.student?.college_branch || order.student?.college_name || order.student?.school_class || 'Computer Science & Engineering'}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Speed: <strong className="text-slate-700 font-semibold">{order.urgency === 'super_express' ? 'Super Express (24h)' : order.urgency === 'express' ? 'Express (48h)' : 'Normal (5-7 Days)'}</strong></span>
                <span>Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
          </div>

          {/* Status Update History Log Audit Trail */}
          <div className="pt-2 border-t border-slate-100">
            <details className="group">
              <summary className="cursor-pointer list-none flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <History className="w-4 h-4 text-brand-600" />
                  Status Update History & Audit Trail ({order.status_history?.length || 1} Events)
                </span>
                <span className="text-xs font-semibold text-brand-600 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="mt-3 space-y-2.5 pl-2 pr-1">
                {(order.status_history && order.status_history.length > 0 ? order.status_history : [
                  {
                    status: order.status,
                    title: 'Order Created',
                    note: 'Project initialized and registration completed in CampusGig AI system.',
                    timestamp: order.created_at,
                    actor: 'Student'
                  }
                ]).map((hist, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-white text-xs shadow-2xs"
                  >
                    <div className="w-2 h-2 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-800">{hist.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(hist.timestamp).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{hist.note}</p>
                      <span className="inline-block mt-1 text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        Action by: {hist.actor}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>

        {/* Payment Verification Pending Banner */}
        {order.status === 'payment_submitted' && (
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-amber-900 animate-slide-up">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Advance Payment Under Bank Verification ⏳</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Transaction reference <strong>UTR: {order.utr_number}</strong> was received. Mentor is verifying transaction receipt in the bank statement. Project milestones will unlock immediately upon approval.
                </p>
              </div>
            </div>
            {user?.role === 'admin' && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleAdminVerifyPayment('approve')}
                  className="btn-primary text-xs px-3.5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve ₹{order.advance_amount}
                </button>
                <button
                  type="button"
                  onClick={() => handleAdminVerifyPayment('reject')}
                  className="btn-secondary text-xs px-3 py-2 font-bold text-red-600 hover:bg-red-50 flex items-center gap-1 border border-red-200"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            )}
          </div>
        )}

        {/* Balance Verification Pending Banner */}
        {order.status === 'balance_submitted' && (
          <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-indigo-900 animate-slide-up">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Balance Payment Verification Underway ⏳</h4>
                <p className="text-xs text-indigo-800 mt-0.5">
                  Transaction reference <strong>UTR: {order.utr_number}</strong> was received. Mentor is verifying transaction receipt in the bank statement. Full deliverables will unlock immediately upon approval.
                </p>
              </div>
            </div>
            {user?.role === 'admin' && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleAdminVerifyPayment('approve')}
                  className="btn-primary text-xs px-3.5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve Balance
                </button>
                <button
                  type="button"
                  onClick={() => handleAdminVerifyPayment('reject')}
                  className="btn-secondary text-xs px-3 py-2 font-bold text-red-600 hover:bg-red-50 flex items-center gap-1 border border-red-200"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            )}
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
              onClick={() => {
                if (isFullySettled || user?.role === 'admin') {
                  setPresentationModalOpen(true);
                } else {
                  setLockedFeatureInfo({
                    title: 'Interactive PPT & Defense Presentation',
                    description: 'Fullscreen interactive slide deck featuring examiner defense questions, speaker notes, and Marp markdown export. Unlocks after 100% balance settlement.',
                    requiredMilestone: '100% Final Settlement',
                    requiredPercent: 100
                  });
                }
              }}
              className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] flex flex-col justify-between group relative overflow-hidden ${
                isFullySettled || user?.role === 'admin'
                  ? 'bg-white/5 hover:bg-white/10 border-white/10'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 opacity-85'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold border border-orange-500/30">
                    <Play className="w-5 h-5 fill-orange-400" />
                  </div>
                  {isFullySettled || user?.role === 'admin' ? (
                    <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      ✓ Unlocked
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 inline-flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> 100% Due
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                  Interactive PPT &amp; Defense
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Fullscreen slide presentation with examiner defense notes &amp; Marp export
                </p>
              </div>
              <span className={`text-[10px] font-bold mt-3 inline-flex items-center gap-1 ${
                isFullySettled || user?.role === 'admin' ? 'text-orange-400' : 'text-slate-400'
              }`}>
                {isFullySettled || user?.role === 'admin' ? 'Launch Presentation Mode →' : 'Unlock at 100% Settlement →'}
              </span>
            </button>

            {/* 2. IEEE Paper Draft */}
            <button
              type="button"
              onClick={() => {
                if (isFullySettled || user?.role === 'admin') {
                  setIeeeModalOpen(true);
                } else {
                  setLockedFeatureInfo({
                    title: 'IEEE Research Paper Generator',
                    description: 'Double-column research paper with LaTeX Overleaf export, citation tables, and academic formatting. Unlocks after 100% balance settlement.',
                    requiredMilestone: '100% Final Settlement',
                    requiredPercent: 100
                  });
                }
              }}
              className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] flex flex-col justify-between group relative overflow-hidden ${
                isFullySettled || user?.role === 'admin'
                  ? 'bg-white/5 hover:bg-white/10 border-white/10'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 opacity-85'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/30">
                    <FileText className="w-5 h-5" />
                  </div>
                  {isFullySettled || user?.role === 'admin' ? (
                    <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      ✓ Unlocked
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 inline-flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> 100% Due
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                  IEEE Paper Generator
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Double-column research paper with LaTeX Overleaf export &amp; tables
                </p>
              </div>
              <span className={`text-[10px] font-bold mt-3 inline-flex items-center gap-1 ${
                isFullySettled || user?.role === 'admin' ? 'text-indigo-400' : 'text-slate-400'
              }`}>
                {isFullySettled || user?.role === 'admin' ? 'View IEEE Draft & .tex →' : 'Unlock at 100% Settlement →'}
              </span>
            </button>

            {/* 3. GitHub & Cloud Deploy */}
            <button
              type="button"
              onClick={() => {
                if (isFullySettled || user?.role === 'admin') {
                  setGithubModalOpen(true);
                } else {
                  setLockedFeatureInfo({
                    title: 'GitHub Repository & Cloud Deployment',
                    description: '1-click repository push, environment variables configuration, and cloud portfolio sandbox hosting. Unlocks after 100% balance settlement.',
                    requiredMilestone: '100% Final Settlement',
                    requiredPercent: 100
                  });
                }
              }}
              className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] flex flex-col justify-between group relative overflow-hidden ${
                isFullySettled || user?.role === 'admin'
                  ? 'bg-white/5 hover:bg-white/10 border-white/10'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 opacity-85'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  {isFullySettled || user?.role === 'admin' ? (
                    <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      ✓ Unlocked
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 inline-flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> 100% Due
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                  GitHub &amp; Cloud Launch
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  {order.github_repo_url ? 'Repository active & cloud sandbox live' : '1-click repository push & portfolio sandbox'}
                </p>
              </div>
              <span className={`text-[10px] font-bold mt-3 inline-flex items-center gap-1 ${
                isFullySettled || user?.role === 'admin' ? 'text-emerald-400' : 'text-slate-400'
              }`}>
                {isFullySettled || user?.role === 'admin'
                  ? (order.github_repo_url ? 'Open DevOps Sandbox →' : 'Push Code & Deploy →')
                  : 'Unlock at 100% Settlement →'}
              </span>
            </button>

            {/* 4. Group Split-Payment */}
            <button
              type="button"
              onClick={() => setGroupSplitModalOpen(true)}
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all hover:scale-[1.02] flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold border border-purple-500/30">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">
                    Always Active
                  </span>
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
              onClick={() => {
                if (advanceConfirmed || user?.role === 'admin') {
                  setUmlModalOpen(true);
                } else {
                  setLockedFeatureInfo({
                    title: 'UML Architecture & System Diagrams',
                    description: 'Generate DFD Level-0/1, ER Schema & Sequence diagrams with Mermaid.js for Chapter 3. Unlocks once 30% advance is confirmed by mentor.',
                    requiredMilestone: '30% Advance Confirmation',
                    requiredPercent: 30
                  });
                }
              }}
              className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] flex flex-col justify-between group relative overflow-hidden ${
                advanceConfirmed || user?.role === 'admin'
                  ? 'bg-white/5 hover:bg-white/10 border-white/10'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 opacity-85'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold border border-sky-500/30">
                    <Network className="w-5 h-5" />
                  </div>
                  {advanceConfirmed || user?.role === 'admin' ? (
                    <span className="text-[9px] font-bold text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-500/30">
                      ✓ Phase 1 Unlocked
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 inline-flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> 30% Advance
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-sky-300 transition-colors">
                  UML Architecture Diagrams
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  DFD Level-0/1, ER Schema &amp; Sequence diagrams with Mermaid.js
                </p>
              </div>
              <span className={`text-[10px] font-bold mt-3 inline-flex items-center gap-1 ${
                advanceConfirmed || user?.role === 'admin' ? 'text-sky-400' : 'text-slate-400'
              }`}>
                {advanceConfirmed || user?.role === 'admin' ? 'Render Chapter 3 Diagrams →' : 'Unlock with 30% Advance →'}
              </span>
            </button>

            {/* 6. GitHub README & Dockerfile */}
            <button
              type="button"
              onClick={() => {
                if (isMidtermUnlocked || user?.role === 'admin') {
                  setReadmeDockerModalOpen(true);
                } else {
                  setLockedFeatureInfo({
                    title: 'README & Dockerfile Container Orchestration',
                    description: 'Shields.io badges, setup instructions & container orchestration files for mid-term evaluation. Unlocks after 50% milestone payment.',
                    requiredMilestone: '50% Milestone Payment',
                    requiredPercent: 50
                  });
                }
              }}
              className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] flex flex-col justify-between group relative overflow-hidden ${
                isMidtermUnlocked || user?.role === 'admin'
                  ? 'bg-white/5 hover:bg-white/10 border-white/10'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 opacity-85'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold border border-teal-500/30">
                    <FileCode className="w-5 h-5" />
                  </div>
                  {isMidtermUnlocked || user?.role === 'admin' ? (
                    <span className="text-[9px] font-bold text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-full border border-teal-500/30">
                      ✓ Phase 2 Unlocked
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 inline-flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> 50% Milestone
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-teal-300 transition-colors">
                  README &amp; Dockerfile
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Shields.io badges, setup instructions &amp; container orchestration
                </p>
              </div>
              <span className={`text-[10px] font-bold mt-3 inline-flex items-center gap-1 ${
                isMidtermUnlocked || user?.role === 'admin' ? 'text-teal-400' : 'text-slate-400'
              }`}>
                {isMidtermUnlocked || user?.role === 'admin' ? 'Inspect DevOps Assets →' : 'Unlock at 50% Milestone →'}
              </span>
            </button>

            {/* 7. 2-Way WhatsApp Bot */}
            <button
              type="button"
              onClick={() => {
                if (advanceConfirmed || user?.role === 'admin') {
                  setWhatsappModalOpen(true);
                } else {
                  setLockedFeatureInfo({
                    title: '2-Way WhatsApp Bot Command Center',
                    description: 'STATUS, REPORT & MEET commands directly on WhatsApp. Unlocks once 30% advance is confirmed by mentor.',
                    requiredMilestone: '30% Advance Confirmation',
                    requiredPercent: 30
                  });
                }
              }}
              className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] flex flex-col justify-between group relative overflow-hidden ${
                advanceConfirmed || user?.role === 'admin'
                  ? 'bg-white/5 hover:bg-white/10 border-white/10'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 opacity-85'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-[#00a884] flex items-center justify-center font-bold border border-emerald-500/30">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  {advanceConfirmed || user?.role === 'admin' ? (
                    <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      ✓ Phase 1 Unlocked
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 inline-flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> 30% Advance
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                  2-Way WhatsApp Bot
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  STATUS, REPORT &amp; MEET command hotline directly via WhatsApp
                </p>
              </div>
              <span className={`text-[10px] font-bold mt-3 inline-flex items-center gap-1 ${
                advanceConfirmed || user?.role === 'admin' ? 'text-[#00a884]' : 'text-slate-400'
              }`}>
                {advanceConfirmed || user?.role === 'admin' ? 'Open WhatsApp Command Center →' : 'Unlock with 30% Advance →'}
              </span>
            </button>

            {/* 8. Plagiarism & AI-Ghostwriting Rewriter */}
            <button
              type="button"
              onClick={() => {
                if (isFullySettled || user?.role === 'admin') {
                  setTurnitinModalOpen(true);
                } else {
                  setLockedFeatureInfo({
                    title: 'Turnitin Safe Rewriter & Plagiarism Shield',
                    description: 'Plagiarism < 5% Safe Mode with IEEE passive academic phrasing and AI similarity reduction. Unlocks after 100% balance settlement.',
                    requiredMilestone: '100% Final Settlement',
                    requiredPercent: 100
                  });
                }
              }}
              className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] flex flex-col justify-between group relative overflow-hidden ${
                isFullySettled || user?.role === 'admin'
                  ? 'bg-white/5 hover:bg-white/10 border-white/10'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 opacity-85'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold border border-rose-500/30">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  {isFullySettled || user?.role === 'admin' ? (
                    <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      ✓ Unlocked
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 inline-flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> 100% Due
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-rose-300 transition-colors">
                  Turnitin Safe Rewriter
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Plagiarism &lt; 5% Safe Mode with IEEE passive academic phrasing
                </p>
              </div>
              <span className={`text-[10px] font-bold mt-3 inline-flex items-center gap-1 ${
                isFullySettled || user?.role === 'admin' ? 'text-rose-400' : 'text-slate-400'
              }`}>
                {isFullySettled || user?.role === 'admin' ? 'Academic Paraphraser →' : 'Unlock at 100% Settlement →'}
              </span>
            </button>

          </div>
        </div>

        {/* Structured Mentor Deliverables & Milestones Section */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded border border-brand-200">
                  Milestone-Gated Deliverables
                </span>
                <span className="text-xs text-slate-500">Structured Academic Milestones</span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg mt-1">Mentor Deliverables &amp; Artifacts</h3>
              <p className="text-xs text-slate-500">
                Deliverables prepared by your verified mentor are organized phase-wise below. Files unlock automatically as payment milestones are reached.
              </p>
            </div>
          </div>

          {/* 3-Step Milestone Progression Tracker */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Step 1: 30% Advance */}
            <div className={`p-4 rounded-2xl border-2 transition-all ${
              advanceConfirmed
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/60 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-slate-200">
                  Milestone 1 • 30% Advance
                </span>
                {advanceConfirmed ? (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Confirmed
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Awaiting Verification
                  </span>
                )}
              </div>
              <h4 className="font-bold text-sm text-slate-900">Phase 1: Scope &amp; UML Architecture</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Project Synopsis, SRS requirements, and Mermaid.js system architecture diagrams.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-600">Access:</span>
                <span className={advanceConfirmed ? 'text-emerald-700' : 'text-amber-700'}>
                  {advanceConfirmed ? '🔓 Unlocked for Download' : '🔒 Pay 30% Advance to Unlock'}
                </span>
              </div>
            </div>

            {/* Step 2: 50% Mid-Term */}
            <div className={`p-4 rounded-2xl border-2 transition-all ${
              isMidtermUnlocked
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                : 'bg-slate-50 border-slate-200 text-slate-950'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-slate-200">
                  Milestone 2 • 50% Payment
                </span>
                {isMidtermUnlocked ? (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Confirmed
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> {paidPercent}% Paid
                  </span>
                )}
              </div>
              <h4 className="font-bold text-sm text-slate-900">Phase 2: Working Prototype &amp; DevOps</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Demo preview recording, mid-term draft, setup instructions, and Docker orchestration.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-600">Access:</span>
                <span className={isMidtermUnlocked ? 'text-emerald-700' : 'text-slate-500'}>
                  {isMidtermUnlocked ? '🔓 Unlocked for Download' : '🔒 Pay 50% Milestone to Unlock'}
                </span>
              </div>
            </div>

            {/* Step 3: 100% Full Balance */}
            <div className={`p-4 rounded-2xl border-2 transition-all ${
              isFullySettled
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                : 'bg-purple-50/50 border-purple-200 text-purple-950'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-slate-200">
                  Milestone 3 • 100% Settlement
                </span>
                {isFullySettled ? (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Fully Paid
                  </span>
                ) : (
                  <span className="text-xs font-bold text-purple-700 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> ₹{balanceAmount} Due
                  </span>
                )}
              </div>
              <h4 className="font-bold text-sm text-slate-900">Phases 3-5: Clean Code, IEEE &amp; Viva</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Clean source code ZIP, IEEE thesis, presentation slides, viva Q&amp;A guide, and Turnitin certificate.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-600">Access:</span>
                <span className={isFullySettled ? 'text-emerald-700' : 'text-purple-700'}>
                  {isFullySettled ? '🔓 100% Fully Unlocked' : `🔒 Unlock Clean Files (₹${balanceAmount})`}
                </span>
              </div>
            </div>
          </div>

          {/* Phase Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100">
            {[
              { id: 'all', label: `All Deliverables (${order.attachments?.length || 0})` },
              { id: 'phase_1', label: 'Phase 1: Scope & UML (30%)' },
              { id: 'phase_2', label: 'Phase 2: Prototype & DevOps (50%)' },
              { id: 'phase_3', label: 'Phase 3: Source Code ZIP (100%)' },
              { id: 'phase_4', label: 'Phase 4: IEEE Report & PPT (100%)' },
              { id: 'phase_5', label: 'Phase 5: Viva & Certificate (100%)' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePhaseTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activePhaseTab === tab.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Structured Phase Sections */}
          <div className="space-y-6">
            {[
              {
                id: 'phase_1',
                title: 'Phase 1: Project Scope, Synopsis & UML Architecture',
                milestoneText: 'Unlocked at 30% Advance Payment',
                isUnlocked: advanceConfirmed,
                reqPercent: 30,
                desc: 'Official project synopsis, SRS software requirement specification, Level-0/1 DFD, and ER schema diagrams.',
                files: (order.attachments || []).filter(a => getAttachmentPhase(a) === 'phase_1')
              },
              {
                id: 'phase_2',
                title: 'Phase 2: Working Prototype & DevOps Snapshot',
                milestoneText: 'Unlocked at 50% Milestone Payment',
                isUnlocked: isMidtermUnlocked,
                reqPercent: 50,
                desc: 'Intermediate functional prototype code, video demo preview, setup instructions, and container configuration.',
                files: (order.attachments || []).filter(a => getAttachmentPhase(a) === 'phase_2')
              },
              {
                id: 'phase_3',
                title: 'Phase 3: Full Production Source Code Package',
                milestoneText: 'Unlocked at 100% Final Settlement',
                isUnlocked: isFullySettled,
                reqPercent: 100,
                desc: 'Uncompressed production source code package (ZIP), backend & frontend modules, database schema SQL, and environment configuration.',
                files: (order.attachments || []).filter(a => getAttachmentPhase(a) === 'phase_3')
              },
              {
                id: 'phase_4',
                title: 'Phase 4: Comprehensive IEEE Report & PPT Presentation',
                milestoneText: 'Unlocked at 100% Final Settlement',
                isUnlocked: isFullySettled,
                reqPercent: 100,
                desc: 'Double-column IEEE research paper draft, full 60-80 page academic thesis documentation, and 15-20 slide presentation deck.',
                files: (order.attachments || []).filter(a => getAttachmentPhase(a) === 'phase_4')
              },
              {
                id: 'phase_5',
                title: 'Phase 5: Viva Defense Guide & Turnitin Verification',
                milestoneText: 'Unlocked at 100% Final Settlement',
                isUnlocked: isFullySettled,
                reqPercent: 100,
                desc: 'Viva-voce Q&A question bank, examiner defense cheat-sheet, Turnitin similarity verification certificate (< 10%), and video walkthrough.',
                files: (order.attachments || []).filter(a => getAttachmentPhase(a) === 'phase_5')
              }
            ]
              .filter(phase => activePhaseTab === 'all' || activePhaseTab === phase.id)
              .map(phase => {
                const phaseUnlocked = phase.isUnlocked || user?.role === 'admin';

                return (
                  <div key={phase.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900">{phase.title}</h4>
                          <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {phase.milestoneText}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{phase.desc}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {phaseUnlocked ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                            <Unlock className="w-3.5 h-3.5 text-emerald-600" /> Unlocked
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-amber-600" /> Locked • {phase.reqPercent}% Milestone
                          </span>
                        )}
                      </div>
                    </div>

                    {phase.files.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {phase.files.map(att => {
                          const isZip = att.file_name.endsWith('.zip') || att.file_type.includes('Code');
                          const isPdf = att.file_name.endsWith('.pdf') || att.file_type.includes('Report');
                          const isPpt = att.file_name.endsWith('.ppt') || att.file_name.endsWith('.pptx') || att.file_type.includes('PPT');
                          const fileUnlocked = isAttachmentUnlocked(att);

                          return (
                            <div
                              key={att.id}
                              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-brand-300 transition-all shadow-sm space-y-3 flex flex-col justify-between"
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
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
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 truncate max-w-[140px]">
                                      {att.file_type || 'Project Deliverable'}
                                    </span>
                                    {fileUnlocked ? (
                                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                        Ready
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                        Locked
                                      </span>
                                    )}
                                  </div>
                                  <h5 className="text-xs font-bold text-slate-900 truncate" title={att.file_name}>
                                    {att.file_name}
                                  </h5>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    Uploaded by Mentor • {att.created_at ? new Date(att.created_at).toLocaleDateString() : 'Ready'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenPreview(att.id, att.file_name)}
                                  className="flex-1 btn-secondary py-1.5 text-xs font-bold flex items-center justify-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5 text-brand-600" /> Preview
                                </button>

                                {fileUnlocked ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadDeliverable(att.id, att.file_name)}
                                    className="flex-1 btn-primary py-1.5 text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                                  >
                                    <Download className="w-3.5 h-3.5" /> Download
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPaymentModalType('balance');
                                      setPaymentModalOpen(true);
                                    }}
                                    className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-800 py-1.5 text-xs font-bold flex items-center justify-center gap-1 border border-amber-200 rounded-xl"
                                    title="Unlock clean file by completing milestone balance"
                                  >
                                    <Lock className="w-3.5 h-3.5 text-amber-600" /> Unlock (₹{balanceAmount})
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-white/70 text-center space-y-1.5">
                        <Package className="w-6 h-6 text-slate-300 mx-auto" />
                        <h6 className="text-xs font-bold text-slate-600">Deliverables in Preparation by Mentor</h6>
                        <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                          Mentor is compiling files for this milestone. As soon as uploaded, it will automatically appear here under {phase.milestoneText}.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

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

        {paymentModalOpen && (
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
        )}

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

        {/* Milestone Lock Guidance Modal */}
        {lockedFeatureInfo && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-slide-up border border-slate-100 text-left">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold">
                  <Lock className="w-6 h-6" />
                </div>
                <button
                  type="button"
                  onClick={() => setLockedFeatureInfo(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {lockedFeatureInfo.requiredMilestone}
                  </span>
                  <span className="text-xs text-slate-400">Milestone Restricted</span>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {lockedFeatureInfo.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lockedFeatureInfo.description}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-600 font-semibold">
                  <span>Current Paid:</span>
                  <span className="text-slate-900 font-bold">₹{totalPaid} / ₹{totalPrice} ({paidPercent}%)</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-brand-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, paidPercent)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>Remaining Balance Due:</span>
                  <span className="font-extrabold text-brand-700 text-xs">₹{balanceAmount}</span>
                </div>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setLockedFeatureInfo(null)}
                  className="flex-1 btn-secondary py-2.5 text-xs font-bold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLockedFeatureInfo(null);
                    setPaymentModalType('balance');
                    setPaymentModalOpen(true);
                  }}
                  className="flex-1 btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/20"
                >
                  <ShieldCheck className="w-4 h-4" /> Pay &amp; Unlock
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OrderDetail;
