import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MessageCircle, Clock, CheckCircle, TrendingUp, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Order } from '../types';
import StatusBadge from '../components/StatusBadge';
import OnlineIndicator from '../components/OnlineIndicator';
import LoadingSpinner from '../components/LoadingSpinner';
import PaymentModal from '../components/PaymentModal';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminOnline, setAdminOnline] = useState(false);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<Order | null>(null);
  const [paymentModalType, setPaymentModalType] = useState<'advance' | 'balance'>('balance');

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my');
      setOrders(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAdminStatus = async () => {
      try {
        const res = await api.get('/admin/online-status');
        setAdminOnline(res.data.is_online);
      } catch {
        setAdminOnline(false);
      }
    };

    fetchOrders();
    fetchAdminStatus();
    const interval = setInterval(fetchAdminStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'completed');
  const readyReviewOrders = orders.filter(o => o.status === 'ready_for_review');
  const totalSpent = orders.reduce((sum, o) => sum + (o.advance_amount || 0) + (o.status === 'completed' ? (o.balance_amount || 0) : 0), 0);

  const stats = [
    { label: 'Active Orders', value: activeOrders.length, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Completed', value: completedOrders.length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Paid', value: `₹${totalSpent.toLocaleString()}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Quick Action Bar */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-brand-500/10 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-500/10 dark:bg-brand-500/20 px-2.5 py-0.5 rounded-full border border-brand-500/20">
                Scholar Portal
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">B.Tech / M.Tech Capstone</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome back, {user?.full_name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track project milestones, inspect code previews, and schedule 1-on-1 viva walkthroughs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-300">
              <OnlineIndicator isOnline={adminOnline} />
              <span>Dedicated Mentor {adminOnline ? 'Online' : 'On Standby'}</span>
            </div>

            <Link
              to="/order/new"
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md shadow-brand-500/25 flex items-center gap-2 hover:scale-[1.02] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Capstone Order</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Action Required: Ready for Review Alert Banner */}
      {readyReviewOrders.length > 0 && (
        <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-brand-600 text-white p-6 rounded-3xl shadow-xl shadow-purple-500/10 flex flex-col md:flex-row md:items-center md:justify-between gap-5 animate-slide-up border border-purple-400/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-200 bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
                  Deliverables Ready
                </span>
                <span className="text-xs text-purple-100 font-medium">Order #{readyReviewOrders[0].order_number}</span>
              </div>
              <h3 className="font-extrabold text-lg sm:text-xl text-white mt-1">
                Your Capstone Code &amp; IEEE Report are Ready!
              </h3>
              <p className="text-xs sm:text-sm text-purple-100/90 mt-0.5 max-w-xl">
                Source code preview is verified. Pay remaining balance to unlock instant high-speed ZIP package downloads.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedPaymentOrder(readyReviewOrders[0]);
              setPaymentModalType('balance');
              setPaymentModalOpen(true);
            }}
            className="bg-white hover:bg-slate-50 text-purple-900 font-extrabold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 shrink-0 transition-transform hover:scale-[1.02]"
          >
            <ShieldCheck className="w-4 h-4 text-purple-700" />
            <span>Pay Remaining Fee (₹{readyReviewOrders[0].balance_amount?.toLocaleString()})</span>
          </button>
        </div>
      )}

      {/* Stats KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {stats.map(s => (
          <div
            key={s.label}
            className="glass-panel p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 flex items-center gap-4 transition-all hover:border-brand-500/30 dark:hover:border-brand-500/30 hover:shadow-md"
          >
            <div className={`w-13 h-13 p-3 rounded-2xl ${s.bg} dark:bg-slate-800 flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50 shadow-inner`}>
              <s.icon className={`w-6 h-6 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{s.value}</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="glass-panel rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">My Orders &amp; Capstones</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Live progress tracker and milestone deliverables</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {orders.length} {orders.length === 1 ? 'Project' : 'Projects'} Total
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center text-3xl shadow-inner">
              📋
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">No Orders Created Yet</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-sm mx-auto mb-6">
              Launch your engineering capstone or academic research project with our vetted mentors.
            </p>
            <Link
              to="/order/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-brand-500/25"
            >
              <Plus className="w-4 h-4" /> Start Your First Project
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800/60">
                <tr>
                  {['Order #', 'Project Details', 'Milestone Status', 'Target Deadline', 'Financials', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-brand-600 dark:text-brand-400 text-xs">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{order.project_title}</p>
                      <span className="inline-block text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md mt-0.5">
                        {order.domain}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {new Date(order.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Total: ₹{order.total_price.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Adv Paid: ₹{order.advance_amount.toLocaleString()}
                      </p>
                      {order.status === 'ready_for_review' && (
                        <span className="inline-block text-[10px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 px-2 py-0.5 rounded-md mt-1">
                          Remaining: ₹{order.balance_amount.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {order.status === 'ready_for_review' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPaymentOrder(order);
                              setPaymentModalType('balance');
                              setPaymentModalOpen(true);
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-xl font-bold shadow-sm shadow-purple-500/20 flex items-center gap-1.5 transition-all"
                            title="Pay Remaining Balance Fee"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Pay Remaining (₹{order.balance_amount?.toLocaleString()})</span>
                          </button>
                        )}

                        {order.status === 'pending_payment' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPaymentOrder(order);
                              setPaymentModalType('advance');
                              setPaymentModalOpen(true);
                            }}
                            className="bg-brand-600 hover:bg-brand-700 text-white text-xs px-3 py-1.5 rounded-xl font-bold shadow-sm shadow-brand-500/20 transition-all"
                          >
                            Pay 30% Advance (₹{order.advance_amount?.toLocaleString()})
                          </button>
                        )}

                        <Link
                          to={`/order/${order.id}`}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/50 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                          title="View Order Deliverables & Suite"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/chat/${order.id}`}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          title="Chat with Mentor"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {selectedPaymentOrder && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          orderId={selectedPaymentOrder.id}
          orderNumber={selectedPaymentOrder.order_number}
          amount={paymentModalType === 'advance' ? selectedPaymentOrder.advance_amount : selectedPaymentOrder.balance_amount}
          totalPrice={selectedPaymentOrder.total_price}
          advanceAmount={selectedPaymentOrder.advance_amount}
          balanceAmount={selectedPaymentOrder.balance_amount}
          paymentType={paymentModalType}
          onSuccess={fetchOrders}
        />
      )}

    </div>
  );
};

export default StudentDashboard;
