import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Video, Calendar, Clock, CheckCircle2, X, ExternalLink,
  MessageCircle, Search, Filter, Plus, Edit3, Phone, Mail,
  Sparkles, Check, AlertCircle, RefreshCw, UserCheck
} from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface Meeting {
  id: number;
  order_id: number;
  order_number: string;
  project_title: string;
  order_status: string;
  student_id: number;
  student_name: string;
  student_email: string;
  student_phone: string;
  session_number: number;
  topic: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  mentor_notes?: string;
  recording_url?: string;
  created_at: string;
  is_today: boolean;
  is_upcoming: boolean;
}

export const AdminMeetings: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming' | 'completed'>('upcoming');
  const [searchTerm, setSearchTerm] = useState('');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    upcoming: 0,
    completed: 0
  });

  // Edit / Reschedule Modal State
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('11:00');
  const [editTopic, setEditTopic] = useState('');
  const [editMeetingUrl, setEditMeetingUrl] = useState('');
  const [editStatus, setEditStatus] = useState<string>('scheduled');
  const [editNotes, setEditNotes] = useState('');
  const [editRecordingUrl, setEditRecordingUrl] = useState('');
  const [updating, setUpdating] = useState(false);

  // New Meeting Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [newOrderId, setNewOrderId] = useState<number | ''>('');
  const [newDate, setNewDate] = useState(() => {
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    return tm.toISOString().split('T')[0];
  });
  const [newTime, setNewTime] = useState('11:00');
  const [newTopic, setNewTopic] = useState('1-on-1 Code Walkthrough & Project Viva Mentorship');
  const [newCustomMeetUrl, setNewCustomMeetUrl] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/meetings');
      setMeetings(res.data.meetings || []);
      setStats({
        total: res.data.total_count || 0,
        today: res.data.today_count || 0,
        upcoming: res.data.upcoming_count || 0,
        completed: res.data.completed_count || 0
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveOrders = async () => {
    try {
      const res = await api.get('/admin/orders');
      const orders = res.data.orders || [];
      setActiveOrders(orders.filter((o: any) => o.status !== 'cancelled'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchActiveOrders();
  }, []);

  const openEditModal = (m: Meeting) => {
    setEditMeeting(m);
    try {
      const dt = new Date(m.scheduled_at);
      setEditDate(dt.toISOString().split('T')[0]);
      const hours = String(dt.getHours()).padStart(2, '0');
      const minutes = String(dt.getMinutes()).padStart(2, '0');
      setEditTime(`${hours}:${minutes}`);
    } catch {
      setEditDate('');
      setEditTime('11:00');
    }
    setEditTopic(m.topic || '');
    setEditMeetingUrl(m.meeting_url || '');
    setEditStatus(m.status || 'scheduled');
    setEditNotes(m.mentor_notes || '');
    setEditRecordingUrl(m.recording_url || '');
  };

  const handleUpdateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMeeting || updating) return;

    setUpdating(true);
    try {
      const scheduledIso = editDate && editTime ? new Date(`${editDate}T${editTime}:00`).toISOString() : undefined;
      await api.put(`/admin/meetings/${editMeeting.id}`, {
        status: editStatus,
        scheduled_at: scheduledIso,
        meeting_url: editMeetingUrl.trim() || undefined,
        mentor_notes: editNotes.trim(),
        recording_url: editRecordingUrl.trim()
      });
      alert('✅ Meeting schedule updated successfully!');
      setEditMeeting(null);
      fetchMeetings();
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to update meeting'));
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickMarkCompleted = async (m: Meeting) => {
    const notes = window.prompt("Optional mentor notes / summary for student:", m.mentor_notes || "Conducted walkthrough successfully");
    if (notes === null) return;
    try {
      await api.put(`/admin/meetings/${m.id}`, {
        status: 'completed',
        mentor_notes: notes
      });
      alert('🎉 Session marked as Completed! Student has been notified.');
      fetchMeetings();
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to complete session'));
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderId || creating) return;

    setCreating(true);
    try {
      const scheduledIso = new Date(`${newDate}T${newTime}:00`).toISOString();
      await api.post('/admin/meetings/schedule', {
        order_id: Number(newOrderId),
        scheduled_at: scheduledIso,
        topic: newTopic.trim(),
        meeting_url: newCustomMeetUrl.trim() || undefined
      });
      alert('✅ 1-on-1 Walkthrough scheduled! Student notified via WhatsApp & In-App.');
      setShowScheduleModal(false);
      setNewOrderId('');
      fetchMeetings();
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to schedule meeting'));
    } finally {
      setCreating(false);
    }
  };

  // Filter logic
  const filteredMeetings = meetings.filter(m => {
    // Search filter
    const q = searchTerm.toLowerCase();
    const matchSearch = (
      m.student_name?.toLowerCase().includes(q) ||
      m.order_number?.toLowerCase().includes(q) ||
      m.project_title?.toLowerCase().includes(q) ||
      m.topic?.toLowerCase().includes(q) ||
      m.student_email?.toLowerCase().includes(q)
    );
    if (!matchSearch) return false;

    if (activeTab === 'today') return m.is_today && m.status !== 'cancelled';
    if (activeTab === 'upcoming') return m.is_upcoming;
    if (activeTab === 'completed') return m.status === 'completed';
    return true;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Live Mentorship Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">1-on-1 Meeting Schedules</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage student code walkthroughs, viva examinations, and launch live video sessions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchMeetings}
            className="btn-secondary text-xs px-3.5 py-2.5 flex items-center gap-1.5 font-bold"
            title="Refresh Schedule"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2 font-bold shadow-md shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" /> Schedule New Session
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block">Total Sessions</span>
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Video className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block">Today's Live</span>
            <span className="text-2xl font-black text-emerald-600">{stats.today}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block">Upcoming</span>
            <span className="text-2xl font-black text-indigo-600">{stats.upcoming}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block">Conducted</span>
            <span className="text-2xl font-black text-purple-600">{stats.completed}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'upcoming'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            ⏳ Upcoming ({stats.upcoming})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'today'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            🟢 Today's Sessions ({stats.today})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'completed'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            ✓ Completed ({stats.completed})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Sessions ({stats.total})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search student, order, topic..."
            className="w-full pl-9 pr-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Meetings List / Grid */}
      {loading ? (
        <div className="py-16 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
            <Video className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">No Meeting Schedules Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm
              ? `No sessions match "${searchTerm}". Try a different keyword.`
              : activeTab === 'today'
              ? 'No 1-on-1 walkthrough sessions scheduled for today.'
              : 'No sessions scheduled in this filter tab.'}
          </p>
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="btn-primary text-xs px-4 py-2 font-bold inline-flex items-center gap-1.5 mt-2"
          >
            <Plus className="w-4 h-4" /> Schedule Walkthrough Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMeetings.map(m => {
            const dateObj = new Date(m.scheduled_at);
            const dateFormatted = dateObj.toLocaleDateString('en-IN', {
              weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
            });
            const timeFormatted = dateObj.toLocaleTimeString('en-IN', {
              hour: '2-digit', minute: '2-digit'
            });

            return (
              <div
                key={m.id}
                className={`bg-white rounded-3xl p-5 border transition-all hover:shadow-md flex flex-col justify-between space-y-4 ${
                  m.is_today && m.status === 'scheduled'
                    ? 'border-emerald-300 ring-2 ring-emerald-500/20'
                    : m.status === 'completed'
                    ? 'border-slate-200 opacity-90'
                    : 'border-slate-200'
                }`}
              >
                {/* Top Meta */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                      {m.order_number}
                    </span>

                    {/* Status Badge */}
                    {m.status === 'completed' ? (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3 text-purple-600" /> Conducted
                      </span>
                    ) : m.status === 'cancelled' ? (
                      <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <X className="w-3 h-3 text-red-600" /> Cancelled
                      </span>
                    ) : m.is_today ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Live Today
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-600" /> Scheduled
                      </span>
                    )}
                  </div>

                  {/* Project Title */}
                  <div>
                    <Link
                      to={`/order/${m.order_id}`}
                      className="font-black text-slate-900 text-sm hover:text-brand-600 transition-colors line-clamp-1 block"
                      title={m.project_title}
                    >
                      {m.project_title}
                    </Link>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded inline-block mt-1">
                      Session #{m.session_number} of 3 (30 mins)
                    </span>
                  </div>

                  {/* Date & Time Highlight Box */}
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/30 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <span>{dateFormatted}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-900 pl-6">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{timeFormatted} IST</span>
                    </div>
                  </div>

                  {/* Topic / Agenda */}
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Agenda / Topic:</span>
                    <p className="line-clamp-2 font-medium bg-white p-2 rounded-xl border border-slate-100 text-slate-700">
                      {m.topic || 'Line-by-Line Code Walkthrough & Viva Mentorship'}
                    </p>
                  </div>

                  {/* Student Details with WhatsApp */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{m.student_name}</span>
                      <span className="text-[11px] text-slate-400 truncate max-w-[150px] block">{m.student_email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {m.student_phone && (
                        <a
                          href={`https://wa.me/${m.student_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${m.student_name}, your 1-on-1 walkthrough for order ${m.order_number} is scheduled for ${dateFormatted} at ${timeFormatted}. Meet link: ${m.meeting_url}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors border border-emerald-200"
                          title="Message on WhatsApp"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <Link
                        to={`/admin/chat/${m.order_id}`}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-200"
                        title="Open Live Chat"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Mentor Notes / Recording */}
                  {m.mentor_notes && (
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900">
                      <strong>Mentor Notes:</strong> {m.mentor_notes}
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={m.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/15 bg-gradient-to-r from-emerald-600 to-teal-600"
                    >
                      <Video className="w-4 h-4" /> Join Live Meet
                    </a>

                    <button
                      type="button"
                      onClick={() => openEditModal(m)}
                      className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
                      title="Edit / Reschedule Meeting"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  {m.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => handleQuickMarkCompleted(m)}
                      className="w-full btn-secondary py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 border-emerald-200 flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Mark as Conducted
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Reschedule Modal */}
      {editMeeting && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-slide-up">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Edit / Reschedule Session</h3>
                  <p className="text-xs text-slate-500 font-mono">{editMeeting.order_number} • {editMeeting.student_name}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditMeeting(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateMeeting} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Date & Time Picker */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    required
                    className="w-full input-field text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Time Slot *
                  </label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={e => setEditTime(e.target.value)}
                    required
                    className="w-full input-field text-xs bg-white"
                  />
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Session Status *
                </label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full input-field text-xs bg-white"
                >
                  <option value="scheduled">Scheduled / Active</option>
                  <option value="completed">Conducted & Completed</option>
                  <option value="rescheduled">Rescheduled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Topic / Agenda
                </label>
                <input
                  type="text"
                  value={editTopic}
                  onChange={e => setEditTopic(e.target.value)}
                  placeholder="e.g. Line-by-Line Code Walkthrough & Defense Prep"
                  className="w-full input-field text-xs bg-white"
                />
              </div>

              {/* Meeting URL */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Video Meeting URL (Jitsi / Google Meet / Zoom)
                </label>
                <input
                  type="url"
                  value={editMeetingUrl}
                  onChange={e => setEditMeetingUrl(e.target.value)}
                  placeholder="https://meet.jit.si/... or https://meet.google.com/..."
                  className="w-full input-field text-xs font-mono bg-white"
                />
              </div>

              {/* Mentor Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Mentor Notes / Student Feedback
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Notes shared with the student regarding their viva preparation or code..."
                  className="w-full input-field text-xs bg-white"
                />
              </div>

              {/* Recording URL */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Session Recording URL (Drive / YouTube Unlisted)
                </label>
                <input
                  type="url"
                  value={editRecordingUrl}
                  onChange={e => setEditRecordingUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or unlisted link"
                  className="w-full input-field text-xs font-mono bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditMeeting(null)}
                  className="flex-1 btn-secondary text-xs py-2.5 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 btn-primary text-xs py-2.5 font-bold shadow-md shadow-brand-500/20"
                >
                  {updating ? 'Saving...' : 'Save & Notify Student'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Schedule New Meeting Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-slide-up">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Schedule 1-on-1 Walkthrough</h3>
                  <p className="text-xs text-slate-500">Book a 30-min live session for an active capstone order</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Order Select */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Select Student Project Order *
                </label>
                <select
                  value={newOrderId}
                  onChange={e => setNewOrderId(Number(e.target.value))}
                  required
                  className="w-full input-field text-xs bg-white"
                >
                  <option value="">-- Choose an active order --</option>
                  {activeOrders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.order_number} - {o.student_name || 'Student'} ({o.project_title.slice(0, 40)}...)
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Meeting Date *
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    required
                    className="w-full input-field text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Time Slot *
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    required
                    className="w-full input-field text-xs bg-white"
                  />
                </div>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Topic / Agenda
                </label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={e => setNewTopic(e.target.value)}
                  placeholder="e.g. Line-by-Line Code Walkthrough & Project Viva Mentorship"
                  className="w-full input-field text-xs bg-white"
                />
              </div>

              {/* Custom Meet URL (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Custom Video URL (Optional - leave blank for auto-generated room)
                </label>
                <input
                  type="url"
                  value={newCustomMeetUrl}
                  onChange={e => setNewCustomMeetUrl(e.target.value)}
                  placeholder="https://meet.google.com/... (optional)"
                  className="w-full input-field text-xs font-mono bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 btn-secondary text-xs py-2.5 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newOrderId}
                  className="flex-1 btn-primary text-xs py-2.5 font-bold shadow-md shadow-brand-500/20"
                >
                  {creating ? 'Scheduling...' : 'Schedule & Send Invite'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminMeetings;
