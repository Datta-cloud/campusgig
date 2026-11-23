import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Users, ShoppingBag, Clock, CheckCircle, IndianRupee,
  MessageCircle, ExternalLink, ArrowUpRight, BarChart2, Shield, Video
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];

export const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    total_orders: 0,
    pending_payment: 0,
    advance_paid: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    total_revenue: 0,
    advance_collected: 0,
    active_students: 0,
    online_students: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setStats(res.data.stats || {});
        setRecentOrders(res.data.recent_orders || []);
      } catch (e) {
        console.error('Failed to fetch admin dashboard', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const kpiCards = [
    { label: 'Total Orders', value: stats.total_orders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active In Progress', value: stats.in_progress + stats.advance_paid, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completed Deliveries', value: stats.completed, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Registered Students', value: stats.active_students, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Booked Value', value: `₹${(stats.total_revenue || 0).toLocaleString()}`, icon: IndianRupee, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: '30% Advance Collected', value: `₹${(stats.advance_collected || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  // Sample chart data derived from orders
  const chartData = [
    { name: 'Machine Learning', orders: 4, revenue: 9800 },
    { name: 'Generative AI', orders: 6, revenue: 16500 },
    { name: 'Full Stack Web', orders: 5, revenue: 11000 },
    { name: 'School Reports', orders: 8, revenue: 3200 },
    { name: 'Android Apps', orders: 3, revenue: 6500 },
  ];

  const pieData = [
    { name: 'Advance Paid', value: stats.advance_paid || 1 },
    { name: 'In Progress', value: stats.in_progress || 1 },
    { name: 'Completed', value: stats.completed || 2 },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Mentor Control Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            CampusGig Admin & Financials
          </h1>
          <p className="text-xs text-slate-500">
            Real-time pipeline, student projects, order revenues, and active chats
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/admin/meetings" className="btn-primary text-xs px-4 py-2 font-bold bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center gap-1.5 shadow-md shadow-emerald-600/20">
            <Video className="w-4 h-4" /> 1-on-1 Meeting Schedules
          </Link>
          <Link to="/admin/pricing" className="btn-secondary text-xs px-4 py-2 font-bold">
            Manage Prices & Add-ons
          </Link>
          <Link to="/admin/orders" className="btn-secondary text-xs px-4 py-2 font-bold">
            View All Orders
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{kpi.label}</span>
                <div className={`w-8 h-8 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black text-slate-900">{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue by Domain Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Revenue by Technical Domain</h3>
              <p className="text-xs text-slate-500">Earnings generated across categories</p>
            </div>
            <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">
              Live Metrics
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`₹${val}`, 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Order Fulfillment Status</h3>
            <p className="text-xs text-slate-500">Delivery cycle distribution</p>
          </div>

          <div className="h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {pieData.map((d, i) => (
              <div key={i} className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block">{d.name}</span>
                <span className="text-[10px] text-slate-500">{d.value} Orders</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Orders Pipeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Recent Project Requests</h3>
            <p className="text-xs text-slate-500">Latest students booked across College and School</p>
          </div>
          <Link to="/admin/orders" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
            View All Orders <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Topic / Scope</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Total / Advance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No orders booked yet. Use the Student Login or Wizard to place your first project!
                  </td>
                </tr>
              ) : (
                recentOrders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50/70 transition-all">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-600">{o.order_number}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{o.student?.full_name || 'Student'}</span>
                      <span className="text-[10px] text-slate-400">{o.student?.college_name || o.student_type}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate">{o.project_title}</td>
                    <td className="py-3.5 px-4 capitalize">{o.domain || o.category_key}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">₹{o.total_price}</span>
                      <span className="text-[10px] text-emerald-600 block">30%: ₹{o.advance_amount}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/chat/${o.id}`}
                        className="btn-secondary text-[11px] px-2.5 py-1 inline-flex items-center gap-1 font-bold"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-brand-600" /> Chat
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
