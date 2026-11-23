import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MessageCircle, Clock, CheckCircle, TrendingUp, ExternalLink, ShieldCheck, Sparkles, Video } from 'lucide-react';
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
  const upcomingWalkthroughOrder = orders.find(
    o => o.walkthrough_meeting_url && o.walkthrough_scheduled_at && new Date(o.walkthrough_scheduled_at) > new Date(Date.now() - 4 * 3600 * 1000)
  );
  const totalSpent = orders.reduce((sum, o) => sum + (o.advance_amount || 0) + (o.status === 'completed' ? (o.balance_amount || 0) : 0), 0);

  const stats = [
    { label: 'Active Orders', value: activeOrders.length, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Completed', value: completedOrders.length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Paid', value: `₹${totalSpent.toLocaleString()}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">Track your projects and start new ones</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2">
            <OnlineIndicator isOnline={adminOnline} />
            <span className="text-sm text-gray-600">Admin {adminOnline ? 'available' : 'offline'}</span>
          </div>
          <Link to="/order/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        </div>
      </div>

      {/* 1-on-1 Walkthrough Session Live Banner */}
      {upcomingWalkthroughOrder && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-slide-up">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Video className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 bg-white/10 px-2 py-0.5 rounded">
                Live 1-on-1 Mentorship Session
              </span>
              <h3 className="font-bold text-base sm:text-lg mt-0.5">
                {upcomingWalkthroughOrder.project_title} ({upcomingWalkthroughOrder.order_number})
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Scheduled for {new Date(upcomingWalkthroughOrder.walkthrough_scheduled_at!).toLocaleString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} IST. Click to join your live mentor room.
              </p>
            </div>
          </div>

          <a
            href={upcomingWalkthroughOrder.walkthrough_meeting_url}
            target="_blank"
            rel="noreferrer"
            className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs px-5 py-3 rounded-xl shadow-md flex items-center justify-center gap-2 shrink-0 transition-all"
          >
            <Video className="w-4 h-4 text-emerald-700" /> Enter Live Meet Room
          </a>
        </div>
      )}

      {/* Action Required: Ready for Review Alert Banner */}
      {readyReviewOrders.length > 0 && (
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-brand-600 text-white p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-slide-up">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200 bg-white/10 px-2 py-0.5 rounded">
                Action Required
              </span>
              <h3 className="font-bold text-base sm:text-lg mt-0.5">
                Deliverables Ready for Review ({readyReviewOrders.length} Order Waiting)
              </h3>
              <p className="text-xs text-purple-100 mt-0.5">
                The mentor has finished your code and files. Pay remaining 70% fee to unlock all download packages!
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
            className="bg-white text-purple-800 hover:bg-purple-50 font-bold text-xs px-5 py-3 rounded-xl shadow-md flex items-center justify-center gap-2 shrink-0 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-purple-700" /> Pay Remaining Fee (₹{readyReviewOrders[0].balance_amount})
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {stats.map(s => (
          <div key={s.label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center`}>
              <s.icon className={`w-6 h-6 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">My Orders</h2>
          <span className="text-sm text-gray-500">{orders.length} total</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 text-sm mb-6">Start your first project request</p>
            <Link to="/order/new" className="btn-primary">
              <Plus className="w-4 h-4" /> New Project
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Order #', 'Project', 'Status', 'Deadline', 'Amount', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-blue-600 font-semibold">{order.order_number}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 text-sm">{order.project_title}</p>
                      <p className="text-xs text-gray-500">{order.domain}</p>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(order.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">Total: ₹{order.total_price.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Adv Paid: ₹{order.advance_amount.toLocaleString()}</p>
                      {order.status === 'ready_for_review' && (
                        <p className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded mt-1 w-fit">
                          Remaining: ₹{order.balance_amount.toLocaleString()}
                        </p>
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
                            className="btn-accent text-xs px-3 py-1.5 font-bold shadow-sm flex items-center gap-1 shrink-0"
                            title="Pay Remaining Balance Fee"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Pay Remaining (₹{order.balance_amount})
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
                            className="btn-primary text-xs px-3 py-1.5 font-bold shadow-sm shrink-0"
                          >
                            Pay 30% Advance (₹{order.advance_amount})
                          </button>
                        )}

                        <Link to={`/order/${order.id}`} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="View Order">
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link to={`/chat/${order.id}`} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors" title="Chat">
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
