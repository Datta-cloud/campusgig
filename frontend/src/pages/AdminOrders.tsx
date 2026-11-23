import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Filter, MessageCircle, ExternalLink, Upload, CheckCircle2,
  Clock, Shield, AlertCircle, X, Download, RefreshCw
} from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { Order } from '../types';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Status Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [statusTotalPrice, setStatusTotalPrice] = useState<string>('');
  const [statusAdvanceAmount, setStatusAdvanceAmount] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Deliverable Upload Modal
  const [uploadOrder, setUploadOrder] = useState<Order | null>(null);
  const [uploadTotalPrice, setUploadTotalPrice] = useState<string>('');
  const [deliverableFile, setDeliverableFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState('deliverable');
  const [phaseName, setPhaseName] = useState('Phase 1: Project Scope, Synopsis & Architecture');
  const [uploading, setUploading] = useState(false);

  // Plagiarism Score Modal
  const [plagOrder, setPlagOrder] = useState<Order | null>(null);
  const [plagiarismScore, setPlagiarismScore] = useState<number>(3.5);
  const [aiScore, setAiScore] = useState<number>(0.0);
  const [plagReportUrl, setPlagReportUrl] = useState('');
  const [savingPlag, setSavingPlag] = useState(false);

  const PHASES = [
    { id: 'Phase 1: Project Scope, Synopsis & Architecture', label: '📐 Phase 1: Scope, Synopsis & UML Architecture (Unlocked at 30% Advance)', type: 'deliverable' },
    { id: 'Phase 2: Working Prototype & Code Draft', label: '🚀 Phase 2: Working Prototype & Code Draft (Unlocked at 50% Milestone)', type: 'preview' },
    { id: 'Phase 3: Full Production Source Code Package', label: '📦 Phase 3: Full Source Code Package (ZIP) (Unlocked at 100% Settlement)', type: 'deliverable' },
    { id: 'Phase 4: Comprehensive Project Report & IEEE Paper', label: '📄 Phase 4: Comprehensive IEEE Report & PPT Presentation (Unlocked at 100% Settlement)', type: 'deliverable' },
    { id: 'Phase 5: Viva & Exam Defense Guide', label: '🎓 Phase 5: Viva Defense Guide & Turnitin Verification (Unlocked at 100% Settlement)', type: 'deliverable' },
    { id: 'Phase 6: Code Walkthrough Video', label: '🎥 Phase 6: Code Walkthrough Video Recording (Unlocked at 100% Settlement)', type: 'deliverable' },
    { id: 'Reference Material', label: '🛠️ Reference Material / Dataset (Unlocked at 30% Advance)', type: 'reference' },
  ];

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      const list = Array.isArray(res.data) ? res.data : (res.data.orders || []);
      setOrders(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    setUpdatingStatus(true);
    try {
      await api.put(`/orders/${selectedOrder.id}/status`, {
        status: newStatus,
        admin_notes: adminNotes,
        total_price: statusTotalPrice ? Number(statusTotalPrice) : undefined,
        advance_amount: statusAdvanceAmount ? Number(statusAdvanceAmount) : undefined,
      });
      alert(`Order ${selectedOrder.order_number} status updated to ${newStatus}`);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to update order status'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUploadDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadOrder || !deliverableFile) return;

    const formData = new FormData();
    formData.append('file', deliverableFile);
    formData.append('file_type', fileType);
    formData.append('phase_name', phaseName);
    if (uploadTotalPrice && Number(uploadTotalPrice) > 0) {
      formData.append('updated_total_price', uploadTotalPrice);
    }

    setUploading(true);
    try {
      await api.post(`/admin/orders/${uploadOrder.id}/upload-deliverable`, formData);
      alert(`Deliverable uploaded for ${phaseName}! Student can now preview/download it.`);
      setUploadOrder(null);
      setDeliverableFile(null);
      fetchOrders();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to upload deliverable'));
    } finally {
      setUploading(false);
    }
  };

  const handleSavePlagiarism = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plagOrder) return;
    setSavingPlag(true);
    try {
      await api.put(`/admin/orders/${plagOrder.id}/plagiarism`, {
        plagiarism_score: Number(plagiarismScore),
        ai_detection_score: Number(aiScore),
        report_url: plagReportUrl || null,
      });
      alert(`Plagiarism score updated to ${plagiarismScore}% for ${plagOrder.order_number}!`);
      setPlagOrder(null);
      fetchOrders();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to update plagiarism scores'));
    } finally {
      setSavingPlag(false);
    }
  };

  const handleAcceptRevision = async (orderId: number) => {
    try {
      await api.post(`/orders/${orderId}/accept-revision`);
      alert(`Revision accepted! Order status changed to In Progress.`);
      fetchOrders();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to accept revision'));
    }
  };

  const handleVerifyPayment = async (orderId: number, action: 'approve' | 'reject') => {
    let reason: string | undefined = undefined;
    if (action === 'reject') {
      const promptRes = prompt('Reason for rejection (e.g. UTR not found in bank statement):');
      if (promptRes === null) return;
      reason = promptRes;
    }
    try {
      await api.post(`/admin/orders/${orderId}/verify-payment`, { action, notes: reason });
      alert(action === 'approve' ? '✅ Payment verified and credited successfully!' : '❌ Payment rejected. Order reset.');
      fetchOrders();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to update payment status'));
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch =
      o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.student?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const activeOrders = filteredOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const completedOrders = filteredOrders.filter(o => o.status === 'completed');

  const renderOrderRow = (o: Order) => (
    <tr key={o.id} className="hover:bg-slate-50/80 transition-all">
      <td className="py-3.5 px-4 font-mono font-bold text-brand-600">
        {o.order_number}
      </td>
      <td className="py-3.5 px-4">
        <span className="font-bold text-slate-900 block">{o.student?.full_name || 'Student'}</span>
        <span className="text-[10px] text-slate-400 block">{o.student?.email}</span>
        <span className="text-[10px] text-slate-500 font-semibold">{o.student?.college_name || o.student_type}</span>
      </td>
      <td className="py-3.5 px-4 max-w-xs">
        <span className="font-bold text-slate-800 line-clamp-1">{o.project_title}</span>
        <span className="text-[10px] text-slate-400">Deadline: {o.deadline ? new Date(o.deadline).toLocaleDateString() : 'N/A'}</span>
      </td>
      <td className="py-3.5 px-4">
        <span className="capitalize font-semibold text-slate-700">{o.domain || o.category_key}</span>
        <span className="text-[10px] text-slate-400 block uppercase">{o.student_type}</span>
      </td>
      <td className="py-3.5 px-4">
        <span className="font-bold text-slate-900 block">Total: ₹{o.total_price}</span>
        <span className="text-[10px] text-emerald-600">Adv: ₹{o.advance_amount}</span>
        <span className="text-[10px] text-slate-400 block">Bal: ₹{o.balance_amount}</span>
        {o.coupon_code && (
          <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded border border-amber-200 block mt-0.5 w-fit">
            🎟️ {o.coupon_code} (-₹{o.discount_amount || 0})
          </span>
        )}
      </td>
      <td className="py-3.5 px-4">
        <StatusBadge status={o.status} />
        {o.pending_payment_submission ? (
          <div className="mt-1 space-y-0.5">
            <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 block w-fit font-bold">
              UTR: {o.pending_payment_submission.utr_number}
            </span>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 block w-fit">
              Pay Submitted: ₹{o.pending_payment_submission.amount} ({o.pending_payment_submission.payment_type})
            </span>
          </div>
        ) : o.utr_number ? (
          <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 block mt-1 w-fit">
            UTR: {o.utr_number}
          </span>
        ) : null}
      </td>
      <td className="py-3.5 px-4 text-right space-x-1.5">
        {(o.status === 'payment_submitted' || o.status === 'balance_submitted') && (
          <span className="inline-flex items-center gap-1 mr-1">
            <button
              type="button"
              onClick={() => handleVerifyPayment(o.id, 'approve')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] px-2.5 py-1 rounded-xl font-bold inline-flex items-center gap-1 shadow-sm"
              title="Verify Bank Statement & Approve"
            >
              <CheckCircle2 className="w-3 h-3" /> Approve ₹{o.pending_payment_submission?.amount || (o.status === 'balance_submitted' ? o.balance_amount : o.advance_amount)}
            </button>
            <button
              type="button"
              onClick={() => handleVerifyPayment(o.id, 'reject')}
              className="bg-red-100 hover:bg-red-200 text-red-700 text-[11px] px-2 py-1 rounded-xl font-bold inline-flex items-center gap-1"
              title="Reject Invalid UTR"
            >
              <X className="w-3 h-3" /> Reject
            </button>
          </span>
        )}

        {o.status === 'revision_requested' && (
          <button
            type="button"
            onClick={() => handleAcceptRevision(o.id)}
            className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] px-2.5 py-1 rounded-xl font-bold inline-flex items-center gap-1 shadow-sm"
            title="Accept Revision Request"
          >
            <RefreshCw className="w-3 h-3 text-amber-700" /> Accept Rev
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setPlagOrder(o);
            setPlagiarismScore((o as any).plagiarism_score || 3.8);
            setAiScore((o as any).ai_detection_score || 0.0);
            setPlagReportUrl((o as any).plagiarism_report_url || '');
          }}
          className="btn-secondary text-[11px] px-2 py-1 font-bold inline-flex items-center gap-1 text-emerald-700 hover:bg-emerald-50"
          title="Set Plagiarism & AI Score"
        >
          <Shield className="w-3 h-3 text-emerald-600" /> Plag
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedOrder(o);
            setNewStatus(o.status);
            setAdminNotes(o.admin_notes || '');
            setStatusTotalPrice(String(o.total_price));
            setStatusAdvanceAmount(String(o.advance_amount || 0));
          }}
          className="btn-secondary text-[11px] px-2.5 py-1 font-bold"
        >
          Status
        </button>

        <button
          type="button"
          onClick={() => {
            setUploadOrder(o);
            setUploadTotalPrice(String(o.total_price));
            setDeliverableFile(null);
          }}
          className="btn-secondary text-[11px] px-2.5 py-1 font-bold inline-flex items-center gap-1"
          title="Upload Source Code / Deliverables"
        >
          <Upload className="w-3 h-3 text-purple-600" /> Deliver
        </button>

        <Link
          to={`/admin/chat/${o.id}`}
          className="btn-primary text-[11px] px-2.5 py-1 font-bold inline-flex items-center gap-1"
        >
          <MessageCircle className="w-3 h-3" /> Chat
        </Link>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-8 bg-slate-50 min-h-screen">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Student Orders Management</h1>
          <p className="text-xs text-slate-500">Track and update project lifecycles, upload deliverables & verify payments</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search order, student, title..."
            className="input-field pl-10 text-xs py-2.5"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'all', label: 'All Orders' },
          { id: 'pending_payment', label: 'Pending Advance' },
          { id: 'advance_paid', label: 'Advance Paid (30%)' },
          { id: 'in_progress', label: 'In Progress' },
          { id: 'ready_for_review', label: 'Ready for Review' },
          { id: 'completed', label: 'Completed (100%)' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === tab.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CASE 1: Default 'all' view shows Active Pipeline on top, and Completed Orders at bottom */}
      {statusFilter === 'all' ? (
        <div className="space-y-8">
          {/* Active Orders Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-600 animate-pulse"></span>
                🚀 Active Project Pipeline ({activeOrders.length})
              </h2>
              <span className="text-xs text-slate-500 font-medium">In-flight deliveries, payments & reviews</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Order Ref</th>
                      <th className="py-3.5 px-4">Student Info</th>
                      <th className="py-3.5 px-4">Project Title</th>
                      <th className="py-3.5 px-4">Domain / Type</th>
                      <th className="py-3.5 px-4">Pricing</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {activeOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400">
                          No active projects currently in the pipeline.
                        </td>
                      </tr>
                    ) : (
                      activeOrders.map(renderOrderRow)
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Completed Orders Section (Positioned at bottom with dedicated header) */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ✓ Completed Projects & Certified Students ({completedOrders.length})
              </h2>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                100% Fully Settled & Delivered
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-emerald-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-emerald-50/60 text-emerald-800 uppercase tracking-wider text-[10px] border-b border-emerald-100">
                    <tr>
                      <th className="py-3.5 px-4">Order Ref</th>
                      <th className="py-3.5 px-4">Student Info</th>
                      <th className="py-3.5 px-4">Project Title</th>
                      <th className="py-3.5 px-4">Domain / Type</th>
                      <th className="py-3.5 px-4">Pricing</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {completedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400">
                          No completed projects recorded yet.
                        </td>
                      </tr>
                    ) : (
                      completedOrders.map(renderOrderRow)
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CASE 2: Specific status tab is selected */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              {statusFilter === 'completed'
                ? `✓ Completed Projects & Certified Students (${filteredOrders.length})`
                : `Filtered Orders (${filteredOrders.length})`}
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Order Ref</th>
                    <th className="py-3.5 px-4">Student Info</th>
                    <th className="py-3.5 px-4">Project Title</th>
                    <th className="py-3.5 px-4">Domain / Type</th>
                    <th className="py-3.5 px-4">Pricing</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No orders match your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(renderOrderRow)
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Update Order {selectedOrder.order_number}
              </h3>
              <button type="button" onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select New Status</label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="input-field text-xs font-semibold"
              >
                <option value="pending_payment">Pending Advance Payment</option>
                <option value="advance_paid">Advance Paid (30%)</option>
                <option value="in_progress">In Progress (Developing Code/Report)</option>
                <option value="ready_for_review">Ready for Review (Demo Ready)</option>
                <option value="completed">Completed (100% Paid & Delivered)</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Admin Internal / Status Notes</label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                placeholder="e.g., Code completed, uploaded preview video"
                className="input-field text-xs"
              />
            </div>

            {/* Amount / Pricing Adjustment */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">Pricing &amp; Milestone Amounts</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Total Price (₹)</label>
                  <input
                    type="number"
                    step="1"
                    value={statusTotalPrice}
                    onChange={e => setStatusTotalPrice(e.target.value)}
                    className="w-full input-field text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Advance Amount (₹)</label>
                  <input
                    type="number"
                    step="1"
                    value={statusAdvanceAmount}
                    onChange={e => setStatusAdvanceAmount(e.target.value)}
                    className="w-full input-field text-xs font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                <span>Calculated Balance Due:</span>
                <span className="font-extrabold text-emerald-600">
                  ₹{Math.max(0, (Number(statusTotalPrice) || 0) - (Number(statusAdvanceAmount) || 0))}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="btn-secondary text-xs px-4 py-2 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={updatingStatus}
                className="btn-primary text-xs px-4 py-2 font-bold"
              >
                {updatingStatus ? 'Updating...' : 'Save Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase-Wise Deliverable Upload Modal */}
      {uploadOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUploadDeliverable} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Phase-Wise Delivery
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">
                  Upload Deliverable for {uploadOrder.order_number}
                </h3>
              </div>
              <button type="button" onClick={() => setUploadOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Development Phase / Category *</label>
              <select
                value={phaseName}
                onChange={e => {
                  setPhaseName(e.target.value);
                  const selected = PHASES.find(p => p.id === e.target.value);
                  if (selected) setFileType(selected.type);
                }}
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Select File to Upload (.zip, .pdf, .pptx, .mp4, datasets - up to 500MB) *</label>
              <input
                type="file"
                onChange={e => setDeliverableFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer border border-slate-200 rounded-xl"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Files up to 500MB are supported (.zip, .pdf, .pptx, .mp4, datasets). Stored securely and immediately downloadable for the student.
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
                    placeholder={String(uploadOrder.total_price)}
                    className="w-full input-field pl-7 text-xs font-bold text-slate-800"
                  />
                </div>
                <div className="text-right text-[11px] bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                  <span className="text-slate-400 text-[10px] block">New Balance:</span>
                  <span className="font-extrabold text-emerald-600">
                    ₹{Math.max(0, (Number(uploadTotalPrice) || uploadOrder.total_price) - (uploadOrder.advance_amount || 0))}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500">
                Advance paid was ₹{uploadOrder.advance_amount || 0}. If changed, student's remaining payable balance updates automatically.
              </p>
            </div>

            {/* Already Uploaded Files for this order */}
            {uploadOrder.attachments && uploadOrder.attachments.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">Previously Uploaded Files ({uploadOrder.attachments.length}):</span>
                <div className="max-h-28 overflow-y-auto space-y-1">
                  {uploadOrder.attachments.map(att => (
                    <div key={att.id} className="flex justify-between items-center text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                      <span className="font-medium text-slate-800 truncate max-w-xs">{att.file_name}</span>
                      <span className="text-purple-600 font-bold text-[10px] bg-purple-50 px-1.5 py-0.5 rounded">{att.file_type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUploadOrder(null)}
                className="btn-secondary text-xs px-4 py-2 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !deliverableFile}
                className="btn-primary text-xs px-5 py-2 font-bold"
              >
                {uploading ? 'Uploading...' : 'Upload & Deliver to Student'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plagiarism & AI Verification Modal */}
      {plagOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Attach Plagiarism &amp; AI Score</h3>
                  <p className="text-xs text-slate-500 font-mono">{plagOrder.order_number}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPlagOrder(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlagiarism} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Turnitin Plagiarism Similarity (%) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={plagiarismScore}
                  onChange={e => setPlagiarismScore(Number(e.target.value))}
                  className="w-full input-field text-xs p-2.5 font-bold text-emerald-700"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">College acceptance benchmark is strictly &lt; 10%</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">AI-Generated Content Detection (%) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={aiScore}
                  onChange={e => setAiScore(Number(e.target.value))}
                  className="w-full input-field text-xs p-2.5 font-bold text-indigo-700"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Turnitin PDF Certificate URL (Optional)</label>
                <input
                  type="url"
                  value={plagReportUrl}
                  onChange={e => setPlagReportUrl(e.target.value)}
                  placeholder="https://.../turnitin_report.pdf"
                  className="w-full input-field text-xs p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPlagOrder(null)}
                  className="btn-secondary text-xs px-4 py-2 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPlag}
                  className="btn-primary text-xs px-5 py-2 font-bold"
                >
                  {savingPlag ? 'Saving...' : 'Save & Attach Badge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOrders;
